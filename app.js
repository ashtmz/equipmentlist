const STORAGE_KEYS = {
  equipment: "equipment-manager-equipment",
  history: "equipment-manager-history",
  nextId: "equipment-manager-next-id",
  selectionProjects: "equipment-manager-selection-projects",
};

const INITIAL_EQUIPMENT = [
  { id: 1, manufacturer: "SHURE", name: "SM58", genre: "マイク", types: ["ボーカル"], stock: 8, notes: "定番ダイナミックマイク", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "音響部", qty: 8 }] },
  { id: 2, manufacturer: "SENNHEISER", name: "e935", genre: "マイク", types: ["ボーカル"], stock: 4, notes: "", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "音響部", qty: 4 }] },
  { id: 3, manufacturer: "DPA", name: "4099", genre: "マイク", types: ["楽器収音"], stock: 6, notes: "クリップ式コンデンサー", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "音響部", qty: 6 }] },
  { id: 4, manufacturer: "YAMAHA", name: "CL5", genre: "ミキサー", types: ["PA"], stock: 1, notes: "デジタルコンソール", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "音響部", qty: 1 }] },
  { id: 5, manufacturer: "QSC", name: "K12.2", genre: "スピーカー", types: ["PA"], stock: 4, notes: "パワードスピーカー", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "音響部", qty: 4 }] },
  { id: 6, manufacturer: "ETC", name: "Ion Xe", genre: "調光卓", types: ["照明"], stock: 1, notes: "", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "照明部", qty: 1 }] },
  { id: 7, manufacturer: "ETC", name: "Source Four", genre: "灯体", types: ["照明"], stock: 12, notes: "750W エリスポ", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "照明部", qty: 12 }] },
  { id: 8, manufacturer: "Blackmagic Design", name: "ATEM Mini Extreme", genre: "スイッチャー", types: ["映像", "配信"], stock: 2, notes: "配信用", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "映像部", qty: 2 }] },
  { id: 9, manufacturer: "Canon", name: "XA75", genre: "カメラ", types: ["映像"], stock: 3, notes: "業務用カムコーダー", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "映像部", qty: 3 }] },
  { id: 10, manufacturer: "Sennheiser", name: "EW-D", genre: "ワイヤレス", types: ["PA"], stock: 6, notes: "デジタルワイヤレスシステム", imageUrl: "", imageFileData: "", imageFileName: "", manualUrl: "", manualFileData: "", manualFileName: "", ownerships: [{ name: "音響部", qty: 6 }] },
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function toPositiveInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const APP_CONFIG = window.APP_CONFIG ?? {};
const SHARED_STORE_CONFIG = APP_CONFIG.sharedStore ?? {};
const REMOTE_STORE = {
  mode: String(SHARED_STORE_CONFIG.mode || "").trim(),
  webAppUrl: String(SHARED_STORE_CONFIG.webAppUrl || "").trim(),
  pollMs: Math.max(3000, toPositiveInt(SHARED_STORE_CONFIG.pollMs, 8000)),
};

function isRemoteStoreEnabled() {
  return REMOTE_STORE.mode === "apps-script" && Boolean(REMOTE_STORE.webAppUrl);
}

function mergeOwnerships(ownerships) {
  const merged = new Map();

  ownerships.forEach((entry) => {
    const name = String(entry?.name ?? "").trim();
    const qty = toPositiveInt(entry?.qty, 0);
    if (!name) {
      return;
    }
    merged.set(name, (merged.get(name) ?? 0) + qty);
  });

  return Array.from(merged.entries()).map(([name, qty]) => ({ name, qty }));
}

function normalizeOwnerships(rawOwnerships, fallbackOwner, fallbackStock) {
  const merged = mergeOwnerships(Array.isArray(rawOwnerships) ? rawOwnerships : []);

  if (merged.length > 0) {
    return merged;
  }

  const stock = toPositiveInt(fallbackStock, 0);
  return [{ name: String(fallbackOwner || "未設定").trim() || "未設定", qty: stock }];
}

function normalizeEquipment(item, index) {
  const ownerships = normalizeOwnerships(item?.ownerships, item?.owner, item?.stock);
  const ownershipTotal = ownerships.reduce((sum, entry) => sum + entry.qty, 0);
  const stock = ownershipTotal;
  const rawName = String(item?.name ?? "").trim();
  const rawManufacturer = String(item?.manufacturer ?? "").trim();
  const nameParts = rawName.split(/\s+/).filter(Boolean);
  const manufacturer = rawManufacturer || (nameParts.length >= 2 ? nameParts[0] : "");
  const name = rawManufacturer
    ? rawName
    : nameParts.length >= 2
      ? nameParts.slice(1).join(" ")
      : rawName;
  const rawGenres = Array.isArray(item?.genres) ? item.genres : [item?.genre ?? ""];
  const genres = [...new Set(rawGenres.map((entry) => String(entry ?? "").trim()).filter(Boolean))];
  const rawTypes = Array.isArray(item?.types) ? item.types : [item?.type ?? item?.purpose ?? ""];
  const types = [...new Set(rawTypes.map((entry) => String(entry ?? "").trim()).filter(Boolean))];

  return {
    id: toPositiveInt(item?.id, index + 1),
    manufacturer,
    name,
    genres,
    genre: genres[0] || "",
    types,
    stock,
    notes: String(item?.notes ?? "").trim(),
    imageUrl: String(item?.imageUrl ?? "").trim(),
    imageFileData: String(item?.imageFileData ?? "").trim(),
    imageFileName: String(item?.imageFileName ?? "").trim(),
    manualUrl: String(item?.manualUrl ?? "").trim(),
    manualFileData: String(item?.manualFileData ?? "").trim(),
    manualFileName: String(item?.manualFileName ?? "").trim(),
    ownerships,
  };
}

function normalizeAllocations(rawAllocations, fallbackOwnerships, qty) {
  const merged = mergeOwnerships(
    Array.isArray(rawAllocations)
      ? rawAllocations.map((entry) => ({ name: entry?.ownerName ?? entry?.name, qty: entry?.qty }))
      : []
  );

  if (merged.length === 0) {
    const fallbackName = fallbackOwnerships[0]?.name || "未設定";
    return [{ ownerName: fallbackName, qty }];
  }

  const result = merged.map((entry) => ({ ownerName: entry.name, qty: entry.qty }));
  const total = result.reduce((sum, entry) => sum + entry.qty, 0);

  if (total < qty) {
    result[0].qty += qty - total;
  }

  if (total > qty && result.length > 0) {
    let overflow = total - qty;
    for (let index = result.length - 1; index >= 0 && overflow > 0; index -= 1) {
      const used = Math.min(result[index].qty, overflow);
      result[index].qty -= used;
      overflow -= used;
    }
  }

  return result.filter((entry) => entry.qty > 0);
}

function normalizeHistory(rawHistory, equipment) {
  return (Array.isArray(rawHistory) ? rawHistory : []).map((item, index) => {
    const equipId = toPositiveInt(item?.equipId, 0);
    const qty = toPositiveInt(item?.qty, 0);
    const linkedEquipment = equipment.find((entry) => entry.id === equipId);
    const fallbackOwnerships = linkedEquipment?.ownerships ?? [{ name: "未設定", qty }];
    const fallbackDate = String(item?.date ?? today()).trim();

    return {
      id: String(item?.id ?? `history-${Date.now()}-${index}`),
      equipId,
      qty,
      projectName: String(item?.projectName ?? "").trim(),
      person: String(item?.person ?? "").trim(),
      destination: String(item?.destination ?? "").trim(),
      startDate: String(item?.startDate ?? fallbackDate).trim(),
      endDate: String(item?.endDate ?? fallbackDate).trim(),
      date: fallbackDate,
      returned: Boolean(item?.returned),
      returnDate: item?.returnDate ? String(item.returnDate) : null,
      allocations: normalizeAllocations(item?.allocations, fallbackOwnerships, qty),
    };
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateRange(startDate, endDate) {
  const start = String(startDate || "").trim();
  const end = String(endDate || "").trim();
  if (!start && !end) {
    return "-";
  }
  if (!start) {
    return end;
  }
  if (!end || start === end) {
    return start;
  }
  return `${start} - ${end}`;
}

function formatSyncStamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getSyncStatusLabel() {
  if (!state.sync.configured) {
    return "ローカル保存";
  }
  if (state.sync.error) {
    return state.sync.error;
  }
  if (state.sync.saving) {
    return "共有保存中";
  }
  if (state.sync.loading) {
    return "共有保存先へ接続中";
  }
  if (state.sync.pendingRemote) {
    return "他ユーザーの更新あり";
  }
  if (state.sync.lastSyncedAt) {
    return `共有同期済み ${formatSyncStamp(state.sync.lastSyncedAt)}`;
  }
  return "共有保存有効";
}

function getSyncStatusClass() {
  if (!state.sync.configured) {
    return "sync-status-local";
  }
  if (state.sync.error) {
    return "sync-status-error";
  }
  if (state.sync.saving || state.sync.loading) {
    return "sync-status-busy";
  }
  return "sync-status-ok";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function getImageSource(item) {
  return item?.imageFileData || item?.imageUrl || "";
}

function hasImageAsset(item) {
  return Boolean(getImageSource(item));
}

function hasManualAsset(item) {
  return Boolean(item?.manualUrl || item?.manualFileData);
}

function createOwnershipRow(name = "", qty = 0) {
  return { id: `ownership-${Date.now()}-${Math.random().toString(16).slice(2)}`, name, qty };
}

function createAddForm(seed = {}) {
  const ownerships = Array.isArray(seed.ownerships) && seed.ownerships.length > 0
    ? seed.ownerships.map((entry) => createOwnershipRow(entry.name, entry.qty))
    : [createOwnershipRow("", 1)];
  const ownershipTotal = ownerships.reduce((sum, entry) => sum + toPositiveInt(entry.qty, 0), 0);
  const genres = Array.isArray(seed.genres)
    ? seed.genres
    : seed.genre
      ? [seed.genre]
      : [];

  return {
    manufacturer: seed.manufacturer ?? "",
    name: seed.name ?? "",
    genres,
    genreDraft: seed.genreDraft ?? "",
    types: Array.isArray(seed.types) ? seed.types : [],
    typeDraft: seed.typeDraft ?? "",
    stock: seed.stock ?? (ownershipTotal || 1),
    notes: seed.notes ?? "",
    imageUrl: seed.imageUrl ?? "",
    imageFileData: seed.imageFileData ?? "",
    imageFileName: seed.imageFileName ?? "",
    manualUrl: seed.manualUrl ?? "",
    manualFileData: seed.manualFileData ?? "",
    manualFileName: seed.manualFileName ?? "",
    ownerships,
  };
}

function normalizeSelectionProjects(rawProjects, equipment) {
  const validEquipIds = new Set((equipment || []).map((item) => item.id));

  return (Array.isArray(rawProjects) ? rawProjects : []).map((project, index) => {
    const items = (Array.isArray(project?.items) ? project.items : [])
      .map((item, itemIndex) => ({
        id: String(item?.id ?? `selection-${Date.now()}-${index}-${itemIndex}`),
        equipId: toPositiveInt(item?.equipId, 0),
        qty: Math.max(1, toPositiveInt(item?.qty, 1)),
      }))
      .filter((item) => item.equipId > 0 && (validEquipIds.size === 0 || validEquipIds.has(item.equipId)));

    return {
      id: String(project?.id ?? `project-${Date.now()}-${index}`),
      name: String(project?.name ?? "").trim() || `現場${index + 1}`,
      items,
    };
  });
}

function loadCachedSharedState() {
  const storedEquipment = loadJSON(STORAGE_KEYS.equipment, INITIAL_EQUIPMENT);
  const equipment = (Array.isArray(storedEquipment) ? storedEquipment : INITIAL_EQUIPMENT).map(normalizeEquipment);
  const history = normalizeHistory(loadJSON(STORAGE_KEYS.history, []), equipment);
  const selectionProjects = normalizeSelectionProjects(loadJSON(STORAGE_KEYS.selectionProjects, []), equipment);
  const maxId = equipment.reduce((max, item) => Math.max(max, toPositiveInt(item.id, 0)), 0);

  return {
    equipment,
    history,
    selectionProjects,
    nextId: Math.max(toPositiveInt(loadJSON(STORAGE_KEYS.nextId, maxId + 1), maxId + 1), maxId + 1),
  };
}

const cachedSharedState = loadCachedSharedState();

const state = {
  tab: "list",
  equipment: cachedSharedState.equipment,
  history: cachedSharedState.history,
  nextId: cachedSharedState.nextId,
  selectionProjects: cachedSharedState.selectionProjects,
  activeSelectionProjectId: cachedSharedState.selectionProjects[0]?.id ?? null,
  showAddModal: false,
  editingEquipmentId: null,
  showCheckoutModal: false,
  mediaViewer: null,
  searchText: "",
  filterManufacturer: "",
  filterGenre: "",
  filterType: "",
  filterOwnership: "",
  addForm: createAddForm(),
  checkoutForm: null,
  checkoutProjectId: null,
  sync: {
    configured: isRemoteStoreEnabled(),
    loading: isRemoteStoreEnabled(),
    saving: false,
    error: "",
    lastSyncedAt: "",
    revision: "",
    pendingRemote: false,
  },
};

const app = document.getElementById("app");
let remotePollTimer = null;
let remoteSaveTimer = null;
let remoteSaveInFlight = false;
let remoteSaveQueued = false;

function writeLocalCache() {
  localStorage.setItem(STORAGE_KEYS.equipment, JSON.stringify(state.equipment));
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
  localStorage.setItem(STORAGE_KEYS.nextId, JSON.stringify(state.nextId));
  localStorage.setItem(STORAGE_KEYS.selectionProjects, JSON.stringify(state.selectionProjects));
}

function serializeSharedState() {
  return {
    equipment: state.equipment,
    history: state.history,
    nextId: state.nextId,
    selectionProjects: state.selectionProjects,
  };
}

function applySharedState(rawState) {
  const equipment = (Array.isArray(rawState?.equipment) ? rawState.equipment : INITIAL_EQUIPMENT).map(normalizeEquipment);
  const history = normalizeHistory(rawState?.history, equipment);
  const selectionProjects = normalizeSelectionProjects(rawState?.selectionProjects, equipment);
  const maxId = equipment.reduce((max, item) => Math.max(max, toPositiveInt(item.id, 0)), 0);

  state.equipment = equipment;
  state.history = history;
  state.nextId = Math.max(toPositiveInt(rawState?.nextId, maxId + 1), maxId + 1);
  state.selectionProjects = selectionProjects;

  if (!getSelectionProject(state.activeSelectionProjectId)) {
    state.activeSelectionProjectId = selectionProjects[0]?.id ?? null;
  }

  if (state.checkoutProjectId && !getSelectionProject(state.checkoutProjectId)) {
    state.checkoutProjectId = null;
    state.checkoutForm = null;
    state.showCheckoutModal = false;
  }

  writeLocalCache();
}

function canApplyRemoteStateImmediately() {
  return !state.showAddModal && !state.showCheckoutModal;
}

function buildJSONPUrl(params = {}) {
  const url = new URL(REMOTE_STORE.webAppUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function fetchRemoteStateJSONP() {
  return new Promise((resolve, reject) => {
    const callbackName = `__equipmentSyncCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Remote request timed out"));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Remote script load failed"));
    };

    script.src = buildJSONPUrl({
      action: "getState",
      callback: callbackName,
      _: Date.now(),
    });
    document.head.appendChild(script);
  });
}

async function postRemoteSharedState(snapshot) {
  const body = new URLSearchParams({
    action: "putState",
    payload: JSON.stringify(snapshot),
  });

  await fetch(REMOTE_STORE.webAppUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  });
}

async function refreshRemoteState(options = {}) {
  if (!isRemoteStoreEnabled()) {
    return false;
  }

  if (!canApplyRemoteStateImmediately() && !options.force) {
    state.sync.pendingRemote = true;
    if (!options.silent) {
      render();
    }
    return false;
  }

  try {
    if (!options.silent) {
      state.sync.loading = true;
      render();
    }

    const response = await fetchRemoteStateJSONP();
    if (!response?.ok) {
      throw new Error(response?.error || "Remote state load failed");
    }

    if (!response.hasState) {
      state.sync.loading = false;
      state.sync.error = "";
      if (!state.sync.revision && (state.equipment.length > 0 || state.history.length > 0 || state.selectionProjects.length > 0)) {
        scheduleRemoteSync(true);
      } else {
        render();
      }
      return false;
    }

    const revision = String(response.revision || "");
    if (!options.force && revision && revision === state.sync.revision) {
      state.sync.loading = false;
      state.sync.error = "";
      return false;
    }

    applySharedState(response.state);
    state.sync.loading = false;
    state.sync.error = "";
    state.sync.pendingRemote = false;
    state.sync.revision = revision;
    state.sync.lastSyncedAt = String(response.updatedAt || revision || "");
    render();
    return true;
  } catch (error) {
    state.sync.loading = false;
    state.sync.error = "共有保存先と同期できません";
    render();
    return false;
  }
}

function scheduleRemoteSync(immediate = false) {
  if (!isRemoteStoreEnabled()) {
    return;
  }

  remoteSaveQueued = true;
  window.clearTimeout(remoteSaveTimer);
  remoteSaveTimer = window.setTimeout(() => {
    flushRemoteSync();
  }, immediate ? 0 : 500);
}

async function flushRemoteSync() {
  if (!isRemoteStoreEnabled() || remoteSaveInFlight || !remoteSaveQueued) {
    return;
  }

  remoteSaveQueued = false;
  remoteSaveInFlight = true;
  state.sync.saving = true;
  state.sync.error = "";
  render();

  try {
    await postRemoteSharedState(serializeSharedState());
    state.sync.saving = false;
    await refreshRemoteState({ silent: true, force: true });
    render();
  } catch (error) {
    state.sync.saving = false;
    state.sync.error = "共有保存に失敗しました";
    render();
  } finally {
    remoteSaveInFlight = false;
    if (remoteSaveQueued) {
      flushRemoteSync();
    }
  }
}

function startRemotePolling() {
  if (!isRemoteStoreEnabled() || remotePollTimer) {
    return;
  }

  remotePollTimer = window.setInterval(() => {
    if (!remoteSaveInFlight) {
      refreshRemoteState({ silent: true });
    }
  }, REMOTE_STORE.pollMs);
}

function persistState(options = {}) {
  writeLocalCache();
  if (options.remote !== false) {
    scheduleRemoteSync();
  }
}

function buildExportPayload() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    equipment: state.equipment,
    history: state.history,
    nextId: state.nextId,
    selectionProjects: state.selectionProjects,
  };
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function exportAppData() {
  const stamp = new Date().toISOString().slice(0, 10);
  const payload = buildExportPayload();
  downloadTextFile(`equipment-export-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function parseImportedData(rawText) {
  const parsed = JSON.parse(rawText);

  if (Array.isArray(parsed)) {
    const equipment = parsed.map(normalizeEquipment);
    return {
      equipment,
      history: [],
      nextId: parsed.reduce((max, item, index) => Math.max(max, toPositiveInt(item?.id, index + 1)), 0) + 1,
      selectionProjects: [],
    };
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSONの形式を認識できませんでした。");
  }

  if (!Array.isArray(parsed.equipment)) {
    throw new Error("機材データが見つかりませんでした。");
  }

  const equipment = parsed.equipment.map(normalizeEquipment);
  const history = normalizeHistory(parsed.history, equipment);
  const selectionProjects = normalizeSelectionProjects(parsed.selectionProjects, equipment);
  const maxId = equipment.reduce((max, item) => Math.max(max, toPositiveInt(item.id, 0)), 0);

  return {
    equipment,
    history,
    nextId: Math.max(toPositiveInt(parsed.nextId, maxId + 1), maxId + 1),
    selectionProjects,
  };
}

async function importAppData(file) {
  if (!file) {
    return;
  }

  if (!window.confirm("現在の公開側データを、このファイルの内容で置き換えます。よろしいですか？")) {
    return;
  }

  try {
    const rawText = await file.text();
    const imported = parseImportedData(rawText);
    state.equipment = imported.equipment;
    state.history = imported.history;
    state.nextId = imported.nextId;
    state.selectionProjects = imported.selectionProjects;
    state.activeSelectionProjectId = imported.selectionProjects[0]?.id ?? null;
    state.searchText = "";
    state.filterManufacturer = "";
    state.filterGenre = "";
    state.filterType = "";
    state.filterOwnership = "";
    persistState();
    render();
    window.alert(`${state.equipment.length} 件の機材データを読み込みました。`);
  } catch (error) {
    window.alert("読み込みに失敗しました。JSONファイルの内容を確認してください。");
  }
}

function openImportPicker() {
  document.getElementById("import-data-file")?.click();
}

function getEquipment(id) {
  return state.equipment.find((item) => item.id === Number(id));
}

function getOwnershipNames() {
  return [...new Set(state.equipment.flatMap((item) => item.ownerships.map((entry) => entry.name)).filter(Boolean))];
}

function getManufacturerOptions() {
  return [...new Set(state.equipment.map((item) => item.manufacturer).filter(Boolean))].sort(compareText);
}

function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""), "ja");
}

function getFieldOptions(fieldName) {
  const values = fieldName === "types"
    ? state.equipment.flatMap((item) => item.types || [])
    : fieldName === "genres"
      ? state.equipment.flatMap((item) => item.genres || [])
    : state.equipment.map((item) => String(item[fieldName] || "").trim());
  return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))].sort(compareText);
}

function getCheckedOutQty(equipId) {
  return state.history
    .filter((item) => item.equipId === equipId && !item.returned)
    .reduce((sum, item) => sum + item.qty, 0);
}

function getCheckedOutOwnershipQty(equipId, ownerName) {
  return state.history
    .filter((item) => item.equipId === equipId && !item.returned)
    .reduce((sum, item) => {
      const qty = item.allocations
        .filter((allocation) => allocation.ownerName === ownerName)
        .reduce((allocationSum, allocation) => allocationSum + allocation.qty, 0);
      return sum + qty;
    }, 0);
}

function getSelectionProject(projectId) {
  return state.selectionProjects.find((project) => project.id === projectId) ?? null;
}

function getActiveSelectionProject() {
  return getSelectionProject(state.activeSelectionProjectId);
}

function getProjectSelections(projectId = state.activeSelectionProjectId) {
  return getSelectionProject(projectId)?.items ?? [];
}

function getProjectSelectedQty(projectId, equipId) {
  return getProjectSelections(projectId).find((item) => item.equipId === Number(equipId))?.qty ?? 0;
}

function getSelectedQty(equipId) {
  return getProjectSelectedQty(state.activeSelectionProjectId, equipId);
}

function getReservedSelectionQty(equipId) {
  return state.selectionProjects.reduce(
    (sum, project) => sum + getProjectSelectedQty(project.id, equipId),
    0
  );
}

function getSelectionProjectTotals(project) {
  const items = project?.items ?? [];
  return {
    itemCount: items.length,
    qty: items.reduce((sum, item) => sum + item.qty, 0),
  };
}

function getTotalSelectionQty() {
  return state.selectionProjects.reduce((sum, project) => sum + getSelectionProjectTotals(project).qty, 0);
}

function getNextSelectionProjectName() {
  const names = new Set(state.selectionProjects.map((project) => project.name));
  let index = 1;
  while (names.has(`現場${index}`)) {
    index += 1;
  }
  return `現場${index}`;
}

function createSelectionProject(name = "") {
  return {
    id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(name || "").trim() || getNextSelectionProjectName(),
    items: [],
  };
}

function ensureActiveSelectionProject() {
  const active = getActiveSelectionProject();
  if (active) {
    return active;
  }

  const project = createSelectionProject(getNextSelectionProjectName());
  state.selectionProjects.push(project);
  state.activeSelectionProjectId = project.id;
  return project;
}

function setActiveSelectionProject(projectId) {
  if (!getSelectionProject(projectId)) {
    return;
  }
  state.activeSelectionProjectId = projectId;
  render();
}

function createSelectionProjectFromPrompt() {
  const suggestedName = getNextSelectionProjectName();
  const input = window.prompt("現場名を入力してください。", suggestedName);
  if (input === null) {
    return;
  }

  const project = createSelectionProject(input.trim() || suggestedName);
  state.selectionProjects.push(project);
  state.activeSelectionProjectId = project.id;
  state.tab = "selected";
  persistState();
  render();
}

function deleteSelectionProject(projectId) {
  const project = getSelectionProject(projectId);
  if (!project) {
    return;
  }

  if (!window.confirm(`「${project.name}」を削除しますか？`)) {
    return;
  }

  state.selectionProjects = state.selectionProjects.filter((entry) => entry.id !== projectId);
  if (state.activeSelectionProjectId === projectId) {
    state.activeSelectionProjectId = state.selectionProjects[0]?.id ?? null;
  }
  if (state.checkoutProjectId === projectId) {
    state.showCheckoutModal = false;
    state.checkoutForm = null;
    state.checkoutProjectId = null;
  }
  persistState();
  render();
}

function getAvailable(equipId) {
  const item = getEquipment(equipId);
  if (!item) {
    return 0;
  }

  return Math.max(0, item.stock - getCheckedOutQty(equipId) - getReservedSelectionQty(equipId));
}

function getOwnershipAvailability(equipId) {
  const item = getEquipment(equipId);
  if (!item) {
    return [];
  }

  return item.ownerships.map((entry) => {
    const checkedOut = getCheckedOutOwnershipQty(equipId, entry.name);
    return {
      ownerName: entry.name,
      total: entry.qty,
      checkedOut,
      available: Math.max(0, entry.qty - checkedOut),
    };
  });
}

function formatOwnershipSummary(ownerships) {
  return ownerships
    .map((entry) => `${entry.name} ${entry.qty}`)
    .join(" / ");
}

function formatAllocationSummary(allocations) {
  return allocations
    .filter((entry) => entry.qty > 0)
    .map((entry) => `${entry.ownerName} ${entry.qty}`)
    .join(" / ");
}

function formatTypesSummary(types) {
  return (types || []).join(" / ");
}

function getActiveFilters(overrides = {}) {
  return {
    keyword: state.searchText.trim().toLowerCase(),
    manufacturer: state.filterManufacturer,
    genre: state.filterGenre,
    type: state.filterType,
    ownership: state.filterOwnership,
    ...overrides,
  };
}

function matchesEquipmentFilters(item, filters) {
  if (filters.keyword) {
    const ownershipText = item.ownerships.map((entry) => entry.name).join(" ");
    const genreText = (item.genres || []).join(" ");
    const typeText = (item.types || []).join(" ");
    const haystack = `${item.manufacturer} ${item.name} ${item.notes} ${ownershipText} ${genreText} ${typeText}`.toLowerCase();
    if (!haystack.includes(filters.keyword)) {
      return false;
    }
  }

  if (filters.manufacturer && item.manufacturer !== filters.manufacturer) {
    return false;
  }

  if (filters.genre && !(item.genres || []).includes(filters.genre)) {
    return false;
  }

  if (filters.type && !(item.types || []).includes(filters.type)) {
    return false;
  }

  if (filters.ownership && !item.ownerships.some((entry) => entry.name === filters.ownership)) {
    return false;
  }

  return true;
}

function getEquipmentByFilters(overrides = {}) {
  const filters = getActiveFilters(overrides);
  return state.equipment.filter((item) => matchesEquipmentFilters(item, filters));
}

function getLinkedFilterOptions(fieldName) {
  const baseItems = getEquipmentByFilters({
    manufacturer: fieldName === "manufacturer" ? "" : state.filterManufacturer,
    genre: fieldName === "genre" ? "" : state.filterGenre,
    type: fieldName === "type" ? "" : state.filterType,
    ownership: fieldName === "ownership" ? "" : state.filterOwnership,
  });

  if (fieldName === "manufacturer") {
    return [...new Set(baseItems.map((item) => item.manufacturer).filter(Boolean))].sort(compareText);
  }

  if (fieldName === "genre") {
    return [...new Set(baseItems.flatMap((item) => item.genres || []).map((entry) => String(entry || "").trim()).filter(Boolean))].sort(compareText);
  }

  if (fieldName === "type") {
    return [...new Set(baseItems.flatMap((item) => item.types || []).map((entry) => String(entry || "").trim()).filter(Boolean))].sort(compareText);
  }

  if (fieldName === "ownership") {
    return [...new Set(baseItems.flatMap((item) => item.ownerships.map((entry) => entry.name)).filter(Boolean))].sort(compareText);
  }

  return [];
}

function getFilteredEquipment() {
  return getEquipmentByFilters();
}

function groupHistory() {
  const buckets = new Map();

  state.history.forEach((item) => {
    const key = `${item.projectName || ""}|${item.person}|${item.destination}|${item.startDate || item.date || ""}|${item.endDate || item.date || ""}`;
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key).push(item);
  });

  return Array.from(buckets.entries());
}

function getStats() {
  return {
    totalItems: state.equipment.length,
    activeCheckoutCount: state.history.filter((item) => !item.returned).reduce((sum, item) => sum + item.qty, 0),
    availableNow: state.equipment.reduce((sum, item) => sum + getAvailable(item.id), 0),
  };
}

function badge(label, kind) {
  return `<span class="badge ${kind}">${escapeHTML(label)}</span>`;
}

function ownershipBadges(ownerships) {
  return ownerships
    .map((entry) => `<span class="ownership-pill">${escapeHTML(entry.name)} <strong>${entry.qty}</strong></span>`)
    .join("");
}

function equipmentHeading(item, inline = false) {
  if (!item) {
    return `<span class="equipment-name">(不明)</span>`;
  }

  return `
    <span class="equipment-heading${inline ? " inline" : ""}">
      ${item.manufacturer ? `<span class="manufacturer-chip">${escapeHTML(item.manufacturer)}</span>` : ""}
      <span class="equipment-name">${escapeHTML(item.name || "(不明)")}</span>
    </span>
  `;
}

function typeBadges(types) {
  const list = Array.isArray(types) ? types : [];
  if (list.length === 0) {
    return badge("未設定", "badge-amber");
  }
  return list.map((entry) => badge(entry, "badge-amber")).join("");
}

function imageIconSVG() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <circle cx="9" cy="10" r="1.5"></circle>
      <path d="M21 16l-5-5-4 4-2-2-5 5"></path>
    </svg>
  `;
}

function manualIconSVG() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path>
      <path d="M14 4v5h5"></path>
      <path d="M9 13h6"></path>
      <path d="M9 17h4"></path>
    </svg>
  `;
}

function setTab(tab) {
  state.tab = tab;
  render();
}

function addSelection(equipId) {
  const id = Number(equipId);
  if (getAvailable(id) <= 0) {
    return;
  }

  const project = ensureActiveSelectionProject();
  const existing = project.items.find((item) => item.equipId === id);
  if (existing) {
    existing.qty += 1;
  } else {
    project.items.push({ id: `selection-${Date.now()}-${id}`, equipId: id, qty: 1 });
  }

  persistState();
  render();
}

function removeSelectionUnit(equipId) {
  const id = Number(equipId);
  const project = getActiveSelectionProject();
  const item = project?.items.find((selection) => selection.equipId === id);
  if (!item) {
    return;
  }

  if (item.qty <= 1) {
    project.items = project.items.filter((selection) => selection.equipId !== id);
  } else {
    item.qty -= 1;
  }

  persistState();
  render();
}

function removeSelectionAll(equipId) {
  const id = Number(equipId);
  const project = getActiveSelectionProject();
  if (!project) {
    return;
  }
  project.items = project.items.filter((selection) => selection.equipId !== id);
  persistState();
  render();
}

function deleteEquipment(equipId) {
  const item = getEquipment(equipId);
  if (!item) {
    return;
  }

  if (!window.confirm(`「${item.name}」を削除しますか？`)) {
    return;
  }

  state.equipment = state.equipment.filter((entry) => entry.id !== Number(equipId));
  state.selectionProjects = state.selectionProjects.map((project) => ({
    ...project,
    items: project.items.filter((selection) => selection.equipId !== Number(equipId)),
  }));
  persistState();
  render();
}

function openEditModal(equipId) {
  const item = getEquipment(equipId);
  if (!item) {
    return;
  }

  state.editingEquipmentId = item.id;
  state.addForm = createAddForm({
    manufacturer: item.manufacturer,
    name: item.name,
    genres: item.genres,
    types: item.types,
    stock: item.stock,
    notes: item.notes,
    imageUrl: item.imageUrl,
    imageFileData: item.imageFileData,
    imageFileName: item.imageFileName,
    manualUrl: item.manualUrl,
    manualFileData: item.manualFileData,
    manualFileName: item.manualFileName,
    ownerships: item.ownerships,
  });
  state.showAddModal = true;
  render();
}

function openMediaViewer(kind, equipId) {
  const item = getEquipment(equipId);
  if (!item) {
    return;
  }

  if (kind === "image" && !hasImageAsset(item)) {
    return;
  }

  if (kind === "manual" && !hasManualAsset(item)) {
    return;
  }

  state.mediaViewer = { kind, equipId: item.id };
  render();
}

function closeMediaViewer() {
  state.mediaViewer = null;
  render();
}

function clearAttachment(kind) {
  syncAddFormFromDOM();
  if (kind === "image") {
    state.addForm.imageUrl = "";
    state.addForm.imageFileData = "";
    state.addForm.imageFileName = "";
  }
  if (kind === "manual") {
    state.addForm.manualUrl = "";
    state.addForm.manualFileData = "";
    state.addForm.manualFileName = "";
  }
  render();
}

function returnEquipment(historyId) {
  const item = state.history.find((entry) => entry.id === historyId);
  if (!item) {
    return;
  }

  item.returned = true;
  item.returnDate = today();
  persistState();
  render();
}

function returnHistoryGroup(historyIds) {
  const ids = String(historyIds || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return;
  }

  const idSet = new Set(ids);
  let changed = false;
  state.history.forEach((entry) => {
    if (idSet.has(entry.id) && !entry.returned) {
      entry.returned = true;
      entry.returnDate = today();
      changed = true;
    }
  });

  if (!changed) {
    return;
  }

  persistState();
  render();
}

function deleteHistoryGroup(historyIds) {
  const ids = String(historyIds || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return;
  }

  if (!window.confirm("このまとまりの履歴をまとめて削除しますか？")) {
    return;
  }

  const idSet = new Set(ids);
  state.history = state.history.filter((entry) => !idSet.has(entry.id));
  persistState();
  render();
}

function clearFilters() {
  state.filterManufacturer = "";
  state.filterGenre = "";
  state.filterType = "";
  state.filterOwnership = "";
  render();
}

function syncAddFormFromDOM() {
  const root = document.querySelector("[data-add-form]");
  if (!root) {
    return;
  }

  const ownerships = Array.from(root.querySelectorAll("[data-add-ownership-row]"))
    .map((row) => ({
      id: row.dataset.rowId,
      name: row.querySelector("[data-add-owner-name]")?.value ?? "",
      qty: row.querySelector("[data-add-owner-qty]")?.value ?? 0,
    }));

  state.addForm = {
    manufacturer: root.querySelector("#add-manufacturer")?.value ?? "",
    name: root.querySelector("#add-name")?.value ?? "",
    genres: Array.from(root.querySelectorAll("[data-genre-chip]")).map((chip) => chip.dataset.value).filter(Boolean),
    genreDraft: root.querySelector("#add-genre")?.value.trim() ?? "",
    types: Array.from(root.querySelectorAll("[data-type-chip]")).map((chip) => chip.dataset.value).filter(Boolean),
    typeDraft: root.querySelector("#add-type")?.value.trim() ?? "",
    stock: root.querySelector("#add-stock")?.value ?? 0,
    notes: root.querySelector("#add-notes")?.value ?? "",
    imageUrl: root.querySelector("#add-image-url")?.value.trim() ?? state.addForm.imageUrl ?? "",
    imageFileData: state.addForm.imageFileData ?? "",
    imageFileName: state.addForm.imageFileName ?? "",
    manualUrl: root.querySelector("#add-manual-url")?.value.trim() ?? state.addForm.manualUrl ?? "",
    manualFileData: state.addForm.manualFileData ?? "",
    manualFileName: state.addForm.manualFileName ?? "",
    ownerships,
  };
}

function updateAddFormStatus(root) {
  const status = root.querySelector("[data-add-form-status]");
  if (!status) {
    return;
  }

  const stock = toPositiveInt(root.querySelector("#add-stock")?.value, 0);
  const total = Array.from(root.querySelectorAll("[data-add-owner-qty]"))
    .reduce((sum, input) => sum + toPositiveInt(input.value, 0), 0);

  status.textContent = `総数 ${stock} / 所有数合計 ${total}`;
  status.classList.toggle("form-status-ok", total === stock);
  status.classList.toggle("form-status-warn", total !== stock);
}

function clampAddOwnershipInputs(changedRowId) {
  const root = document.querySelector("[data-add-form]");
  if (!root) {
    return;
  }

  const stock = toPositiveInt(root.querySelector("#add-stock")?.value, 0);
  const rows = Array.from(root.querySelectorAll("[data-add-ownership-row]"));

  rows.forEach((row) => {
    const qtyInput = row.querySelector("[data-add-owner-qty]");
    if (qtyInput) {
      qtyInput.max = String(stock);
      qtyInput.value = String(Math.max(0, toPositiveInt(qtyInput.value, 0)));
    }
  });

  if (changedRowId) {
    const currentRow = rows.find((row) => row.dataset.rowId === changedRowId);
    const currentInput = currentRow?.querySelector("[data-add-owner-qty]");
    if (currentInput) {
      const othersTotal = rows
        .filter((row) => row.dataset.rowId !== changedRowId)
        .reduce((sum, row) => sum + toPositiveInt(row.querySelector("[data-add-owner-qty]")?.value, 0), 0);
      const maxForCurrent = Math.max(stock - othersTotal, 0);
      currentInput.value = String(Math.min(toPositiveInt(currentInput.value, 0), maxForCurrent));
    }
  }

  let total = rows.reduce((sum, row) => sum + toPositiveInt(row.querySelector("[data-add-owner-qty]")?.value, 0), 0);
  if (total > stock) {
    let overflow = total - stock;
    for (let index = rows.length - 1; index >= 0 && overflow > 0; index -= 1) {
      const qtyInput = rows[index].querySelector("[data-add-owner-qty]");
      const current = toPositiveInt(qtyInput?.value, 0);
      const reduced = Math.min(current, overflow);
      qtyInput.value = String(current - reduced);
      overflow -= reduced;
    }
  }

  updateAddFormStatus(root);
}

function clampCheckoutAllocationInputs(changedEquipId, changedOwnerName) {
  const root = document.querySelector("[data-checkout-form]");
  if (!root) {
    return;
  }

  const project = getSelectionProject(state.checkoutProjectId) ?? getActiveSelectionProject();
  const equipId = Number(changedEquipId);
  const selection = project?.items.find((item) => item.equipId === equipId);
  if (!selection) {
    return;
  }

  const rows = Array.from(root.querySelectorAll(`[data-checkout-row][data-equip-id="${equipId}"]`));
  const currentRow = rows.find((row) => row.dataset.ownerName === changedOwnerName);
  const currentInput = currentRow?.querySelector("[data-checkout-qty]");
  if (!currentInput) {
    return;
  }

  rows.forEach((row) => {
    const input = row.querySelector("[data-checkout-qty]");
    const max = toPositiveInt(input?.dataset.maxAvailable ?? input?.max, 0);
    input.value = String(Math.min(toPositiveInt(input.value, 0), max));
  });

  const othersTotal = rows
    .filter((row) => row.dataset.ownerName !== changedOwnerName)
    .reduce((sum, row) => sum + toPositiveInt(row.querySelector("[data-checkout-qty]")?.value, 0), 0);
  const availableForCurrent = toPositiveInt(currentInput.dataset.maxAvailable ?? currentInput.max, 0);
  const maxForCurrent = Math.max(Math.min(availableForCurrent, selection.qty - othersTotal), 0);
  currentInput.value = String(Math.min(toPositiveInt(currentInput.value, 0), maxForCurrent));

  let total = rows.reduce((sum, row) => sum + toPositiveInt(row.querySelector("[data-checkout-qty]")?.value, 0), 0);
  if (total > selection.qty) {
    let overflow = total - selection.qty;
    for (let index = rows.length - 1; index >= 0 && overflow > 0; index -= 1) {
      const input = rows[index].querySelector("[data-checkout-qty]");
      const current = toPositiveInt(input?.value, 0);
      const reduced = Math.min(current, overflow);
      input.value = String(current - reduced);
      overflow -= reduced;
    }
  }
}

function validateAddForm(form) {
  const stock = toPositiveInt(form.stock, -1);
  const ownerships = mergeOwnerships(form.ownerships);
  const ownershipTotal = ownerships.reduce((sum, entry) => sum + entry.qty, 0);

  if (stock < 0) {
    return "総数は 0 以上で入力してください。";
  }

  if (ownerships.length === 0) {
    return "所有を1件以上入力してください。";
  }

  if (ownerships.some((entry) => !String(entry.name).trim())) {
    return "所有名を空欄にできません。";
  }

  if (ownershipTotal !== stock) {
    return `総数 ${stock} と所有数合計 ${ownershipTotal} を一致させてください。`;
  }

  return null;
}

function addOwnershipRow() {
  syncAddFormFromDOM();
  state.addForm.ownerships.push(createOwnershipRow("", 0));
  render();
}

function removeOwnershipRow(rowId) {
  syncAddFormFromDOM();
  state.addForm.ownerships = state.addForm.ownerships.filter((entry) => entry.id !== rowId);
  if (state.addForm.ownerships.length === 0) {
    state.addForm.ownerships.push(createOwnershipRow("", 0));
  }
  render();
}

function addTypeChip() {
  syncAddFormFromDOM();
  const value = String(state.addForm.typeDraft || "").trim();
  if (!value) {
    return;
  }
  if (!(state.addForm.types || []).includes(value)) {
    state.addForm.types = [...(state.addForm.types || []), value];
  }
  state.addForm.typeDraft = "";
  render();
}

function removeTypeChip(value) {
  syncAddFormFromDOM();
  state.addForm.types = (state.addForm.types || []).filter((entry) => entry !== value);
  render();
}

function addGenreChip() {
  syncAddFormFromDOM();
  const value = String(state.addForm.genreDraft || "").trim();
  if (!value) {
    return;
  }
  if (!(state.addForm.genres || []).includes(value)) {
    state.addForm.genres = [...(state.addForm.genres || []), value];
  }
  state.addForm.genreDraft = "";
  render();
}

function removeGenreChip(value) {
  syncAddFormFromDOM();
  state.addForm.genres = (state.addForm.genres || []).filter((entry) => entry !== value);
  render();
}

function saveEquipmentFromForm() {
  syncAddFormFromDOM();
  const errorMessage = validateAddForm(state.addForm);

  if (errorMessage) {
    window.alert(errorMessage);
    return;
  }

  const ownerships = mergeOwnerships(state.addForm.ownerships);
  const stock = ownerships.reduce((sum, entry) => sum + entry.qty, 0);

  const nextItem = {
    id: state.editingEquipmentId ?? state.nextId,
    manufacturer: state.addForm.manufacturer.trim(),
    name: state.addForm.name.trim(),
    genres: [...new Set((state.addForm.genres || []).map((entry) => String(entry).trim()).filter(Boolean))],
    genre: [...new Set((state.addForm.genres || []).map((entry) => String(entry).trim()).filter(Boolean))][0] || "",
    types: [...new Set((state.addForm.types || []).map((entry) => String(entry).trim()).filter(Boolean))],
    stock,
    notes: state.addForm.notes.trim(),
    imageUrl: state.addForm.imageUrl.trim(),
    imageFileData: state.addForm.imageFileData,
    imageFileName: state.addForm.imageFileName,
    manualUrl: state.addForm.manualUrl.trim(),
    manualFileData: state.addForm.manualFileData,
    manualFileName: state.addForm.manualFileName,
    ownerships,
  };

  if (state.editingEquipmentId) {
    state.equipment = state.equipment.map((item) => item.id === state.editingEquipmentId ? nextItem : item);
  } else {
    state.equipment.push(nextItem);
    state.nextId += 1;
  }

  state.addForm = createAddForm();
  state.editingEquipmentId = null;
  state.showAddModal = false;
  persistState();
  render();
}

function buildDefaultCheckoutForm(project) {
  const allocations = {};

  (project?.items ?? []).forEach((selection) => {
    let remaining = selection.qty;
    allocations[selection.equipId] = {};
    getOwnershipAvailability(selection.equipId).forEach((entry) => {
      const reserved = Math.min(entry.available, remaining);
      allocations[selection.equipId][entry.ownerName] = reserved;
      remaining -= reserved;
    });
  });

  return {
    person: "",
    destination: project?.name ?? "",
    startDate: today(),
    endDate: today(),
    allocations,
  };
}

function readCheckoutFormFromDOM() {
  const root = document.querySelector("[data-checkout-form]");
  const form = {
    person: root?.querySelector("#checkout-person")?.value.trim() ?? "",
    destination: root?.querySelector("#checkout-destination")?.value.trim() ?? "",
    startDate: root?.querySelector("#checkout-start-date")?.value || today(),
    endDate: root?.querySelector("#checkout-end-date")?.value || today(),
    allocations: {},
  };

  Array.from(root?.querySelectorAll("[data-checkout-row]") ?? []).forEach((row) => {
    const equipId = Number(row.dataset.equipId);
    const ownerName = row.dataset.ownerName;
    const qty = toPositiveInt(row.querySelector("[data-checkout-qty]")?.value, 0);
    if (!form.allocations[equipId]) {
      form.allocations[equipId] = {};
    }
    form.allocations[equipId][ownerName] = qty;
  });

  return form;
}

function validateCheckoutForm(form, project) {
  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    return "終了日は開始日以降にしてください。";
  }

  for (const selection of project?.items ?? []) {
    const ownerAvailability = getOwnershipAvailability(selection.equipId);
    const allocationMap = form.allocations[selection.equipId] ?? {};
    const allocatedQty = ownerAvailability.reduce((sum, entry) => sum + toPositiveInt(allocationMap[entry.ownerName], 0), 0);

    if (allocatedQty !== selection.qty) {
      return `${getEquipment(selection.equipId)?.name || "機材"} の所有振り分け合計を ${selection.qty} にしてください。`;
    }

    for (const entry of ownerAvailability) {
      const qty = toPositiveInt(allocationMap[entry.ownerName], 0);
      if (qty > entry.available) {
        return `${getEquipment(selection.equipId)?.name || "機材"} の「${entry.ownerName}」は最大 ${entry.available} までです。`;
      }
    }
  }

  return null;
}

function checkoutFromForm() {
  const project = getSelectionProject(state.checkoutProjectId);
  if (!project) {
    window.alert("対象の現場が見つかりません。");
    return;
  }

  const form = readCheckoutFormFromDOM();
  const errorMessage = validateCheckoutForm(form, project);

  if (errorMessage) {
    window.alert(errorMessage);
    return;
  }

  const entries = project.items.map((selection, index) => {
    const allocationMap = form.allocations[selection.equipId] ?? {};
    const allocations = Object.entries(allocationMap)
      .map(([ownerName, qty]) => ({ ownerName, qty: toPositiveInt(qty, 0) }))
      .filter((entry) => entry.qty > 0);

    return {
      id: `history-${Date.now()}-${index}-${selection.equipId}`,
      equipId: selection.equipId,
      qty: selection.qty,
      projectName: project.name,
      person: form.person,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      date: form.startDate,
      returned: false,
      returnDate: null,
      allocations,
    };
  });

  state.history = [...entries, ...state.history];
  state.selectionProjects = state.selectionProjects.filter((entry) => entry.id !== project.id);
  if (state.activeSelectionProjectId === project.id) {
    state.activeSelectionProjectId = state.selectionProjects[0]?.id ?? null;
  }
  state.showCheckoutModal = false;
  state.checkoutForm = null;
  state.checkoutProjectId = null;
  state.tab = "history";
  persistState();
  render();
}

function renderEquipmentFilterPanel(manufacturerOptions, genreOptions, typeOptions, ownershipNames) {
  return `
    <div class="filter-panel">
      <select id="filter-manufacturer" class="select">
        <option value="">全メーカー</option>
        ${manufacturerOptions.map((option) => `<option value="${escapeHTML(option)}"${state.filterManufacturer === option ? " selected" : ""}>${escapeHTML(option)}</option>`).join("")}
      </select>
      <select id="filter-genre" class="select">
        <option value="">全ジャンル</option>
        ${genreOptions.map((option) => `<option value="${escapeHTML(option)}"${state.filterGenre === option ? " selected" : ""}>${escapeHTML(option)}</option>`).join("")}
      </select>
      <select id="filter-type" class="select">
        <option value="">全種類</option>
        ${typeOptions.map((option) => `<option value="${escapeHTML(option)}"${state.filterType === option ? " selected" : ""}>${escapeHTML(option)}</option>`).join("")}
      </select>
      <select id="filter-ownership" class="select">
        <option value="">全所有</option>
        ${ownershipNames.map((option) => `<option value="${escapeHTML(option)}"${state.filterOwnership === option ? " selected" : ""}>${escapeHTML(option)}</option>`).join("")}
      </select>
      <button class="danger-button" data-action="clear-filters">条件をクリア</button>
    </div>
  `;
}

function renderList() {
  const filtered = getFilteredEquipment();
  const manufacturerOptions = getLinkedFilterOptions("manufacturer");
  const ownershipNames = getLinkedFilterOptions("ownership");
  const genreOptions = getLinkedFilterOptions("genre");
  const typeOptions = getLinkedFilterOptions("type");
  const stats = getStats();

  return `
    <section class="panel">
      <div class="stats-grid">
        <article class="stat-card">
          <p class="stat-label">登録機材</p>
          <p class="stat-value">${stats.totalItems}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">今すぐ使える在庫</p>
          <p class="stat-value">${stats.availableNow}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">持ち出し中</p>
          <p class="stat-value">${stats.activeCheckoutCount}</p>
        </article>
      </div>

      <div class="toolbar">
        <div class="search-wrap">
          <label class="sr-only" for="search-text">検索</label>
          <input id="search-text" class="text-input" type="text" value="${escapeHTML(state.searchText)}" placeholder="メーカー・機材名・メモ・所有で検索" />
        </div>
        <button class="primary-button" data-action="open-add-modal">機材を追加</button>
      </div>

      <input id="import-data-file" type="file" accept="application/json,.json" hidden />

      ${renderEquipmentFilterPanel(manufacturerOptions, genreOptions, typeOptions, ownershipNames)}

      <div class="muted-row">
        <span>${filtered.length} 件の機材</span>
      </div>

      ${filtered.length > 0 ? `
        <div class="inventory-grid">
          ${filtered.map((item) => {
            const available = getAvailable(item.id);
            const selectedQty = getSelectedQty(item.id);
            const stockClass = available <= 0 ? "stock-empty" : available <= 2 ? "stock-low" : "stock-ok";
            return `
              <article class="inventory-card">
                <div class="inventory-card-top">
                  <div class="inventory-card-main">
                    <div class="equipment-cell">
                      <button
                        class="asset-icon-button ${hasImageAsset(item) ? "active" : "disabled"}"
                        data-action="open-image-viewer"
                        data-equip-id="${item.id}"
                        ${hasImageAsset(item) ? "" : "disabled"}
                        aria-label="機材写真を表示"
                      >
                        ${imageIconSVG()}
                      </button>
                      ${equipmentHeading(item)}
                    </div>
                    <div class="inventory-inline-groups">
                      <div class="inline-info">
                        <span class="info-label">ジャンル</span>
                        <div class="type-badge-list">${(item.genres || []).length > 0 ? item.genres.map((entry) => badge(entry, "badge-blue")).join("") : badge("未設定", "badge-blue")}</div>
                      </div>
                      <div class="inline-info">
                        <span class="info-label">種類</span>
                        <div class="type-badge-list">${typeBadges(item.types)}</div>
                      </div>
                    </div>
                  </div>
                  <div class="inventory-stock">
                    <span class="stock ${stockClass}">${available}</span>
                    <span class="inventory-stock-total">/ ${item.stock}</span>
                  </div>
                </div>

                <div class="inventory-card-bottom">
                  <div class="info-group inventory-ownership">
                    <span class="info-label">所有</span>
                    <div class="ownership-list">${ownershipBadges(item.ownerships)}</div>
                  </div>
                  <div class="info-group inventory-note">
                    <span class="info-label">メモ</span>
                    <p class="note-text line-clamp-2">${escapeHTML(item.notes || "-")}</p>
                  </div>
                </div>

                <div class="card-actions">
                  <div class="action-cluster action-cluster-main">
                    ${selectedQty > 0 ? `<button class="pill-action" data-action="remove-selection-unit" data-equip-id="${item.id}">-</button>` : ""}
                    ${selectedQty > 0 ? `<span class="selected-qty">${selectedQty}</span>` : ""}
                    <button class="pill-action" data-action="add-selection" data-equip-id="${item.id}" ${available <= 0 ? "disabled" : ""}>+</button>
                  </div>
                  <div class="action-cluster">
                    <button class="pill-action pill-action-edit" data-action="open-edit-modal" data-equip-id="${item.id}">編集</button>
                    <button
                      class="asset-icon-button inline ${hasManualAsset(item) ? "active" : "disabled"}"
                      data-action="open-manual-viewer"
                      data-equip-id="${item.id}"
                      ${hasManualAsset(item) ? "" : "disabled"}
                      aria-label="説明書を表示"
                    >
                      ${manualIconSVG()}
                    </button>
                  </div>
                  <div class="action-cluster action-cluster-danger">
                    <button class="pill-action pill-action-danger pill-action-compact" data-action="delete-equipment" data-equip-id="${item.id}">削除</button>
                  </div>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-mark">?</div>
          <h2>該当する機材がありません</h2>
          <p>検索条件やフィルターを変えてみてください。</p>
        </div>
      `}
    </section>
  `;
}

function renderSelected() {
  const project = getActiveSelectionProject();
  const filtered = getFilteredEquipment();
  const manufacturerOptions = getLinkedFilterOptions("manufacturer");
  const ownershipNames = getLinkedFilterOptions("ownership");
  const genreOptions = getLinkedFilterOptions("genre");
  const typeOptions = getLinkedFilterOptions("type");
  const projectTotals = getSelectionProjectTotals(project);

  return `
      <section class="panel">
        <div class="section-head">
          <div>
            <h2>現場ごとの選定</h2>
            <p>現場を切り替えながら、必要な機材をそれぞれ集められます。</p>
          </div>
        <button class="primary-button" data-action="create-selection-project">現場を追加</button>
      </div>

      ${state.selectionProjects.length > 0 ? `
        <div class="project-grid">
          ${state.selectionProjects.map((entry) => {
            const totals = getSelectionProjectTotals(entry);
            return `
              <article class="project-card ${state.activeSelectionProjectId === entry.id ? "active" : ""}">
                <button class="project-card-main" data-action="set-active-selection-project" data-project-id="${escapeHTML(entry.id)}">
                  <strong>${escapeHTML(entry.name)}</strong>
                  <span>${totals.itemCount} 種類 / ${totals.qty} 点</span>
                </button>
                <button class="asset-icon-button inline" data-action="delete-selection-project" data-project-id="${escapeHTML(entry.id)}" aria-label="現場を削除">×</button>
              </article>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="empty-state selection-empty-state">
          <div class="empty-state-mark">+</div>
          <h2>現場がまだありません</h2>
          <p>まず現場を作ると、その中に機材を選定できます。</p>
          <button class="primary-button" data-action="create-selection-project">現場を作成</button>
        </div>
      `}
    </section>

    ${project ? `
      <section class="panel">
        <div class="section-head">
          <div>
            <h2>${escapeHTML(project.name)}</h2>
            <p>一覧と同じフィルターで絞って、この現場に機材を追加できます。</p>
          </div>
          <div class="selection-workspace-actions">
            <span class="selection-project-summary">${projectTotals.itemCount} 種類 / ${projectTotals.qty} 点</span>
            <button class="secondary-button" data-action="open-checkout-modal" ${project.items.length === 0 ? "disabled" : ""}>持ち出しを確定</button>
          </div>
        </div>

        <div class="toolbar">
          <div class="search-wrap">
            <label class="sr-only" for="search-text">検索</label>
            <input id="search-text" class="text-input" type="text" value="${escapeHTML(state.searchText)}" placeholder="メーカー・機材名・メモ・所有で検索" />
          </div>
          <button class="ghost-button" data-action="create-selection-project">別現場を追加</button>
        </div>

        ${renderEquipmentFilterPanel(manufacturerOptions, genreOptions, typeOptions, ownershipNames)}

        <div class="muted-row">
          <span>${filtered.length} 件から追加できます</span>
          <span>現在の現場: ${escapeHTML(project.name)}</span>
        </div>

        ${filtered.length > 0 ? `
          <div class="selection-picker-grid">
            ${filtered.map((item) => {
              const available = getAvailable(item.id);
              const selectedQty = getSelectedQty(item.id);
              const stockClass = available <= 0 ? "stock-empty" : available <= 2 ? "stock-low" : "stock-ok";
              return `
                <article class="inventory-card selection-picker-card">
                  <div class="inventory-card-top">
                    <div class="inventory-card-main">
                      <div class="equipment-cell">
                        ${equipmentHeading(item)}
                      </div>
                      <div class="inventory-inline-groups">
                        <div class="inline-info">
                          <span class="info-label">ジャンル</span>
                          <div class="type-badge-list">${(item.genres || []).length > 0 ? item.genres.map((entry) => badge(entry, "badge-blue")).join("") : badge("未設定", "badge-blue")}</div>
                        </div>
                        <div class="inline-info">
                          <span class="info-label">種類</span>
                          <div class="type-badge-list">${typeBadges(item.types)}</div>
                        </div>
                      </div>
                    </div>
                    <div class="inventory-stock">
                      <span class="stock ${stockClass}">${available}</span>
                      <span class="inventory-stock-total">/ ${item.stock}</span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <div class="action-cluster action-cluster-main">
                      ${selectedQty > 0 ? `<button class="pill-action" data-action="remove-selection-unit" data-equip-id="${item.id}">-</button>` : ""}
                      ${selectedQty > 0 ? `<span class="selected-qty">${selectedQty}</span>` : ""}
                      <button class="pill-action" data-action="add-selection" data-equip-id="${item.id}" ${available <= 0 ? "disabled" : ""}>+</button>
                    </div>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        ` : `
          <div class="empty-state selection-empty-state compact">
            <div class="empty-state-mark">?</div>
            <h2>追加できる機材がありません</h2>
            <p>検索条件やフィルターを変えてみてください。</p>
          </div>
        `}
      </section>

      <section class="panel">
        <div class="section-head">
          <div>
            <h2>選定済み機材</h2>
            <p>${escapeHTML(project.name)} に入っている機材です。</p>
          </div>
        </div>

        ${project.items.length > 0 ? `
          <div class="selection-grid">
            ${project.items.map((selection) => {
              const item = getEquipment(selection.equipId);
              const ownershipAvailability = getOwnershipAvailability(selection.equipId);
              return `
                <article class="selection-card">
                  <div class="selection-card-top">
                    <div class="selection-heading">
                      ${equipmentHeading(item)}
                      ${(item?.genres || []).length > 0 ? item.genres.map((entry) => badge(entry, "badge-blue")).join("") : badge("未設定", "badge-blue")}
                    </div>
                    <div class="selection-qty-badge">×${selection.qty}</div>
                  </div>

                  <div class="info-group info-group-wide">
                    <span class="info-label">所有の残数</span>
                    <div class="ownership-list">
                      ${ownershipAvailability.map((entry) => `<span class="ownership-pill">${escapeHTML(entry.ownerName)} <strong>${entry.available}</strong></span>`).join("")}
                    </div>
                    <div class="sub-note">持ち出し確定時に所有ごとの数を振り分けます</div>
                  </div>

                  <div class="card-actions">
                    <div class="action-cluster action-cluster-main">
                      <button class="pill-action" data-action="remove-selection-unit" data-equip-id="${selection.equipId}">-</button>
                      <button class="pill-action" data-action="add-selection" data-equip-id="${selection.equipId}" ${getAvailable(selection.equipId) <= 0 ? "disabled" : ""}>+</button>
                    </div>
                    <div class="action-cluster action-cluster-danger">
                      <button class="pill-action pill-action-danger" data-action="remove-selection-all" data-equip-id="${selection.equipId}">外す</button>
                    </div>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        ` : `
          <div class="empty-state selection-empty-state compact">
            <div class="empty-state-mark">+</div>
            <h2>この現場の選定はまだ空です</h2>
            <p>上の機材一覧から追加できます。</p>
          </div>
        `}
      </section>
    ` : ""}
  `;
}

function renderHistory() {
  const groups = groupHistory();

  if (groups.length === 0) {
    return `
      <section class="panel">
        <div class="empty-state">
          <div class="empty-state-mark">=</div>
          <h2>履歴がありません</h2>
          <p>持ち出しを確定すると、ここに履歴が表示されます。</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="panel">
      <div class="history-list">
        ${groups.map(([key, items]) => {
          const [projectName, person, destination, startDate, endDate] = key.split("|");
          const allReturned = items.every((item) => item.returned);
          const groupHistoryIds = items.map((item) => item.id).join(",");
          return `
            <div class="history-card-wrap">
              <button class="history-delete-outside" data-action="delete-history-group" data-history-ids="${escapeHTML(groupHistoryIds)}" aria-label="この現場の履歴を削除">×</button>
              <article class="history-card ${allReturned ? "done" : "active"}">
                <header class="history-header">
                  <div class="history-title">
                    <span class="history-dot" style="background:${allReturned ? "#16a34a" : "#f59e0b"};"></span>
                    ${projectName ? badge(projectName, "badge-gray") : ""}
                    <strong>${escapeHTML(person)}</strong>
                    <span>${escapeHTML(destination)}</span>
                    ${badge(allReturned ? "返却済み" : "持ち出し中", allReturned ? "badge-green" : "badge-amber")}
                  </div>
                  <div class="history-header-actions">
                    <span>${escapeHTML(formatDateRange(startDate, endDate))}</span>
                    ${allReturned ? "" : `<button class="mini-button" data-action="return-history-group" data-history-ids="${escapeHTML(groupHistoryIds)}">まとめて返却</button>`}
                  </div>
                </header>
                <div class="history-body">
                  ${items.map((item) => `
                    <div class="history-item">
                      <div class="history-meta">
                        ${equipmentHeading(getEquipment(item.equipId), true)}
                        ${badge(`×${item.qty}`, "badge-gray")}
                        <span class="allocation-line">所有: ${escapeHTML(formatAllocationSummary(item.allocations))}</span>
                      </div>
                      <div class="history-item-actions">
                        ${item.returned
                          ? `<span class="returned-tag">返却 ${escapeHTML(item.returnDate || "-")}</span>`
                          : `<button class="mini-button" data-action="return-equipment" data-history-id="${escapeHTML(item.id)}">返却する</button>`}
                      </div>
                    </div>
                  `).join("")}
                </div>
              </article>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderAddModal() {
  const manufacturerOptions = getManufacturerOptions();
  const genreOptions = getFieldOptions("genres");
  const typeOptions = getFieldOptions("types");
  const ownershipNames = getOwnershipNames();
  const ownershipTotal = state.addForm.ownerships.reduce((sum, entry) => sum + toPositiveInt(entry.qty, 0), 0);
  const stock = toPositiveInt(state.addForm.stock, 0);
  const statusClass = ownershipTotal === stock ? "form-status-ok" : "form-status-warn";
  const isEditing = state.editingEquipmentId !== null;

  return `
    <div class="modal ${state.showAddModal ? "open" : ""}">
      <div class="modal-backdrop" data-action="close-add-modal"></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-modal-title">
        <div class="modal-head">
          <div>
            <h2 id="add-modal-title">${isEditing ? "機材を編集" : "機材を追加"}</h2>
            <p>${isEditing ? "メモ更新、買い増し、所有主追加もここで編集できます。" : "総数と所有数を一致させて登録します。"}</p>
          </div>
          <button class="modal-close" data-action="close-add-modal" aria-label="閉じる">×</button>
        </div>

        <div data-add-form>
          <div class="form-grid">
            <div class="field">
              <label for="add-manufacturer">メーカー名</label>
              <input id="add-manufacturer" class="text-input" type="text" list="manufacturer-options" placeholder="既存から選択、または新規入力" value="${escapeHTML(state.addForm.manufacturer)}" />
              <datalist id="manufacturer-options">
                ${manufacturerOptions.map((option) => `<option value="${escapeHTML(option)}"></option>`).join("")}
              </datalist>
            </div>
            <div class="field">
              <label for="add-name">機材名</label>
              <input id="add-name" class="text-input" type="text" placeholder="例: SM58" value="${escapeHTML(state.addForm.name)}" />
            </div>
            <div class="field">
              <label for="add-stock">総数</label>
              <input id="add-stock" class="number-input" type="number" min="0" value="${stock}" />
            </div>
          </div>

          <div class="ownership-editor">
            <div class="ownership-editor-head">
              <div>
                <h3>所有内訳</h3>
                <p>所有名ごとの数を入力してください。</p>
              </div>
              <button class="ghost-button" data-action="add-ownership-row">所有を追加</button>
            </div>

            ${state.addForm.ownerships.map((entry) => `
              <div class="ownership-edit-row" data-add-ownership-row data-row-id="${escapeHTML(entry.id)}">
                <input class="text-input" data-add-owner-name type="text" list="ownership-options" placeholder="既存から選択、または新規入力" value="${escapeHTML(entry.name)}" />
                <input class="number-input" data-add-owner-qty type="number" min="0" max="${stock}" value="${toPositiveInt(entry.qty, 0)}" />
                <button class="pill-action pill-action-danger" data-action="remove-ownership-row" data-row-id="${escapeHTML(entry.id)}">削除</button>
              </div>
            `).join("")}

            <datalist id="ownership-options">
              ${ownershipNames.map((option) => `<option value="${escapeHTML(option)}"></option>`).join("")}
            </datalist>

            <div class="form-status ${statusClass}" data-add-form-status>
              総数 ${stock} / 所有数合計 ${ownershipTotal}
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label for="add-genre">ジャンル</label>
              <div class="type-editor">
                <div class="type-editor-input-row">
                  <input id="add-genre" class="text-input" type="text" list="genre-options" placeholder="既存から選択、または新規入力" value="${escapeHTML(state.addForm.genreDraft)}" />
                  <button class="ghost-button" data-action="add-genre-chip">ジャンルを追加</button>
                </div>
                <datalist id="genre-options">
                  ${genreOptions.map((option) => `<option value="${escapeHTML(option)}"></option>`).join("")}
                </datalist>
                <div class="type-chip-list">
                  ${(state.addForm.genres || []).length > 0
                    ? state.addForm.genres.map((entry) => `
                      <span class="type-chip" data-genre-chip data-value="${escapeHTML(entry)}">
                        <span>${escapeHTML(entry)}</span>
                        <button class="type-chip-remove" data-action="remove-genre-chip" data-value="${escapeHTML(entry)}" aria-label="${escapeHTML(entry)} を削除">×</button>
                      </span>
                    `).join("")
                    : `<span class="sub-note">ジャンルは必要に応じて複数追加できます</span>`}
                </div>
              </div>
            </div>
            <div class="field">
              <label for="add-type">種類</label>
              <div class="type-editor">
                <div class="type-editor-input-row">
                  <input id="add-type" class="text-input" type="text" list="type-options" placeholder="既存から選択、または新規入力" value="${escapeHTML(state.addForm.typeDraft)}" />
                  <button class="ghost-button" data-action="add-type-chip">種類を追加</button>
                </div>
                <datalist id="type-options">
                  ${typeOptions.map((option) => `<option value="${escapeHTML(option)}"></option>`).join("")}
                </datalist>
                <div class="type-chip-list">
                  ${(state.addForm.types || []).length > 0
                    ? state.addForm.types.map((entry) => `
                      <span class="type-chip" data-type-chip data-value="${escapeHTML(entry)}">
                        <span>${escapeHTML(entry)}</span>
                        <button class="type-chip-remove" data-action="remove-type-chip" data-value="${escapeHTML(entry)}" aria-label="${escapeHTML(entry)} を削除">×</button>
                      </span>
                    `).join("")
                    : `<span class="sub-note">必要に応じて種類を追加できます</span>`}
                </div>
              </div>
            </div>
            <div class="field field-wide">
              <label for="add-notes">メモ</label>
              <input id="add-notes" class="text-input" type="text" placeholder="任意のメモ" value="${escapeHTML(state.addForm.notes)}" />
            </div>
            <div class="field field-wide">
              <label for="add-image-url">画像</label>
              <div class="attachment-editor">
                <input id="add-image-url" class="text-input" type="text" placeholder="画像URLを入力" value="${escapeHTML(state.addForm.imageUrl)}" />
                <input id="add-image-file" class="text-input" type="file" accept="image/*" />
                <div class="attachment-status">
                  <span>${state.addForm.imageFileName ? `画像ファイル: ${escapeHTML(state.addForm.imageFileName)}` : state.addForm.imageUrl ? "画像URLが設定されています" : "画像は未設定です"}</span>
                  ${(state.addForm.imageFileName || state.addForm.imageUrl || state.addForm.imageFileData)
                    ? `<button class="mini-button" data-action="clear-image-attachment">画像を消す</button>`
                    : ""}
                </div>
              </div>
            </div>
            <div class="field field-wide">
              <label for="add-manual-url">説明書</label>
              <div class="attachment-editor">
                <input id="add-manual-url" class="text-input" type="text" placeholder="説明書URLを入力" value="${escapeHTML(state.addForm.manualUrl)}" />
                <input id="add-manual-file" class="text-input" type="file" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" />
                <div class="attachment-status">
                  <span>${state.addForm.manualFileName ? `説明書ファイル: ${escapeHTML(state.addForm.manualFileName)}` : state.addForm.manualUrl ? "説明書URLが設定されています" : "説明書は未設定です"}</span>
                  ${(state.addForm.manualFileName || state.addForm.manualUrl || state.addForm.manualFileData)
                    ? `<button class="mini-button" data-action="clear-manual-attachment">説明書を消す</button>`
                    : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="ghost-button" data-action="close-add-modal">キャンセル</button>
          <button class="primary-button" data-action="confirm-add-equipment">${isEditing ? "更新する" : "追加する"}</button>
        </div>
      </div>
    </div>
  `;
}

function renderMediaViewer() {
  if (!state.mediaViewer) {
    return "";
  }

  const item = getEquipment(state.mediaViewer.equipId);
  if (!item) {
    return "";
  }

  if (state.mediaViewer.kind === "image") {
    const source = getImageSource(item);
    return `
      <div class="modal open">
        <div class="modal-backdrop" data-action="close-media-viewer"></div>
        <div class="modal-card media-modal-card" role="dialog" aria-modal="true" aria-labelledby="media-viewer-title">
          <div class="modal-head">
            <div>
              <h2 id="media-viewer-title">機材写真</h2>
              <p>${escapeHTML(item.manufacturer)} ${escapeHTML(item.name)}</p>
            </div>
            <button class="modal-close" data-action="close-media-viewer" aria-label="閉じる">×</button>
          </div>
          <div class="media-preview-wrap">
            ${source ? `<img class="media-preview-image" src="${escapeHTML(source)}" alt="${escapeHTML(item.name)}" />` : `<p>画像がありません</p>`}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal open">
      <div class="modal-backdrop" data-action="close-media-viewer"></div>
      <div class="modal-card media-modal-card" role="dialog" aria-modal="true" aria-labelledby="manual-viewer-title">
        <div class="modal-head">
          <div>
            <h2 id="manual-viewer-title">説明書</h2>
            <p>${escapeHTML(item.manufacturer)} ${escapeHTML(item.name)}</p>
          </div>
          <button class="modal-close" data-action="close-media-viewer" aria-label="閉じる">×</button>
        </div>
        <div class="manual-list">
          ${item.manualUrl ? `<a class="manual-link" href="${escapeHTML(item.manualUrl)}" target="_blank" rel="noreferrer">URLを開く</a>` : ""}
          ${item.manualFileData ? `<a class="manual-link" href="${escapeHTML(item.manualFileData)}" target="_blank" download="${escapeHTML(item.manualFileName || `${item.name}-manual`)}">ファイルを開く${item.manualFileName ? ` (${escapeHTML(item.manualFileName)})` : ""}</a>` : ""}
          ${!item.manualUrl && !item.manualFileData ? `<p>説明書は登録されていません。</p>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderCheckoutModal() {
  if (!state.checkoutForm) {
    return "";
  }

  const project = getSelectionProject(state.checkoutProjectId);
  if (!project) {
    return "";
  }

  const totalQty = project.items.reduce((sum, item) => sum + item.qty, 0);

  return `
    <div class="modal ${state.showCheckoutModal ? "open" : ""}">
      <div class="modal-backdrop" data-action="close-checkout-modal"></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
        <div class="modal-head">
          <div>
            <h2 id="checkout-modal-title">持ち出し情報</h2>
            <p>${escapeHTML(project.name)} の所有ごとの振り分けを確認して確定します。</p>
          </div>
          <button class="modal-close" data-action="close-checkout-modal" aria-label="閉じる">×</button>
        </div>

        <div data-checkout-form>
          <div class="checkout-summary">
            <strong>持ち出し機材</strong>
            ${project.items.map((selection) => `
              <div class="checkout-item">
                ${equipmentHeading(getEquipment(selection.equipId), true)}
                <span>×${selection.qty}</span>
              </div>
            `).join("")}
            <div class="checkout-item">
              <strong>合計</strong>
              <strong>${totalQty} 点</strong>
            </div>
          </div>

          <div class="form-grid" style="margin-top: 16px;">
            <div class="field">
              <label for="checkout-person">担当者名</label>
              <input id="checkout-person" class="text-input" type="text" placeholder="例: 山田太郎" value="${escapeHTML(state.checkoutForm.person)}" />
            </div>
            <div class="field">
              <label for="checkout-destination">持ち出し先</label>
              <input id="checkout-destination" class="text-input" type="text" placeholder="例: ○○ホール" value="${escapeHTML(state.checkoutForm.destination)}" />
            </div>
            <div class="field">
              <label for="checkout-start-date">開始日</label>
              <input id="checkout-start-date" class="text-input" type="date" value="${escapeHTML(state.checkoutForm.startDate)}" />
            </div>
            <div class="field">
              <label for="checkout-end-date">終了日</label>
              <input id="checkout-end-date" class="text-input" type="date" value="${escapeHTML(state.checkoutForm.endDate)}" />
            </div>
          </div>

          <div class="allocation-section">
            ${project.items.map((selection) => {
              const item = getEquipment(selection.equipId);
              const ownershipAvailability = getOwnershipAvailability(selection.equipId);
              const allocationMap = state.checkoutForm.allocations[selection.equipId] ?? {};

              return `
                <section class="allocation-card">
                  <div class="allocation-card-head">
                    <div>
                      <h3 class="equipment-heading-title">${equipmentHeading(item, true)}</h3>
                      <p>必要数 ${selection.qty} 点</p>
                    </div>
                    <div class="allocation-total">選定数 ${selection.qty}</div>
                  </div>
                  <div class="allocation-grid">
                    ${ownershipAvailability.map((entry) => `
                      <div class="allocation-row" data-checkout-row data-equip-id="${selection.equipId}" data-owner-name="${escapeHTML(entry.ownerName)}">
                        <div>
                          <div class="allocation-owner">${escapeHTML(entry.ownerName)}</div>
                          <div class="sub-note">残数 ${entry.available} / 総数 ${entry.total}</div>
                        </div>
                        <input
                          class="number-input allocation-input"
                          data-checkout-qty
                          data-max-available="${entry.available}"
                          type="number"
                          min="0"
                          max="${entry.available}"
                          value="${toPositiveInt(allocationMap[entry.ownerName], 0)}"
                        />
                      </div>
                    `).join("")}
                  </div>
                </section>
              `;
            }).join("")}
          </div>
        </div>

        <div class="modal-actions">
          <button class="ghost-button" data-action="close-checkout-modal">キャンセル</button>
          <button class="secondary-button" data-action="confirm-checkout">確定する</button>
        </div>
      </div>
    </div>
  `;
}

function render() {
  const activeCheckoutCount = state.history.filter((item) => !item.returned).length;
  const selectedCount = getTotalSelectionQty();

  app.innerHTML = `
    <header class="hero">
      <div class="hero-title-wrap">
        <div>
          <h1>機材管理ボード</h1>
          <p class="sync-status ${getSyncStatusClass()}">${escapeHTML(getSyncStatusLabel())}</p>
        </div>
      </div>
      <div class="hero-actions">
        <div class="hero-corner-actions">
          <button class="mini-button" data-action="export-data">書き出し</button>
          <button class="mini-button" data-action="import-data">読み込み</button>
        </div>
        ${selectedCount > 0 ? `
          <button class="floating-button" data-action="set-tab" data-tab="selected">
            選定中
            <span class="button-badge">${selectedCount}</span>
          </button>
        ` : ""}
      </div>
    </header>

    <nav class="tabs">
      <button class="tab-button ${state.tab === "list" ? "active" : ""}" data-action="set-tab" data-tab="list">
        <span class="tab-title">一覧</span>
        <span class="tab-caption">機材の確認と検索</span>
      </button>
      <button class="tab-button ${state.tab === "selected" ? "active" : ""}" data-action="set-tab" data-tab="selected">
        <span class="tab-title">選定</span>
        <span class="tab-caption">持ち出し候補を整理</span>
        ${selectedCount > 0 ? `<span class="badge-counter">${selectedCount}</span>` : ""}
      </button>
      <button class="tab-button ${state.tab === "history" ? "active" : ""}" data-action="set-tab" data-tab="history">
        <span class="tab-title">履歴</span>
        <span class="tab-caption">返却状況まで確認</span>
        ${activeCheckoutCount > 0 ? `<span class="badge-counter">${activeCheckoutCount}</span>` : ""}
      </button>
    </nav>

    ${state.tab === "list" ? renderList() : ""}
    ${state.tab === "selected" ? renderSelected() : ""}
    ${state.tab === "history" ? renderHistory() : ""}
    ${renderAddModal()}
    ${renderCheckoutModal()}
    ${renderMediaViewer()}
  `;
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  switch (target.dataset.action) {
    case "set-tab":
      setTab(target.dataset.tab);
      return;
    case "create-selection-project":
      createSelectionProjectFromPrompt();
      return;
    case "set-active-selection-project":
      setActiveSelectionProject(target.dataset.projectId);
      return;
    case "delete-selection-project":
      deleteSelectionProject(target.dataset.projectId);
      return;
    case "clear-filters":
      clearFilters();
      return;
    case "open-add-modal":
      state.editingEquipmentId = null;
      state.addForm = createAddForm();
      state.showAddModal = true;
      render();
      return;
    case "export-data":
      exportAppData();
      return;
    case "import-data":
      openImportPicker();
      return;
    case "open-edit-modal":
      openEditModal(target.dataset.equipId);
      return;
    case "open-image-viewer":
      openMediaViewer("image", target.dataset.equipId);
      return;
    case "open-manual-viewer":
      openMediaViewer("manual", target.dataset.equipId);
      return;
    case "close-media-viewer":
      closeMediaViewer();
      return;
    case "close-add-modal":
      state.showAddModal = false;
      state.editingEquipmentId = null;
      state.addForm = createAddForm();
      render();
      if (state.sync.pendingRemote) {
        refreshRemoteState({ silent: true, force: true });
      }
      return;
    case "add-ownership-row":
      addOwnershipRow();
      return;
    case "remove-ownership-row":
      removeOwnershipRow(target.dataset.rowId);
      return;
    case "add-type-chip":
      addTypeChip();
      return;
    case "add-genre-chip":
      addGenreChip();
      return;
    case "remove-type-chip":
      removeTypeChip(target.dataset.value);
      return;
    case "remove-genre-chip":
      removeGenreChip(target.dataset.value);
      return;
    case "clear-image-attachment":
      clearAttachment("image");
      return;
    case "clear-manual-attachment":
      clearAttachment("manual");
      return;
    case "confirm-add-equipment":
      saveEquipmentFromForm();
      return;
    case "open-checkout-modal":
      if (!getActiveSelectionProject()) {
        window.alert("先に現場を作成してください。");
        return;
      }
      if (getProjectSelections().length === 0) {
        window.alert("この現場にはまだ機材がありません。");
        return;
      }
      state.checkoutProjectId = state.activeSelectionProjectId;
      state.checkoutForm = buildDefaultCheckoutForm(getActiveSelectionProject());
      state.showCheckoutModal = true;
      render();
      return;
    case "close-checkout-modal":
      state.showCheckoutModal = false;
      state.checkoutForm = null;
      state.checkoutProjectId = null;
      render();
      if (state.sync.pendingRemote) {
        refreshRemoteState({ silent: true, force: true });
      }
      return;
    case "confirm-checkout":
      checkoutFromForm();
      return;
    case "add-selection":
      addSelection(target.dataset.equipId);
      return;
    case "remove-selection-unit":
      removeSelectionUnit(target.dataset.equipId);
      return;
    case "remove-selection-all":
      removeSelectionAll(target.dataset.equipId);
      return;
    case "delete-equipment":
      deleteEquipment(target.dataset.equipId);
      return;
    case "return-equipment":
      returnEquipment(target.dataset.historyId);
      return;
    case "return-history-group":
      returnHistoryGroup(target.dataset.historyIds);
      return;
    case "delete-history-group":
      deleteHistoryGroup(target.dataset.historyIds);
      return;
    default:
      return;
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id === "search-text") {
    state.searchText = event.target.value;
    render();
    return;
  }

  if (event.target.id === "add-stock") {
    clampAddOwnershipInputs();
    return;
  }

  if (event.target.matches("[data-add-owner-qty]")) {
    const row = event.target.closest("[data-add-ownership-row]");
    clampAddOwnershipInputs(row?.dataset.rowId);
    return;
  }

  if (event.target.matches("[data-checkout-qty]")) {
    const row = event.target.closest("[data-checkout-row]");
    clampCheckoutAllocationInputs(row?.dataset.equipId, row?.dataset.ownerName);
  }
});

app.addEventListener("keydown", (event) => {
  if (event.target.id === "add-genre" && event.key === "Enter") {
    event.preventDefault();
    addGenreChip();
  }

  if (event.target.id === "add-type" && event.key === "Enter") {
    event.preventDefault();
    addTypeChip();
  }
});

app.addEventListener("change", (event) => {
  if (event.target.id === "add-image-file" && event.target.files?.[0]) {
    syncAddFormFromDOM();
    const file = event.target.files[0];
    readFileAsDataURL(file).then((dataUrl) => {
      state.addForm.imageFileData = dataUrl;
      state.addForm.imageFileName = file.name;
      render();
    }).catch(() => {
      window.alert("画像ファイルの読み込みに失敗しました。");
    });
    return;
  }

  if (event.target.id === "add-manual-file" && event.target.files?.[0]) {
    syncAddFormFromDOM();
    const file = event.target.files[0];
    readFileAsDataURL(file).then((dataUrl) => {
      state.addForm.manualFileData = dataUrl;
      state.addForm.manualFileName = file.name;
      render();
    }).catch(() => {
      window.alert("説明書ファイルの読み込みに失敗しました。");
    });
    return;
  }

  if (event.target.id === "import-data-file" && event.target.files?.[0]) {
    importAppData(event.target.files[0]).finally(() => {
      event.target.value = "";
    });
    return;
  }

  switch (event.target.id) {
    case "filter-manufacturer":
      state.filterManufacturer = event.target.value;
      render();
      return;
    case "filter-genre":
      state.filterGenre = event.target.value;
      render();
      return;
    case "filter-type":
      state.filterType = event.target.value;
      render();
      return;
    case "filter-ownership":
      state.filterOwnership = event.target.value;
      render();
      return;
    default:
      return;
  }
});

window.addEventListener("focus", () => {
  if (isRemoteStoreEnabled()) {
    refreshRemoteState({ silent: true });
  }
});

writeLocalCache();
render();

if (isRemoteStoreEnabled()) {
  refreshRemoteState({ force: true }).finally(() => {
    startRemotePolling();
  });
}
