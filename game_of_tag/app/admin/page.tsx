"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  adminLogin, adminLogout, getFullLogs,
  getPlayers, savePlayer, getCheckpoints, saveCheckpoint,
  getAdminMetadata, getPlayerStatus,
  getQuests, saveQuest, saveTeam, deleteTeam, getPlayerLogs,
  getCronStatus, triggerCronRestart
} from "../../src/actions/admin";
import { getDetailedGameConfig, saveGameConfig } from "../../src/actions/adminConfig";
import {
  LOG_TYPE_SUCCESS,
  LOG_TYPE_CATCH,
  LOG_TYPE_GPS_NOT_ACCURATE,
  LOG_TYPE_TIMEOUT,
  ROLE_RUNNER_ID,
  ROLE_HUNTER_ID
} from "../../src/constants";

// --- HELPERS ---
const getLogColor = (id: number) => {
  switch (id) {
    case LOG_TYPE_SUCCESS: return "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]";
    case LOG_TYPE_CATCH: return "text-pink font-bold drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]";
    case LOG_TYPE_GPS_NOT_ACCURATE: return "text-yellow-500";
    case LOG_TYPE_TIMEOUT: return "text-red-400"; // TIMEOUT
    default: return "text-slate-400";
  }
};

// NOVÉ: Stylizace pro typy úkolů
const getQuestTypeStyle = (typeName: string | undefined) => {
  const t = typeName?.toLowerCase() || "";
  if (t.includes("city")) return "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
  if (t.includes("nature")) return "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]";
  if (t.includes("mixed")) return "bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]";
  // Default
  return "bg-slate-800 text-slate-300 border-slate-700";
};

const BackgroundEffects = () => (
  <>
    <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0" />
    <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-600/20 blur-[120px] rounded-full pointer-events-none z-0" />
  </>
);

// --- STYLING HELPERS (DYNAMIC) ---

const getTeamTheme = (teamName: string | null | undefined) => {
  const t = teamName?.toLowerCase() || "";

  // Seznam podporovaných barev v Tailwindu (seřazeno tak, aby se chytly časté barvy)
  const supportedColors = [
    "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal",
    "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
    "slate", "gray", "zinc", "neutral", "stone"
  ];

  // Najdeme barvu v názvu týmu, nebo použijeme defaultní "slate"
  // Např. "Alpha Red Team" -> najde "red"
  const color = supportedColors.find(c => t.includes(c)) || "slate";

  return {
    // Základní barva pro text a ikony
    text: `text-${color}-500`,

    // Barva rámečku (s poloviční průhledností)
    border: `border-${color}-500/50`,

    // Stín boxu - použijeme tmavší odstín pro hloubku
    shadow: `shadow-${color}-900/20`,

    // Gradient pro hover efekt
    gradientFrom: `from-${color}-500/10`,

    // Glow efekt:
    // Trik: drop-shadow s currentColor používá aktuální barvu textu (text-*-500),
    // takže nemusíme složitě řešit RGBA hodnoty.
    glow: `drop-shadow-[0_0_8px_currentColor]`,

    // Helper property, kdybychom potřebovali samotný název barvy
    rawColor: color
  };
};

// Wrapper pro jednoduché obarvení textu v tabulkách
const getTeamColorClass = (teamName: string | null | undefined) => {
  const theme = getTeamTheme(teamName);
  // Vrací např.: "text-blue-500 drop-shadow-[0_0_8px_currentColor]"
  return `${theme.text} ${theme.glow}`;
};

// --- UI COMPONENTS ---

const TabButton = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-bold tracking-wider uppercase text-sm transition-all border-b-2 whitespace-nowrap ${active
      ? "text-white border- bg-white/5 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
      : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5"
      }`}
  >
    {label}
  </button>
);

const ActionButton = ({ onClick, children, variant = "primary" }: any) => {
  const base = "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg transform hover:scale-105 active:scale-95 ";
  const styles = variant === "primary"
    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple hover:to- shadow-purple-900/50"
    : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white";
  return <button onClick={onClick} className={base + styles}>{children}</button>;
};

const InputField = (props: any) => (
  <input
    {...props}
    className={`w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-slate-600 ${props.type === "number" ? "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" : ""} ${props.className || ''}`}
  />
);

const ToggleSwitch = ({ checked, onChange, label, className = "" }: { checked: boolean, onChange: (c: boolean) => void, label?: string, className?: string }) => (
  <label className={`flex items-center cursor-pointer gap-3 ${className}`}>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
    </div>
    {label && <span className="text-sm text-slate-300 font-bold">{label}</span>}
  </label>
);

const SelectField = (props: any) => (
  <select
    {...props}
    className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border- focus:ring-1 focus:ring- transition-all cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
  />
);

export default function AdminPage() {
  // States
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);


  // CRON logs states
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [logFilterLevel, setLogFilterLevel] = useState<string>('ALL');
  const [logLimit, setLogLimit] = useState<number>(50);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);

  // Login
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Data & Tabs
  const [activeTab, setActiveTab] = useState<"logs" | "players" | "status" | "checkpoints" | "quests" | "teams" | "settings">("logs");

  const [logs, setLogs] = useState<any[]>([]);
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [checkpointsList, setCheckpointsList] = useState<any[]>([]);
  const [questsList, setQuestsList] = useState<any[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);
  const [settingsList, setSettingsList] = useState<any[]>([]);

  const [meta, setMeta] = useState<{ teams: any[], roles: any[], privileges: any[], types: any[] } | null>(null);
  const [playerLogsMap, setPlayerLogsMap] = useState<Record<number, any[]>>({});
  const [statusExpandedId, setStatusExpandedId] = useState<number | null>(null);
  const [cronStatus, setCronStatus] = useState<{ lastRun: number, isAlive: boolean, diff: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Filters
  const [logFilter, setLogFilter] = useState<number | "all">("all");
  const [statusTeamFilter, setStatusTeamFilter] = useState<string>("all");
  const [questFilter, setQuestFilter] = useState<number | "all">("all"); // NOVÉ: Filtr pro úkoly

  // Editing State
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // --- INITIAL LOAD & AUTH ---
  const loadAllData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    const [logsRes, metaRes, playersRes, checkRes, statusRes, questsRes, settingsRes, cronRes] = await Promise.all([
      getFullLogs(),
      getAdminMetadata(),
      getPlayers(),
      getCheckpoints(),
      getPlayerStatus(),
      getQuests(),
      getDetailedGameConfig(),
      getCronStatus()
    ]);

    if (logsRes.success) setLogs((logsRes as any).data);
    if (metaRes.success) setMeta((metaRes as any).data);
    if (playersRes.success) setPlayersList((playersRes as any).data);
    if (checkRes.success) setCheckpointsList((checkRes as any).data);
    if (statusRes.success) setStatusList((statusRes as any).data);
    if (questsRes.success) setQuestsList((questsRes as any).data);
    if (settingsRes && Array.isArray(settingsRes)) setSettingsList(settingsRes);
    if (cronRes && (cronRes as any).success) setCronStatus((cronRes as any));

    if (!isBackground) setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminLogin(name, pass);
    if (res.success) {
      setIsAuth(true);
      loadAllData();
    } else {
      setLoginError((res as any).message || "Chyba přihlášení");
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsAuth(false);
  };

  // AUTO-REFRESH
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isAuth) {
      loadAllData();
      interval = setInterval(() => {
        loadAllData(true); // Background refresh
      }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh, isAuth, loadAllData]);

  const scoreStats = useMemo(() => {
    // Pokud nemáme načtená metadata týmů, vrátíme prázdné pole
    if (!meta?.teams) return [];

    return meta.teams.map((team: any) => {
      // 1. Získat body týmu přímo z tabulky TEAM (předpokládáme sloupec points)
      const teamPointsFromDb = team.points || 0;

      // 2. Spočítat sumu bodů hráčů, kteří patří do tohoto týmu
      const playersSum = playersList
        .filter(p => p.teamId === team.idTeam)
        .reduce((sum, p) => sum + (p.points || 0), 0);

      // 3. Kontrola integrity dat
      const isMatch = teamPointsFromDb === playersSum;

      return {
        id: team.idTeam,
        name: team.name,
        displayPoints: teamPointsFromDb,
        playersSum: playersSum,
        isMatch: isMatch,
        theme: getTeamTheme(team.name)
      };
    });
  }, [meta, playersList]);

  // --- EDITING HANDLERS ---
  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  // PLAYERS
  const startEditPlayer = (player: any) => {
    setEditingId(player.idPlayer);
    setEditForm({
      id: player.idPlayer,
      name: player.name,
      playName: player.playName,
      pass: player.pass,
      teamId: player.teamId,
      roleId: player.roleId,
      privilegeLevel: player.privilegeLevel
    });
    // Načtení logů hráče
    loadPlayerLogs(player.idPlayer);
  };

  const loadPlayerLogs = async (playerId: number) => {
    const res = await getPlayerLogs(playerId);
    if (res.success && "data" in res) {
      setPlayerLogsMap(prev => ({ ...prev, [playerId]: (res as any).data }));
    }
  };

  const startCreatePlayer = () => {
    setEditingId("new");
    setEditForm({ name: "", playName: "", pass: "", teamId: meta?.teams[0]?.idTeam || null, roleId: meta?.roles[0]?.idPlayerRole || null, privilegeLevel: 1 });
  };

  const submitPlayer = async () => {
    const res = await savePlayer(editForm);
    if (res.success) {
      setEditingId(null);
      const updated = await getPlayers();
      if (updated.success && "data" in updated) setPlayersList(updated.data as any[]);
    } else {
      alert("Chyba: " + (res as any).message);
    }
  };

  // CHECKPOINTS
  const startEditCheckpoint = (cp: any) => {
    setEditingId(cp.idLocation);
    setEditForm({
      id: cp.idLocation,
      name: cp.name,
      typeId: cp.typeId,
      teamId: cp.teamId,
      gps: cp.gps,
      completed: !!cp.completed
    });
  };

  const startCreateCheckpoint = () => {
    setEditingId("new");
    setEditForm({ customId: "", name: "", typeId: meta?.types?.[0]?.idQuestType || 1, teamId: null, gps: "", completed: false });
  };

  const submitCheckpoint = async () => {
    const { id, customId, ...rest } = editForm as any;
    const payload = editingId === "new" ? rest : { ...rest, id };
    const res = await saveCheckpoint(payload);

    if (res.success) {
      setEditingId(null);
      const updated = await getCheckpoints();
      if (updated.success && "data" in updated) setCheckpointsList(updated.data as any[]);
    } else {
      alert("Chyba: " + (res as any).message);
    }
  };

  // QUESTS
  const startEditQuest = (quest: any) => {
    setEditingId(quest.idQuest);
    setEditForm({
      id: quest.idQuest,
      name: quest.name,
      description: quest.description,
      questTypeId: quest.questTypeId,
      timeLimit: quest.timeLimit
    });
  };

  const startCreateQuest = () => {
    setEditingId("new");
    setEditForm({
      name: "",
      description: "",
      questTypeId: meta?.types?.[0]?.idQuestType || 1,
      timeLimit: 360
    });
  };

  const submitQuest = async () => {
    // 1. NEJDŘÍVE: Ošetření dat (Sanitizace)
    // Zajistíme, že čísla jsou opravdu čísla. Pokud je to NaN, použijeme fallback (např. 1 nebo 0).
    const sanitizedForm = {
      ...editForm,
      questTypeId: Number(editForm.questTypeId) || 1, // Pokud NaN, nastaví 1
      timeLimit: Number(editForm.timeLimit) || 0      // Pokud NaN, nastaví 0
    };

    // 2. POTÉ: Logika pro ID (tvůj požadavek)
    // Destrukturalizace z již opraveného objektu 'sanitizedForm'
    const { id, ...rest } = sanitizedForm as any;

    // Pokud je "new", pošleme objekt bez ID ('rest'). Jinak celý objekt s ID.
    const payload = editingId === "new" ? rest : sanitizedForm;

    // 3. Odeslání
    const res = await saveQuest(payload);

    if (res.success) {
      setEditingId(null);
      const updated = await getQuests();
      if (updated.success && "data" in updated) setQuestsList(updated.data as any[]);
    } else {
      alert("Chyba: " + (res as any).message);
    }
  };

  // --- STATISTIKY TÝMŮ ---
  const enrichedTeams = useMemo(() => {
    if (!meta?.teams) return [];

    return [...meta.teams].map(t => {
      const pCount = playersList.filter(p => p.teamId === t.idTeam).length;
      const cpCount = checkpointsList.filter(cp => cp.teamId === t.idTeam).length;
      // Odhad splněných úkolů pomocí logů (bez nutnosti dalšího DB dotazu)
      const completedCount = logs.filter(l => l.logTypeId === LOG_TYPE_SUCCESS && l.playerTeam === t.name).length;

      return { ...t, pCount, cpCount, completedCount };
    }).sort((a, b) => (b.points || 0) - (a.points || 0)); // Řazení podle nasbíraných bodů
  }, [meta?.teams, playersList, checkpointsList, logs]);

  // --- TEAMS HANDLERS ---
  const startEditTeam = (team: any) => {
    setEditingId(`team_${team.idTeam}`); // prefix, aby se to netlouklo s ID z jiných tabů
    setEditForm({
      id: team.idTeam,
      name: team.name,
      points: team.points,
      map: team.map || "",
      life360: team.life360 || ""
    });
  };

  const startCreateTeam = () => {
    setEditingId("new_team");
    setEditForm({ name: "", points: 0, map: "", life360: "" });
  };

  const submitTeam = async () => {
    const payload = editingId === "new_team" ? { ...editForm } : { ...editForm, id: editForm.id };
    const res = await saveTeam(payload);

    if (res.success) {
      setEditingId(null);
      loadAllData(); // Refreshne celou stránku, čímž se zaktualizuje meta.teams i statistiky
    } else {
      alert("Chyba: " + (res as any).message);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!window.confirm("Opravdu chceš smazat tento tým? Tuto akci nelze vrátit zpět.")) {
      return;
    }

    const res = await deleteTeam(id);
    if (res.success) {
      setEditingId(null);
      loadAllData(); // Zaktualizuje tabulku na frontendu
    } else {
      alert("Chyba při mazání: " + (res as any).message);
    }
  };

  // --- SETTINGS HANDLERS ---
  const handleSettingChange = (name: string, value: string) => {
    setSettingsList(prev => prev.map(s => s.name === name ? { ...s, value } : s));
  };

  const submitSettings = async () => {
    setSaveStatus('saving');
    // Only pass name and numeric value
    const payload = settingsList.map(s => ({ name: s.name, value: Number(s.value) }));
    const res = await saveGameConfig(payload);
    if (res.success) {
      setSaveStatus('success');
      loadAllData();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      alert("Chyba při ukládání nastavení: " + res.message);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCronRestart = async () => {
    if (!window.confirm("Opravdu chceš restartovat/ručně spustit herní CRON?")) return;
    const res = await triggerCronRestart();
    if (res.success) {
      alert("CRON byl úspěšně spuštěn.");
      loadAllData(true);
    } else {
      alert("Chyba při spouštění CRONu: " + (res as any).message);
    }
  };

  // Funkce pro načtení logů (Zavolá tvůj API endpoint)
  const fetchSystemLogs = async () => {
    setLogsLoading(true);
    try {
      // Zde doplň správnou cestu k tvému API endpointu, který tahá data z tabulky systemLogs
      const res = await fetch(`/api/admin/cron_logs?limit=${logLimit}&level=${logFilterLevel}`);
      if (res.ok) {
        const data = await res.json();
        setSystemLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Nepodařilo se načíst logy:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Načíst logy při změně filtru nebo limitu, nebo při načtení tabu
  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSystemLogs();
    }
  }, [activeTab, logFilterLevel, logLimit]);

  // -----------------------
  // ---  RENDER ADMIN   ---
  // -----------------------

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <BackgroundEffects />
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-wider">GAME OF <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-">TAG</span></h1>
            <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-2">Admin Console</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <InputField placeholder="Jméno" value={name} onChange={(e: any) => setName(e.target.value)} required />
            <InputField type="password" placeholder="PIN" value={pass} onChange={(e: any) => setPass(e.target.value)} required />
            {loginError && <p className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{loginError}</p>}
            <button type="submit" className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white font-bold p-3 rounded-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all">VSTOUPIT</button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-2 md:p-8 font-sans relative overflow-x-hidden">
      <BackgroundEffects />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-8 backdrop-blur-sm bg-black/20 p-6 rounded-2xl border border-white/5">
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter">
              GAME OF <span className="text-transparent bg-clip-text bg-linear-to-r from-purple to- pr-4">TAG</span>
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Live Control Panel</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded border transition-all ${autoRefresh
                ? "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse"
                : "bg-transparent text-slate-500 border-slate-700 hover:text-slate-300"
                }`}
            >
              {autoRefresh ? "LIVE: ON" : "LIVE: OFF"}
            </button>

            {loading && <span className="text-purple-400 animate-pulse text-xs font-bold uppercase">Synchronizace...</span>}

            {/* CRON Status Indicator */}
            {cronStatus && (
              <div className="flex items-center gap-2 group cursor-help" title={`Poslední běh před ${cronStatus.diff}s`}>
                <div className={`w-2 h-2 rounded-full ${cronStatus.isAlive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'}`}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Cron</span>
              </div>
            )}

            <button onClick={() => loadAllData()} className="text-slate-400 hover:text-white text-sm uppercase tracking-wider font-bold transition-colors">Refresh</button>
            <div className="h-4 w-px bg-slate-700"></div>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-400 text-sm uppercase tracking-wider font-bold transition-colors">Odhlásit</button>
          </div>
        </div>

        {/* SCOREBOARD */}
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(scoreStats.length || 3, 4)} gap-6 mb-10`}>
          {scoreStats.length === 0 ? (
            <div className="col-span-full text-center text-slate-500 py-8 bg-slate-900/50 rounded-2xl border border-white/5">
              Načítám týmy nebo žádné týmy neexistují...
            </div>
          ) : (
            scoreStats.map(stat => (
              <div
                key={stat.id}
                className={`bg-slate-900/60 backdrop-blur-md border ${stat.theme.border} p-6 rounded-2xl text-center shadow-xl ${stat.theme.shadow} relative overflow-hidden group transition-all hover:scale-[1.02]`}
              >
                {/* Dynamický gradient na pozadí */}
                <div className={`absolute inset-0 bg-linear-to-b ${stat.theme.gradientFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                {/* Název týmu s dynamickou barvou */}
                <h3 className={`${stat.theme.text} font-black uppercase tracking-[0.3em] text-sm mb-2 drop-shadow-sm`}>
                  {stat.name}
                </h3>

                {/* Skóre - zde přidáváme glow efekt podle barvy týmu */}
                <p className={`text-6xl font-black text-white mb-2 ${stat.theme.glow}`}>
                  {stat.displayPoints}
                </p>

                {/* Zbytek karty... */}
                <div className="text-xs font-mono border-t border-white/10 pt-2 mt-2">
                  {stat.isMatch ? (
                    <span className="text-slate-500 flex items-center justify-center gap-1 opacity-70">
                      <span className="text-green-500">✓</span> DB Integrity OK
                    </span>
                  ) : (
                    <span className="text-orange-500 font-bold flex items-center justify-center gap-1 animate-pulse">
                      <span className="text-red-500">⚠</span> Chyba součtu: {stat.playersSum}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* TABS & CONTENT */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[600px]">

          {/* Tabs Header */}
          <div className="flex gap-1 border-b border-white/10 p-4 pb-0 overflow-x-auto bg-black/20">
            <TabButton active={activeTab === 'logs'} label="Logy" onClick={() => setActiveTab('logs')} />
            <TabButton active={activeTab === 'status'} label="Stav" onClick={() => setActiveTab('status')} />
            <TabButton active={activeTab === 'players'} label="Hráči" onClick={() => setActiveTab('players')} />
            <TabButton active={activeTab === 'checkpoints'} label="Checkpointy" onClick={() => setActiveTab('checkpoints')} />
            <TabButton active={activeTab === 'quests'} label="Úkoly" onClick={() => setActiveTab('quests')} />
            <TabButton active={activeTab === 'teams'} label="Týmy" onClick={() => setActiveTab('teams')} />
            <TabButton active={activeTab === 'settings'} label="Nastavení hry" onClick={() => setActiveTab('settings')} />
          </div>

          <div className="p-6">

            {/* --- TAB: NASTAVENÍ HRY --- */}
            {activeTab === 'settings' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-8 bg-slate-800/50 backdrop-blur border border-purple-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                  <h3 className="text-pink-500 mb-6 font-bold uppercase tracking-widest text-sm border-b border-white/5 pb-2">CRON status</h3>
                  <div className="bg-black/40 p-6 rounded-2xl border my-4 border-white/5 shadow-inner">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-black mb-1">Stav systému</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${cronStatus?.isAlive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                            <span className={`font-bold ${cronStatus?.isAlive ? 'text-emerald-400' : 'text-red-500'}`}>
                              {cronStatus?.isAlive ? 'AKTIVNÍ' : 'NEAKTIVNÍ / SPADL'}
                            </span>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-white/5 md:block hidden"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-black mb-1">Poslední běh</span>
                          <span className="text-white font-mono">
                            {cronStatus?.lastRun ? new Date(cronStatus.lastRun * 1000).toLocaleTimeString() : 'Nikdy'}
                            <span className="text-slate-500 text-xs ml-2">(před {cronStatus?.diff || '?'} s)</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleCronRestart}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-2 py-2 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                        Restartovat CRON
                      </button>
                    </div>
                  </div>

                  <h3 className="text-pink-500 font-bold uppercase tracking-widest text-sm">Technická nastavení</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {settingsList.filter(s => ['MULTIPLAYER_BASE_SECONDS', 'GPS_TIMEOUT_MS', 'CHECKPOINT_RADIUS_METERS'].includes(s.name)).map(s => (
                      <div key={s.name} className="flex flex-col justify-between bg-black/20 p-5 rounded-xl border border-white/5 shadow-inner">
                        <label className="text-sm font-bold text-slate-200 mb-4 min-h-[40px] flex items-start">
                          {s.description}
                        </label>
                        <div className="mt-auto">
                          <InputField type="number" value={s.value} onChange={(e: any) => handleSettingChange(s.name, e.target.value)} />
                          <p className="text-[10px] text-slate-500 mt-2 font-mono opacity-60">{s.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-pink-500 font-bold uppercase tracking-widest text-sm">Herní nastavení</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {settingsList.filter(s => !['MULTIPLAYER_BASE_SECONDS', 'GPS_TIMEOUT_MS', 'CHECKPOINT_RADIUS_METERS', 'CRON_LAST_RUN'].includes(s.name)).map(s => (
                      <div key={s.name} className="flex flex-col justify-between bg-black/20 p-5 rounded-xl border border-white/5 shadow-inner">
                        <label className="text-sm font-bold text-slate-200 mb-4 min-h-[40px] flex items-start">
                          {s.description}
                        </label>
                        <div className="mt-auto">
                          <InputField type="number" value={s.value} onChange={(e: any) => handleSettingChange(s.name, e.target.value)} />
                          <p className="text-[10px] text-slate-500 mt-2 font-mono opacity-60">{s.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>



                  <div className="flex justify-end mt-4 items-center gap-4">
                    <button
                      onClick={submitSettings}
                      disabled={saveStatus === 'saving'}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center gap-2 ${saveStatus === 'saving'
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : saveStatus === 'success'
                          ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                          : "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:-translate-y-0.5"
                        }`}
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                          UKLÁDÁM...
                        </>
                      ) : saveStatus === 'success' ? (
                        "ULOŽENO ✓"
                      ) : (
                        "ULOŽIT NASTAVENÍ"
                      )}
                    </button>
                  </div>

                  {/* --- SYSTÉMOVÉ LOGY CRONu --- */}
                  <div className="mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                      <h3 className="text-pink-500 font-bold uppercase tracking-widest text-sm">CRON Logy</h3>

                      {/* Ovládací prvky pro filtraci */}
                      <div className="flex gap-4 items-center">
                        <select
                          className="bg-black/40 text-xs text-slate-300 border border-white/10 rounded-lg p-2 outline-none focus:border-purple-500/50"
                          value={logFilterLevel}
                          onChange={(e) => setLogFilterLevel(e.target.value)}
                        >
                          <option value="ALL">Všechny úrovně</option>
                          <option value="INFO">Pouze INFO</option>
                          <option value="WARNING">Pouze WARNING</option>
                          <option value="ERROR">Pouze ERROR</option>
                        </select>

                        <select
                          className="bg-black/40 text-xs text-slate-300 border border-white/10 rounded-lg p-2 outline-none focus:border-purple-500/50"
                          value={logLimit}
                          onChange={(e) => setLogLimit(Number(e.target.value))}
                        >
                          <option value={10}>Posledních 10</option>
                          <option value={50}>Posledních 50</option>
                          <option value={100}>Posledních 100</option>
                        </select>

                        <button
                          onClick={fetchSystemLogs}
                          className="bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10 transition-colors"
                          title="Obnovit logy"
                        >
                          🔄
                        </button>
                      </div>
                    </div>

                    {/* Kontejner pro výpis logů */}
                    <div className="bg-black/40 rounded-2xl border border-white/5 shadow-inner overflow-hidden flex flex-col h-[400px]">
                      {logsLoading ? (
                        <div className="flex-1 flex justify-center items-center text-slate-500 text-sm animate-pulse">
                          Načítám logy systému...
                        </div>
                      ) : systemLogs.length === 0 ? (
                        <div className="flex-1 flex justify-center items-center text-slate-600 text-sm italic">
                          Pro zvolený filtr nebyly nalezeny žádné záznamy.
                        </div>
                      ) : (
                        <div className="overflow-y-auto p-4 flex flex-col gap-2 relative">
                          {systemLogs.map((log) => (
                            <div
                              key={log.id}
                              className={`flex flex-col p-3 rounded-lg border-l-4 text-xs font-mono 
                                ${log.level === 'ERROR' ? 'bg-red-950/20 border-red-500 text-red-200' :
                                  log.level === 'WARNING' ? 'bg-orange-950/20 border-orange-500 text-orange-200' :
                                    'bg-slate-900/40 border-purple-500 text-slate-300'}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`font-black ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARNING' ? 'text-orange-400' : 'text-purple-400'}`}>
                                  [{log.level}]
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="leading-relaxed">{log.message}</p>

                              {/* Zobrazení detailů (např. Stack Trace) pokud existují a jde o chybu */}
                              {log.details && (
                                <details className="mt-2 group">
                                  <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-white transition-colors">Zobrazit detaily chyby</summary>
                                  <div className="mt-2 p-2 bg-black/60 rounded text-[9px] overflow-x-auto whitespace-pre text-slate-400 border border-white/5">
                                    {log.details}
                                  </div>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* --- KONEC NOVÉ SEKCE --- */}
                </div>
              </div>
            )}

            {/* --- TAB: LOGY --- */}
            {activeTab === 'logs' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-end mb-6">
                  <div className="flex items-center gap-3">
                    <label className="text-slate-500 text-xs uppercase font-bold pl-2">Filtr:</label>
                    <SelectField
                      className="border-none text-white text-sm focus:ring-0 cursor-pointer bg-transparent"
                      value={logFilter}
                      onChange={(e: any) => setLogFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    >
                      <option value="all">Všechny události</option>
                      <option value={LOG_TYPE_SUCCESS}>Splněné úkoly</option>
                      <option value={LOG_TYPE_CATCH}>Chycení hráče</option>
                      <option value={LOG_TYPE_GPS_NOT_ACCURATE}>Chyby GPS</option>
                    </SelectField>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-4 font-bold">Čas</th>
                        <th className="p-4 font-bold">Hráč</th>
                        <th className="p-4 font-bold">Tým</th>
                        <th className="p-4 font-bold">Akce</th>
                        <th className="p-4 font-bold">Lokace</th>
                        <th className="p-4 font-bold">Úkol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.filter(l => logFilter === "all" || l.logTypeId === logFilter).map(log => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 text-slate-400 text-xs font-mono">{new Date(log.time).toLocaleTimeString()}</td>
                          <td className="p-4 font-bold text-white group-hover:text-pink-200">{log.playerName}</td>
                          <td className={`p-4 uppercase text-xs font-black tracking-wider ${getTeamColorClass(log.playerTeam)}`}>
                            {log.playerTeam}
                          </td>
                          <td className={`p-4 text-sm font-medium ${getLogColor(log.logTypeId)}`}>{log.action}</td>
                          <td className="p-4 text-slate-300 text-sm">{log.locationName}</td>
                          <td className="p-4 text-slate-300 text-sm">{log.questName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB: STAV --- */}
            {activeTab === 'status' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-end mb-6">
                  <div className="flex items-center gap-3">
                    <label className="text-slate-500 text-xs uppercase font-bold pl-2">Tým:</label>
                    <SelectField className="bg-transparent border-none text-white text-sm focus:ring-0 cursor-pointer" value={statusTeamFilter} onChange={(e: any) => setStatusTeamFilter(e.target.value)}>
                      <option value="all">Všechny</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                      <option value="blue">Blue</option>
                    </SelectField>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Hráč</th>
                        <th className="p-4">Tým / Role</th>
                        <th className="p-4 text-center">Body</th>
                        <th className="p-4 hidden md:table-cell">Stav</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {statusList
                        .filter(p => statusTeamFilter === "all" || p.team?.toLowerCase() === statusTeamFilter)
                        .map(p => {
                          const now = new Date();
                          const isRunner = p.roleId === ROLE_RUNNER_ID;
                          const isHunter = p.roleId === ROLE_HUNTER_ID;

                          // DB časy
                          const hasActiveQuest = p.questEndTime && new Date(p.questEndTime) > now;
                          const hasQuestLock = p.questLockEndtime && new Date(p.questLockEndtime) > now;
                          const isBubble = p.bubbleBurstTime && new Date(p.bubbleBurstTime) > now;

                          // Logika Běžec
                          // Pokud má questLock a zároveň bublinu, byl chycen (= Zastaven).
                          // Pokud má questLock ale nemá bublinu, vypršel mu úkol (= Trest).
                          const runnerPenalty = hasQuestLock && !isBubble;
                          const runnerStopped = hasQuestLock && isBubble;
                          const runnerCanQuests = !hasQuestLock;

                          // Logika Lovec
                          // Lovec dostává questLock, když někoho chytí (= Zastaven).
                          const hunterStopped = hasQuestLock;
                          const hunterCanHunt = !hasQuestLock;

                          return (
                            <>
                              <tr
                                key={p.id}
                                className={`transition-colors cursor-pointer ${statusExpandedId === p.id ? 'bg-white/10 hover:bg-white/10' : 'hover:bg-white/5'}`}
                                onClick={() => {
                                  if (statusExpandedId === p.id) {
                                    setStatusExpandedId(null);
                                  } else {
                                    setStatusExpandedId(p.id);
                                    loadPlayerLogs(p.id);
                                  }
                                }}
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <div className="font-bold text-white text-lg">{p.playName || p.name}</div>
                                      <div className="text-xs text-slate-500 font-mono">{p.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`text-sm uppercase font-black tracking-wider ${getTeamColorClass(p.team)}`}>{p.team}</span>
                                  <span className="text-slate-600 mx-2">|</span>
                                  <span className="text-slate-300 text-sm">{p.role}</span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className="inline-block bg-slate-800 text-white font-bold px-3 py-1 rounded-full border border-slate-600 min-w-12">
                                    {p.points}
                                  </span>
                                </td>
                                <td className="p-4 hidden md:table-cell">
                                  {isRunner && (
                                    <div className="flex items-center gap-4 flex-wrap">
                                      {[{ label: 'Plní úkol', active: hasActiveQuest },
                                      { label: 'Trest', active: runnerPenalty },
                                      { label: 'Zastaven', active: runnerStopped },
                                      { label: 'Neviditelný', active: isBubble },
                                      { label: 'Úkoly', active: runnerCanQuests },
                                      ].map(({ label, active }) => (
                                        <div key={label} className="flex flex-col items-center gap-1">
                                          <div className={`w-3 h-3 rounded-full border ${active
                                            ? 'bg-emerald-400 border-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                            : 'bg-transparent border-slate-600'
                                            }`} />
                                          <span className="text-[10px] text-slate-500 whitespace-nowrap">{label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {isHunter && (
                                    <div className="flex items-center gap-4">
                                      {[{ label: 'Může lovit', active: hunterCanHunt },
                                      { label: 'Zastaven', active: hunterStopped },
                                      ].map(({ label, active }) => (
                                        <div key={label} className="flex flex-col items-center gap-1">
                                          <div className={`w-3 h-3 rounded-full border ${active
                                            ? 'bg-emerald-400 border-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                            : 'bg-transparent border-slate-600'
                                            }`} />
                                          <span className="text-[10px] text-slate-500 whitespace-nowrap">{label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                              {statusExpandedId === p.id && (
                                <tr key={`${p.id}-logs`}>
                                  <td colSpan={4} className="px-6 py-4 bg-slate-900/60 border-t border-white/5">
                                    <h4 className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">Poslední aktivita hráče</h4>
                                    {playerLogsMap[p.id] ? (
                                      playerLogsMap[p.id].length === 0 ? (
                                        <p className="text-slate-600 text-sm">Herní aktivita nenalezena.</p>
                                      ) : (
                                        <div className="overflow-hidden rounded-lg border border-white/5 max-h-60 overflow-y-auto">
                                          <table className="w-full text-left text-sm">
                                            <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider sticky top-0">
                                              <tr>
                                                <th className="p-3">Čas</th>
                                                <th className="p-3">Akce</th>
                                                <th className="p-3 hidden md:table-cell">Lokace</th>
                                                <th className="p-3 hidden md:table-cell">Úkol</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                              {playerLogsMap[p.id].map((log: any) => (
                                                <tr key={log.id} className="hover:bg-white/5">
                                                  <td className="p-3 text-slate-500 font-mono text-xs whitespace-nowrap">{new Date(log.time).toLocaleTimeString()}</td>
                                                  <td className={`p-3 font-medium ${getLogColor(log.logTypeId)}`}>{log.action}</td>
                                                  <td className="p-3 text-slate-400 hidden md:table-cell">{log.locationName || '-'}</td>
                                                  <td className="p-3 text-slate-400 hidden md:table-cell">{log.questName || '-'}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )
                                    ) : (
                                      <p className="text-slate-600 text-sm">Načítám...</p>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB: HRÁČI --- */}
            {activeTab === 'players' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-6">
                  <ActionButton onClick={startCreatePlayer}>+ Nový Hráč</ActionButton>
                </div>

                {editingId === 'new' && (
                  <div className="mb-8 bg-slate-800/50 backdrop-blur border border-purple/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                    <h3 className="text-purple-400 mb-6 font-bold uppercase tracking-widest text-sm border-b border-white/5 pb-2">Vytvoření hráče</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div><label className="text-xs text-slate-500 uppercase mb-1 block">Login (Jméno)</label><InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} /></div>
                      <div><label className="text-xs text-slate-500 uppercase mb-1 block">Herní přezdívka</label><InputField value={editForm.playName} onChange={(e: any) => handleEditChange('playName', e.target.value)} /></div>
                      <div><label className="text-xs text-slate-500 uppercase mb-1 block">Heslo</label><InputField value={editForm.pass} onChange={(e: any) => handleEditChange('pass', e.target.value)} /></div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Tým</label>
                        <SelectField value={editForm.teamId || ""} onChange={(e: any) => handleEditChange('teamId', Number(e.target.value))}>
                          {meta?.teams.map(t => <option key={t.idTeam} value={t.idTeam}>{t.name}</option>)}
                        </SelectField>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Role</label>
                        <SelectField value={editForm.roleId || ""} onChange={(e: any) => handleEditChange('roleId', Number(e.target.value))}>
                          {meta?.roles.map(r => <option key={r.idPlayerRole} value={r.idPlayerRole}>{r.name}</option>)}
                        </SelectField>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Privilegia</label>
                        <SelectField value={editForm.privilegeLevel} onChange={(e: any) => handleEditChange('privilegeLevel', Number(e.target.value))}>
                          {meta?.privileges.map(p => <option key={p.idPrivilegeLevel} value={p.idPrivilegeLevel}>{p.name}</option>)}
                        </SelectField>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <ActionButton onClick={() => setEditingId(null)} variant="secondary">Zrušit</ActionButton>
                      <ActionButton onClick={submitPlayer}>Uložit hráče</ActionButton>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {playersList.map(p => {
                    const teamName = meta?.teams.find(t => t.idTeam === p.teamId)?.name;
                    return (
                      <div key={p.idPlayer} className="bg-black/20 rounded-xl border border-white/5 hover:border-purple/30 transition-all group">
                        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-400 font-bold">
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-lg">{p.name}</span>
                                <span className="text-slate-500 text-sm">({p.playName})</span>
                              </div>
                              <div className="text-xs flex gap-3 mt-1">
                                <span className="text-slate-400">Role: <span className="text-white">{meta?.roles.find(r => r.idPlayerRole === p.roleId)?.name}</span></span>
                                <span className="text-slate-400">Tým: <span className={`uppercase font-bold ${getTeamColorClass(teamName)}`}>{teamName}</span></span>
                              </div>
                            </div>
                          </div>
                          <ActionButton onClick={() => editingId === p.idPlayer ? setEditingId(null) : startEditPlayer(p)} variant="secondary">
                            {editingId === p.idPlayer ? "Zavřít" : "Upravit"}
                          </ActionButton>
                        </div>

                        {editingId === p.idPlayer && (
                          <div className="p-6 border-t border-white/5 bg-slate-900/50">
                            {/* Editační formulář */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                              <div><label className="text-xs text-slate-500 uppercase mb-1 block">Jméno</label><InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} /></div>
                              <div><label className="text-xs text-slate-500 uppercase mb-1 block">Herní jméno</label><InputField value={editForm.playName} onChange={(e: any) => handleEditChange('playName', e.target.value)} /></div>
                              <div><label className="text-xs text-slate-500 uppercase mb-1 block">Heslo</label><InputField value={editForm.pass} onChange={(e: any) => handleEditChange('pass', e.target.value)} /></div>
                              <div>
                                <label className="text-xs text-slate-500 uppercase mb-1 block">Tým</label>
                                <SelectField value={editForm.teamId} onChange={(e: any) => handleEditChange('teamId', Number(e.target.value))}>
                                  {meta?.teams.map(t => <option key={t.idTeam} value={t.idTeam}>{t.name}</option>)}
                                </SelectField>
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 uppercase mb-1 block">Role</label>
                                <SelectField value={editForm.roleId} onChange={(e: any) => handleEditChange('roleId', Number(e.target.value))}>
                                  {meta?.roles.map(r => <option key={r.idPlayerRole} value={r.idPlayerRole}>{r.name}</option>)}
                                </SelectField>
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 uppercase mb-1 block">Privilegia</label>
                                <SelectField value={editForm.privilegeLevel} onChange={(e: any) => handleEditChange('privilegeLevel', Number(e.target.value))}>
                                  {meta?.privileges.map(p => <option key={p.idPrivilegeLevel} value={p.idPrivilegeLevel}>{p.name}</option>)}
                                </SelectField>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <ActionButton onClick={submitPlayer}>Uložit změny</ActionButton>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- TAB: CHECKPOINTY --- */}
            {activeTab === 'checkpoints' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-6">
                  <ActionButton onClick={startCreateCheckpoint}>+ Nový Checkpoint</ActionButton>
                </div>

                {editingId === 'new' && (
                  <div className="mb-8 bg-slate-800/50 backdrop-blur border border-/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                    <h3 className="text-pink-400 mb-6 font-bold uppercase tracking-widest text-sm border-b border-white/5 pb-2">Nový Checkpoint</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* <div className="col-span-2 md:col-span-1">
                          <label className="text-xs text-slate-500 uppercase mb-1 block">ID (Volitelné)</label>
                          <input 
                              className="w-full bg-slate-900 p-2 rounded text-white border border-slate-700 placeholder-slate-600" 
                              placeholder="Automaticky" 
                              value={editForm.customId || ""} 
                              type="number"
                              onChange={e => handleEditChange('customId', e.target.value)} 
                          />
                      </div> */}
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Název</label>
                        <InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">GPS</label>
                        <InputField value={editForm.gps} onChange={(e: any) => handleEditChange('gps', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Typ</label>
                        <SelectField value={editForm.typeId} onChange={(e: any) => handleEditChange('typeId', Number(e.target.value))}>
                          {meta?.types.map(t => <option key={t.idQuestType} value={t.idQuestType}>{t.name}</option>)}
                        </SelectField>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Vlastník (Tým)</label>
                        <SelectField value={editForm.teamId || ""} onChange={(e: any) => handleEditChange('teamId', e.target.value ? Number(e.target.value) : null)}>
                          <option value="">-- Žádný tým --</option>
                          {meta?.teams.map(t => <option key={t.idTeam} value={t.idTeam}>{t.name}</option>)}
                        </SelectField>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-2 block">Stav splnění</label>
                        <ToggleSwitch checked={!!editForm.completed} onChange={(c) => handleEditChange('completed', c)} label={editForm.completed ? "✓ Splněno" : "Aktivní (Nesplněno)"} />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <ActionButton onClick={() => setEditingId(null)} variant="secondary">Zrušit</ActionButton>
                      <ActionButton onClick={submitCheckpoint}>Uložit Checkpoint</ActionButton>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {checkpointsList.map(cp => {
                    const teamName = meta?.teams.find(t => t.idTeam === cp.teamId)?.name;
                    return (
                      <div key={cp.idLocation} className="bg-black/20 rounded-xl border border-white/5 hover:border-white/30 transition-all group">
                        <div className="p-4 flex justify-between items-center">
                          <div>
                            <span className="text-slate-500 font-mono mr-2">#{cp.idLocation}</span>
                            <span className="text-white font-bold text-lg group-hover:text-pink-300 transition-colors">{cp.name}</span>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                              <span>Typ: <span className="text-slate-300">{meta?.types.find(t => t.idQuestType === cp.typeId)?.name}</span></span>
                              <span className="text-slate-600">|</span>
                              <span>Vlastník: <span className={`font-bold uppercase ${getTeamColorClass(teamName)}`}>{teamName || "Všichni"}</span></span>
                              <span className="text-slate-600">|</span>

                              {/* --- NOVÝ BLOK: Indikátor stavu splnění --- */}
                              <span className={`px-2 py-0.5 rounded border ${cp.completed
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                                }`}>
                                {cp.completed ? '✓ Splněno' : 'Aktivní'}
                              </span>
                              {/* ------------------------------------------ */}

                            </div>
                          </div>
                          <ActionButton onClick={() => editingId === cp.idLocation ? setEditingId(null) : startEditCheckpoint(cp)} variant="secondary">
                            {editingId === cp.idLocation ? "Zavřít" : "Upravit"}
                          </ActionButton>
                        </div>

                        {editingId === cp.idLocation && (
                          <div className="p-6 border-t border-white/5 bg-slate-900/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div><label className="text-xs text-slate-500 uppercase mb-1 block">Název</label><InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} /></div>
                              <div><label className="text-xs text-slate-500 uppercase mb-1 block">GPS</label><InputField value={editForm.gps} onChange={(e: any) => handleEditChange('gps', e.target.value)} /></div>
                              <div>
                                <label className="text-xs text-slate-500 uppercase mb-1 block">Typ</label>
                                <SelectField value={editForm.typeId} onChange={(e: any) => handleEditChange('typeId', Number(e.target.value))}>
                                  {meta?.types.map(t => <option key={t.idQuestType} value={t.idQuestType}>{t.name}</option>)}
                                </SelectField>
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 uppercase mb-1 block">Vlastník</label>
                                <SelectField value={editForm.teamId || ""} onChange={(e: any) => handleEditChange('teamId', e.target.value ? Number(e.target.value) : null)}>
                                  <option value="">-- Žádný tým --</option>
                                  {meta?.teams.map(t => <option key={t.idTeam} value={t.idTeam}>{t.name}</option>)}
                                </SelectField>
                              </div>

                              {/* --- NOVÝ BLOK: Editace stavu ve formuláři --- */}
                              <div className="pt-6 col-span-1 md:col-span-2 flex items-center">
                                <ToggleSwitch
                                  checked={!!editForm.completed}
                                  onChange={(c) => handleEditChange('completed', c)}
                                  label={editForm.completed ? "✓ Checkpoint má splněný stav" : "Aktivní (Nesplněný stav)"}
                                />
                              </div>
                              {/* --------------------------------------------- */}

                            </div>
                            <div className="flex justify-end">
                              <ActionButton onClick={submitCheckpoint}>Uložit změny</ActionButton>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- TAB: ÚKOLY (QUESTS) --- */}
            {activeTab === 'quests' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between mb-6">
                  <ActionButton onClick={startCreateQuest}>+ Nový Úkol</ActionButton>

                  {/* NOVÉ: FILTR ÚKOLŮ */}
                  <div className="flex items-center gap-3">
                    <label className="text-slate-500 text-xs uppercase font-bold pl-2">Typ:</label>
                    <SelectField
                      className="bg-transparent border-none text-white text-sm focus:ring-0 cursor-pointer"
                      value={questFilter}
                      onChange={(e: any) => setQuestFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    >
                      <option value="all">Všechny typy</option>
                      {meta?.types.map(t => (
                        <option key={t.idQuestType} value={t.idQuestType}>{t.name}</option>
                      ))}
                    </SelectField>
                  </div>
                </div>

                {/* FORMULÁŘ PRO NOVÝ ÚKOL */}
                {editingId === 'new' && (
                  <div className="mb-8 bg-slate-800/50 backdrop-blur border border-purple/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                    <h3 className="text-purple-400 mb-6 font-bold uppercase tracking-widest text-sm border-b border-white/5 pb-2">Nový Úkol</h3>
                    <div className="grid grid-cols-1 gap-6 mb-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs text-slate-500 uppercase mb-1 block">Název</label>
                          <InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 uppercase mb-1 block">Časový limit (sekundy)</label>
                          <InputField type="number" value={editForm.timeLimit} onChange={(e: any) => handleEditChange('timeLimit', e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Popis / Zadání</label>
                        <textarea
                          className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border- transition-all h-24"
                          value={editForm.description}
                          onChange={(e: any) => handleEditChange('description', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Typ Úkolu</label>
                        <SelectField value={editForm.questTypeId} onChange={(e: any) => handleEditChange('questTypeId', Number(e.target.value))}>
                          {meta?.types.map(t => <option key={t.idQuestType} value={t.idQuestType}>{t.name}</option>)}
                        </SelectField>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <ActionButton onClick={() => setEditingId(null)} variant="secondary">Zrušit</ActionButton>
                      <ActionButton onClick={submitQuest}>Uložit Úkol</ActionButton>
                    </div>
                  </div>
                )}

                {/* SEZNAM ÚKOLŮ S FILTREM */}
                <div className="grid grid-cols-1 gap-3">
                  {questsList
                    .filter(q => questFilter === "all" || q.questTypeId === questFilter)
                    .map(q => {
                      const typeName = meta?.types.find(t => t.idQuestType === q.questTypeId)?.name;
                      return (
                        <div key={q.idQuest} className="bg-black/20 rounded-xl border border-white/5 hover:border-purple/30 transition-all group">
                          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-slate-500 font-mono text-sm">#{q.idQuest}</span>
                                <span className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors">{q.name}</span>

                                {/* NOVÉ: Barevný badge pro typ */}
                                <span className={`text-xs px-2 py-0.5 rounded border ${getQuestTypeStyle(typeName)}`}>
                                  {typeName}
                                </span>
                              </div>
                              <p className="text-slate-400 text-sm mt-2 line-clamp-1">{q.description}</p>
                              <div className="text-xs text-slate-600 mt-2">
                                Limit: {q.timeLimit}s
                              </div>
                            </div>
                            <ActionButton onClick={() => editingId === q.idQuest ? setEditingId(null) : startEditQuest(q)} variant="secondary">
                              {editingId === q.idQuest ? "Zavřít" : "Upravit"}
                            </ActionButton>
                          </div>

                          {/* EDITACE ÚKOLU */}
                          {editingId === q.idQuest && (
                            <div className="p-6 border-t border-white/5 bg-slate-900/50">
                              <div className="grid grid-cols-1 gap-6 mb-6">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <label className="text-xs text-slate-500 uppercase mb-1 block">Název</label>
                                    <InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-500 uppercase mb-1 block">Časový limit (sekundy)</label>
                                    <InputField type="number" value={editForm.timeLimit} onChange={(e: any) => handleEditChange('timeLimit', e.target.value)} />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-xs text-slate-500 uppercase mb-1 block">Popis</label>
                                  <textarea
                                    className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border- transition-all h-24"
                                    value={editForm.description}
                                    onChange={(e: any) => handleEditChange('description', e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label className="text-xs text-slate-500 uppercase mb-1 block">Typ</label>
                                  <SelectField value={editForm.questTypeId} onChange={(e: any) => handleEditChange('questTypeId', Number(e.target.value))}>
                                    {meta?.types.map(t => <option key={t.idQuestType} value={t.idQuestType}>{t.name}</option>)}
                                  </SelectField>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <ActionButton onClick={submitQuest}>Uložit změny</ActionButton>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* --- TAB: TÝMY --- */}
            {activeTab === 'teams' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-6">
                  <ActionButton onClick={startCreateTeam}>+ Nový Tým</ActionButton>
                </div>

                {/* FORMULÁŘ PRO TÝM */}
                {(editingId === 'new_team' || (typeof editingId === 'string' && editingId.startsWith('team_'))) && (
                  <div className="mb-8 bg-slate-800/50 backdrop-blur border border-purple-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                    <h3 className="text-purple-400 mb-6 font-bold uppercase tracking-widest text-sm border-b border-white/5 pb-2">
                      {editingId === 'new_team' ? "Nový Tým" : "Úprava Týmu"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Název Týmu</label>
                        <InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Body</label>
                        <InputField type="number" value={editForm.points} onChange={(e: any) => handleEditChange('points', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Odkaz na mapu (volitelné)</label>
                        <InputField value={editForm.map} onChange={(e: any) => handleEditChange('map', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase mb-1 block">Life360 Skupina (volitelné)</label>
                        <InputField value={editForm.life360} onChange={(e: any) => handleEditChange('life360', e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      {editingId !== 'new_team' && (
                        <div className="mr-auto"> {/* Odstrčí tlačítko doleva */}
                          <ActionButton onClick={() => handleDeleteTeam(editForm.id)} variant="secondary">
                            <span className="text-red-500 hover:text-red-400 transition-colors">Smazat Tým</span>
                          </ActionButton>
                        </div>
                      )}
                      <ActionButton onClick={() => setEditingId(null)} variant="secondary">Zrušit</ActionButton>
                      <ActionButton onClick={submitTeam}>Uložit Tým</ActionButton>
                    </div>
                  </div>
                )}

                {/* VÝPIS TÝMŮ VČETNĚ STATISTIK */}
                <div className="grid grid-cols-1 gap-3">
                  {enrichedTeams.map(team => {
                    const tTheme = getTeamTheme(team.name);
                    return (
                      <div key={team.idTeam} className={`bg-black/20 rounded-xl border border-white/5 transition-all group hover:${tTheme.border}`}>
                        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                          <div className="flex-1">
                            <div className="flex items-baseline gap-3">
                              <span className="text-slate-500 font-mono text-sm">#{team.idTeam}</span>
                              <span className={`font-black text-xl uppercase tracking-widest ${getTeamColorClass(team.name)}`}>
                                {team.name}
                              </span>
                            </div>

                            {/* STATISTIKY TÝMU */}
                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                              <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="text-slate-500">Skóre:</span>
                                <span className="text-white font-bold">{team.points}</span>
                              </div>
                              <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="text-slate-500">Hráčů:</span>
                                <span className="text-white font-bold">{team.pCount}</span>
                              </div>
                              <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="text-slate-500">Vlastní CP:</span>
                                <span className="text-white font-bold">{team.cpCount}</span>
                              </div>
                              <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="text-slate-500">Splněno CP:</span>
                                <span className="text-green-400 font-bold drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]">{team.completedCount}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <ActionButton onClick={() => editingId === `team_${team.idTeam}` ? setEditingId(null) : startEditTeam(team)} variant="secondary">
                              {editingId === `team_${team.idTeam}` ? "Zavřít" : "Upravit"}
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}