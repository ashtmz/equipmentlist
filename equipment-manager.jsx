import { useState, useMemo } from "react";
import _ from "lodash";

// --- Sample Data ---
const INITIAL_EQUIPMENT = [
  { id: 1, name: "SHURE SM58", genre: "マイク", purpose: "ボーカル", owner: "音響部", stock: 8, notes: "定番ダイナミックマイク" },
  { id: 2, name: "SENNHEISER e935", genre: "マイク", purpose: "ボーカル", owner: "音響部", stock: 4, notes: "" },
  { id: 3, name: "DPA 4099", genre: "マイク", purpose: "楽器収音", owner: "音響部", stock: 6, notes: "クリップ式コンデンサー" },
  { id: 4, name: "YAMAHA CL5", genre: "ミキサー", purpose: "PA", owner: "音響部", stock: 1, notes: "デジタルコンソール" },
  { id: 5, name: "QSC K12.2", genre: "スピーカー", purpose: "PA", owner: "音響部", stock: 4, notes: "パワードスピーカー" },
  { id: 6, name: "ETC Ion Xe", genre: "調光卓", purpose: "照明", owner: "照明部", stock: 1, notes: "" },
  { id: 7, name: "ETC Source Four", genre: "灯体", purpose: "照明", owner: "照明部", stock: 12, notes: "750W エリスポ" },
  { id: 8, name: "ATEM Mini Extreme", genre: "スイッチャー", purpose: "映像", owner: "映像部", stock: 2, notes: "配信用" },
  { id: 9, name: "Canon XA75", genre: "カメラ", purpose: "映像", owner: "映像部", stock: 3, notes: "業務用カムコーダー" },
  { id: 10, name: "Sennheiser EW-D", genre: "ワイヤレス", purpose: "PA", owner: "音響部", stock: 6, notes: "デジタルワイヤレスシステム" },
];

const GENRE_OPTIONS = ["マイク", "ミキサー", "スピーカー", "灯体", "調光卓", "カメラ", "スイッチャー", "ワイヤレス", "ケーブル", "電源", "スタンド", "その他"];
const PURPOSE_OPTIONS = ["PA", "ボーカル", "楽器収音", "照明", "映像", "配信", "通信", "電源", "その他"];

// --- Icons as SVG components ---
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconPackage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconTruck = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>;
const IconHistory = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconFilter = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconReturn = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>;

// --- Badge Component ---
const Badge = ({ children, color = "gray" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    purple: "bg-purple-100 text-purple-800",
    gray: "bg-gray-100 text-gray-700",
    orange: "bg-orange-100 text-orange-800",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>{children}</span>;
};

// --- Modal Component ---
const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      <div className={`relative bg-white rounded-2xl shadow-2xl ${wide ? "w-full max-w-2xl" : "w-full max-w-lg"} max-h-[90vh] overflow-y-auto mx-4`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"><IconX /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function EquipmentManager() {
  const [tab, setTab] = useState("list"); // list | selected | history
  const [equipment, setEquipment] = useState(INITIAL_EQUIPMENT);
  const [nextId, setNextId] = useState(11);
  const [selections, setSelections] = useState([]); // { id, equipId, qty, person, destination, date }
  const [history, setHistory] = useState([]); // completed checkouts
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Add equipment form state
  const [newEquip, setNewEquip] = useState({ name: "", genre: "", purpose: "", owner: "", stock: 1, notes: "" });

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({ person: "", destination: "", date: new Date().toISOString().slice(0, 10) });

  // Computed: available stock (total - selected qty)
  const getAvailable = (equipId) => {
    const item = equipment.find(e => e.id === equipId);
    if (!item) return 0;
    const selectedQty = selections.filter(s => s.equipId === equipId).reduce((sum, s) => sum + s.qty, 0);
    // Also subtract active (not returned) history items
    const checkedOutQty = history.filter(h => h.equipId === equipId && !h.returned).reduce((sum, h) => sum + h.qty, 0);
    return item.stock - selectedQty - checkedOutQty;
  };

  // Get unique owners
  const owners = useMemo(() => [...new Set(equipment.map(e => e.owner).filter(Boolean))], [equipment]);

  // Filtered equipment
  const filtered = useMemo(() => {
    return equipment.filter(e => {
      if (searchText && !e.name.toLowerCase().includes(searchText.toLowerCase()) && !e.notes.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterGenre && e.genre !== filterGenre) return false;
      if (filterPurpose && e.purpose !== filterPurpose) return false;
      if (filterOwner && e.owner !== filterOwner) return false;
      return true;
    });
  }, [equipment, searchText, filterGenre, filterPurpose, filterOwner]);

  const activeFilters = [filterGenre, filterPurpose, filterOwner].filter(Boolean).length;

  // Add equipment
  const handleAddEquipment = () => {
    if (!newEquip.name.trim()) return;
    setEquipment(prev => [...prev, { ...newEquip, id: nextId, stock: Number(newEquip.stock) || 1 }]);
    setNextId(n => n + 1);
    setNewEquip({ name: "", genre: "", purpose: "", owner: "", stock: 1, notes: "" });
    setShowAddModal(false);
  };

  // Select equipment (add to selection list)
  const handleSelect = (equipId) => {
    const avail = getAvailable(equipId);
    if (avail <= 0) return;
    const existing = selections.find(s => s.equipId === equipId);
    if (existing) {
      setSelections(prev => prev.map(s => s.equipId === equipId ? { ...s, qty: s.qty + 1 } : s));
    } else {
      setSelections(prev => [...prev, { id: Date.now(), equipId, qty: 1 }]);
    }
  };

  // Remove from selection
  const handleDeselect = (equipId) => {
    setSelections(prev => {
      const item = prev.find(s => s.equipId === equipId);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter(s => s.equipId !== equipId);
      return prev.map(s => s.equipId === equipId ? { ...s, qty: s.qty - 1 } : s);
    });
  };

  const removeSelection = (equipId) => {
    setSelections(prev => prev.filter(s => s.equipId !== equipId));
  };

  // Checkout (confirm taking equipment)
  const handleCheckout = () => {
    if (!checkoutForm.person.trim() || !checkoutForm.destination.trim() || selections.length === 0) return;
    const newHistory = selections.map(s => ({
      id: Date.now() + Math.random(),
      equipId: s.equipId,
      qty: s.qty,
      person: checkoutForm.person,
      destination: checkoutForm.destination,
      date: checkoutForm.date,
      returned: false,
      returnDate: null,
    }));
    setHistory(prev => [...newHistory, ...prev]);
    setSelections([]);
    setCheckoutForm({ person: "", destination: "", date: new Date().toISOString().slice(0, 10) });
    setShowCheckoutModal(false);
    setTab("history");
  };

  // Return equipment
  const handleReturn = (histId) => {
    setHistory(prev => prev.map(h => h.id === histId ? { ...h, returned: true, returnDate: new Date().toISOString().slice(0, 10) } : h));
  };

  // Delete equipment
  const handleDeleteEquipment = (equipId) => {
    setEquipment(prev => prev.filter(e => e.id !== equipId));
    setSelections(prev => prev.filter(s => s.equipId !== equipId));
  };

  const getEquipName = (equipId) => equipment.find(e => e.id === equipId)?.name || "(削除済み)";
  const getEquip = (equipId) => equipment.find(e => e.id === equipId);

  // --- Tab: Equipment List ---
  const renderList = () => (
    <div>
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></div>
            <input
              type="text"
              placeholder="機材名・メモで検索..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${activeFilters > 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
          >
            <IconFilter />
            フィルター
            {activeFilters > 0 && <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilters}</span>}
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            <IconPlus /> 追加
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全ジャンル</option>
              {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全用途</option>
              {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全所有者</option>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterGenre(""); setFilterPurpose(""); setFilterOwner(""); }} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                クリア
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500 mb-3">{filtered.length} 件の機材</div>

      {/* Equipment Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">機材名</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">ジャンル</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">用途</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">所有者</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">在庫</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">メモ</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const avail = getAvailable(item.id);
              const selectedQty = selections.find(s => s.equipId === item.id)?.qty || 0;
              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3"><Badge color="blue">{item.genre}</Badge></td>
                  <td className="px-4 py-3"><Badge color="purple">{item.purpose}</Badge></td>
                  <td className="px-4 py-3 text-gray-600">{item.owner}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${avail <= 0 ? "text-red-500" : avail <= 2 ? "text-yellow-600" : "text-green-600"}`}>
                      {avail}
                    </span>
                    <span className="text-gray-400">/{item.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.notes}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {selectedQty > 0 && (
                        <button onClick={() => handleDeselect(item.id)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="選定を1つ減らす">−</button>
                      )}
                      {selectedQty > 0 && <span className="text-sm font-bold text-blue-700 min-w-[20px] text-center">{selectedQty}</span>}
                      <button
                        onClick={() => handleSelect(item.id)}
                        disabled={avail <= 0}
                        className={`p-1.5 rounded-lg transition ${avail <= 0 ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}
                        title={avail <= 0 ? "在庫なし" : "選定に追加"}
                      >+</button>
                      <button onClick={() => handleDeleteEquipment(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition ml-1" title="削除">
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">該当する機材がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- Tab: Selected Items ---
  const renderSelected = () => (
    <div>
      {selections.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-300 mb-3"><IconTruck /></div>
          <p className="text-gray-400 text-lg mb-1">選定リストが空です</p>
          <p className="text-gray-400 text-sm">機材一覧から「＋」ボタンで機材を選定してください</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">機材名</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ジャンル</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">数量</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {selections.map(sel => {
                  const equip = getEquip(sel.equipId);
                  return (
                    <tr key={sel.equipId} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{equip?.name || "(不明)"}</td>
                      <td className="px-4 py-3"><Badge color="blue">{equip?.genre}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleDeselect(sel.equipId)} className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition">−</button>
                          <span className="font-bold text-lg min-w-[30px] text-center">{sel.qty}</span>
                          <button
                            onClick={() => handleSelect(sel.equipId)}
                            disabled={getAvailable(sel.equipId) <= 0}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${getAvailable(sel.equipId) <= 0 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
                          >+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeSelection(sel.equipId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><IconTrash /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{selections.length} 種類・合計 {selections.reduce((s, x) => s + x.qty, 0)} 点</p>
            <button onClick={() => setShowCheckoutModal(true)} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition shadow-sm">
              <IconTruck /> 持ち出し確定
            </button>
          </div>
        </>
      )}
    </div>
  );

  // --- Tab: History ---
  const renderHistory = () => (
    <div>
      {history.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-300 mb-3"><IconHistory /></div>
          <p className="text-gray-400 text-lg mb-1">履歴がありません</p>
          <p className="text-gray-400 text-sm">機材を持ち出すと、ここに履歴が表示されます</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Group by checkout batch (same person + destination + date) */}
          {Object.entries(_.groupBy(history, h => `${h.person}|${h.destination}|${h.date}`)).map(([key, items]) => {
            const [person, destination, date] = key.split("|");
            const allReturned = items.every(i => i.returned);
            return (
              <div key={key} className={`rounded-xl border ${allReturned ? "border-green-200 bg-green-50/30" : "border-orange-200 bg-orange-50/30"} overflow-hidden`}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${allReturned ? "bg-green-500" : "bg-orange-500"}`} />
                    <div>
                      <span className="font-bold text-gray-900">{person}</span>
                      <span className="mx-2 text-gray-300">→</span>
                      <span className="font-medium text-gray-700">{destination}</span>
                    </div>
                    <Badge color={allReturned ? "green" : "orange"}>{allReturned ? "返却済" : "持ち出し中"}</Badge>
                  </div>
                  <span className="text-sm text-gray-500">{date}</span>
                </div>
                <div className="px-5 py-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900">{getEquipName(item.equipId)}</span>
                        <Badge color="gray">×{item.qty}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.returned ? (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">返却 {item.returnDate}</span>
                        ) : (
                          <button onClick={() => handleReturn(item.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full transition">
                            <IconReturn /> 返却
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white"><IconPackage /></div>
              <h1 className="text-xl font-bold text-gray-900">機材管理</h1>
            </div>
            {selections.length > 0 && tab !== "selected" && (
              <button onClick={() => setTab("selected")} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition">
                <IconTruck />
                選定中 <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{selections.reduce((s, x) => s + x.qty, 0)}</span>
              </button>
            )}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {[
              { key: "list", label: "機材一覧", icon: <IconPackage /> },
              { key: "selected", label: "選定リスト", icon: <IconTruck />, badge: selections.length > 0 ? selections.reduce((s, x) => s + x.qty, 0) : 0 },
              { key: "history", label: "持ち出し履歴", icon: <IconHistory />, badge: history.filter(h => !h.returned).length },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                {t.icon} {t.label}
                {t.badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {tab === "list" && renderList()}
        {tab === "selected" && renderSelected()}
        {tab === "history" && renderHistory()}
      </div>

      {/* Add Equipment Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="機材を追加">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">機材名 <span className="text-red-500">*</span></label>
            <input type="text" value={newEquip.name} onChange={e => setNewEquip(p => ({ ...p, name: e.target.value }))} placeholder="例: SHURE SM58" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ジャンル</label>
              <select value={newEquip.genre} onChange={e => setNewEquip(p => ({ ...p, genre: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選択...</option>
                {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用途</label>
              <select value={newEquip.purpose} onChange={e => setNewEquip(p => ({ ...p, purpose: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選択...</option>
                {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所有者</label>
              <input type="text" value={newEquip.owner} onChange={e => setNewEquip(p => ({ ...p, owner: e.target.value }))} placeholder="例: 音響部" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">在庫数</label>
              <input type="number" min={0} value={newEquip.stock} onChange={e => setNewEquip(p => ({ ...p, stock: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <input type="text" value={newEquip.notes} onChange={e => setNewEquip(p => ({ ...p, notes: e.target.value }))} placeholder="任意のメモ" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">キャンセル</button>
            <button onClick={handleAddEquipment} disabled={!newEquip.name.trim()} className={`px-5 py-2.5 text-sm font-medium rounded-xl transition ${newEquip.name.trim() ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              <span className="flex items-center gap-1.5"><IconPlus /> 追加する</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal open={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="持ち出し情報を入力">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 mb-2">
            <p className="text-sm font-medium text-gray-600 mb-2">持ち出し機材</p>
            {selections.map(sel => (
              <div key={sel.equipId} className="flex justify-between text-sm py-1">
                <span className="text-gray-900">{getEquipName(sel.equipId)}</span>
                <span className="text-gray-500">×{sel.qty}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-medium">
              <span>合計</span>
              <span>{selections.reduce((s, x) => s + x.qty, 0)} 点</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">担当者名 <span className="text-red-500">*</span></label>
            <input type="text" value={checkoutForm.person} onChange={e => setCheckoutForm(p => ({ ...p, person: e.target.value }))} placeholder="例: 山田太郎" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">持ち出し先 <span className="text-red-500">*</span></label>
            <input type="text" value={checkoutForm.destination} onChange={e => setCheckoutForm(p => ({ ...p, destination: e.target.value }))} placeholder="例: ○○ホール / △△イベント" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input type="date" value={checkoutForm.date} onChange={e => setCheckoutForm(p => ({ ...p, date: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCheckoutModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">キャンセル</button>
            <button
              onClick={handleCheckout}
              disabled={!checkoutForm.person.trim() || !checkoutForm.destination.trim()}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl transition ${checkoutForm.person.trim() && checkoutForm.destination.trim() ? "bg-green-600 text-white hover:bg-green-700 shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              <span className="flex items-center gap-1.5"><IconCheck /> 確定する</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}