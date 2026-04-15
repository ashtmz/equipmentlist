const SPREADSHEET_ID = "";
const SHEET_NAME = "shared_state";
const CHUNK_SIZE = 40000;

function doGet(e) {
  const action = String(e?.parameter?.action || "getState").trim();

  if (action === "getState") {
    return respond_(e, readState_());
  }

  return respond_(e, {
    ok: false,
    error: "Unsupported action",
  });
}

function doPost(e) {
  const action = String(e?.parameter?.action || "").trim();

  if (action === "putState") {
    const payloadText = String(e?.parameter?.payload || "").trim();
    if (!payloadText) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: "Missing payload",
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const parsed = JSON.parse(payloadText);
    const revision = writeState_(parsed);

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      revision: revision,
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    ok: false,
    error: "Unsupported action",
  })).setMimeType(ContentService.MimeType.JSON);
}

function respond_(e, payload) {
  const callback = String(e?.parameter?.callback || "").trim();
  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
      return ContentService.createTextOutput("invalidCallback").setMimeType(ContentService.MimeType.TEXT);
    }

    return ContentService.createTextOutput(`${callback}(${JSON.stringify(payload)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getStateSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 4).setValues([["chunk_index", "chunk", "updated_at", "revision"]]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function readState_() {
  const sheet = getStateSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return {
      ok: true,
      hasState: false,
      state: null,
      updatedAt: "",
      revision: "",
    };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const chunks = rows
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map((row) => String(row[1] || ""));
  const serialized = chunks.join("");
  const updatedAt = String(rows[0][2] || "");
  const revision = String(rows[0][3] || updatedAt || "");

  return {
    ok: true,
    hasState: Boolean(serialized),
    state: serialized ? JSON.parse(serialized) : null,
    updatedAt: updatedAt,
    revision: revision,
  };
}

function writeState_(state) {
  const sheet = getStateSheet_();
  const revision = new Date().toISOString();
  const serialized = JSON.stringify({
    equipment: Array.isArray(state?.equipment) ? state.equipment : [],
    packs: Array.isArray(state?.packs) ? state.packs : [],
    extraFeeTemplates: Array.isArray(state?.extraFeeTemplates) ? state.extraFeeTemplates : [],
    history: Array.isArray(state?.history) ? state.history : [],
    nextId: Number(state?.nextId || 1),
    estimateProjects: Array.isArray(state?.estimateProjects) ? state.estimateProjects : [],
    selectionProjects: Array.isArray(state?.selectionProjects) ? state.selectionProjects : [],
    dependencyRules: Array.isArray(state?.dependencyRules) ? state.dependencyRules : [],
    _meta: state?._meta && typeof state._meta === "object" ? state._meta : {},
  });
  const chunks = chunkString_(serialized, CHUNK_SIZE);

  sheet.clearContents();
  sheet.getRange(1, 1, 1, 4).setValues([["chunk_index", "chunk", "updated_at", "revision"]]);
  sheet.setFrozenRows(1);

  if (chunks.length > 0) {
    sheet.getRange(2, 1, chunks.length, 4).setValues(
      chunks.map((chunk, index) => [index + 1, chunk, revision, revision])
    );
  }

  return revision;
}

function chunkString_(value, size) {
  const chunks = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
}
