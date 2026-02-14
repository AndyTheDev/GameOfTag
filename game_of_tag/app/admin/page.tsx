// // --- VERSION 3 - EDIT UI --- //
// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";
// import { 
//   adminLogin, adminLogout, getFullLogs, 
//   getPlayers, savePlayer, getCheckpoints, saveCheckpoint, 
//   getAdminMetadata, getPlayerStatus 
// } from "../../src/actions/admin";
// import { 
//   LOG_TYPE_SUCCESS, 
//   LOG_TYPE_CATCH, 
//   LOG_TYPE_GPS_NOT_ACCURATE
// } from "../../src/constants";

// // --- STYLING HELPERS ---
// const getTeamColorClass = (teamName: string | null | undefined) => {
//   const t = teamName?.toLowerCase();
//   if (t?.includes("red")) return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
//   if (t?.includes("blue")) return "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]";
//   if (t?.includes("green")) return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]";
//   return "text-slate-400";
// };

// // Gradientní pozadí pro "Game of Tag" feel
// const BackgroundEffects = () => (
//   <>
//     <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple blur-[120px] rounded-full pointer-events-none z-0" />
//     <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink blur-[120px] rounded-full pointer-events-none z-0" />
//   </>
// );

// // --- UI COMPONENTS ---

// const TabButton = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
//   <button 
//     onClick={onClick}
//     className={`px-6 py-3 font-bold tracking-wider uppercase text-sm transition-all border-b-2 ${
//       active 
//         ? "text-white border-pink bg-white/5 shadow-[0_0_15px_rgba(236,72,153,0.3)]" 
//         : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5"
//     }`}
//   >
//     {label}
//   </button>
// );

// const ActionButton = ({ onClick, children, variant = "primary" }: any) => {
//   const base = "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg transform hover:scale-105 active:scale-95 ";
//   const styles = variant === "primary" 
//     ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple hover:to- shadow-purple-900/50"
//     : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white";
//   return <button onClick={onClick} className={base + styles}>{children}</button>;
// };

// const InputField = (props: any) => (
//   <input 
//     {...props}
//     className="w-full bg-slate-950/50 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border- focus:ring-1 focus:ring- transition-all placeholder-slate-600"
//   />
// );

// const SelectField = (props: any) => (
//   <select 
//     {...props}
//     className="w-full bg-slate-950/50 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border- focus:ring-1 focus:ring- transition-all"
//   />
// );

// export default function AdminPage() {
//   // --- STATE ---
//   const [isAuth, setIsAuth] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [autoRefresh, setAutoRefresh] = useState(false);
  
//   // Login
//   const [name, setName] = useState("");
//   const [pass, setPass] = useState("");
//   const [loginError, setLoginError] = useState("");

//   // Data & Tabs
//   const [activeTab, setActiveTab] = useState<"logs" | "players" | "status" | "checkpoints">("logs");
//   const [logs, setLogs] = useState<any[]>([]);
//   const [playersList, setPlayersList] = useState<any[]>([]);
//   const [checkpointsList, setCheckpointsList] = useState<any[]>([]);
//   const [statusList, setStatusList] = useState<any[]>([]);
  
//   // Metadata for Dropdowns
//   const [meta, setMeta] = useState<{teams: any[], roles: any[], privileges: any[], types: any[]} | null>(null);

//   // Filters
//   const [logFilter, setLogFilter] = useState<number | "all">("all");
//   const [statusTeamFilter, setStatusTeamFilter] = useState<string>("all");

//   // Editing State
//   const [editingId, setEditingId] = useState<number | "new" | null>(null);
//   const [editForm, setEditForm] = useState<any>({});

//   // --- INITIAL LOAD & AUTH ---
//   const loadAllData = useCallback(async (isBackground = false) => {
//     if (!isBackground) setLoading(true);
    
//     const [logsRes, metaRes, playersRes, checkRes, statusRes] = await Promise.all([
//       getFullLogs(),
//       getAdminMetadata(),
//       getPlayers(),
//       getCheckpoints(),
//       getPlayerStatus()
//     ]);

//     if (logsRes.success) setLogs((logsRes as any).data);
//     if (metaRes.success) setMeta((metaRes as any).data);
//     if (playersRes.success) setPlayersList((playersRes as any).data);
//     if (checkRes.success) setCheckpointsList((checkRes as any).data);
//     if (statusRes.success) setStatusList((statusRes as any).data);

//     if (!isBackground) setLoading(false);
//   }, []);

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const res = await adminLogin(name, pass);
//     if (res.success) {
//       setIsAuth(true);
//       loadAllData();
//     } else {
//       setLoginError((res as any).message || "Chyba přihlášení");
//     }
//   };

//   const handleLogout = async () => {
//     await adminLogout();
//     setIsAuth(false);
//   };

//   // AUTO-REFRESH DATA
//   useEffect(() => {
//     let interval: NodeJS.Timeout;
    
//     if (autoRefresh && isAuth) {
//       // Ihned načíst
//       loadAllData(); 
//       interval = setInterval(() => {
//         loadAllData();
//       }, 5000);
//     }

//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, [autoRefresh, isAuth, loadAllData]);

//   // --- SCORE CALCULATION ---
//   // Výpočet z logů (kontrola)
//   const logScores = useMemo(() => {
//     const s = { red: 0, green: 0, blue: 0 };
//     logs.forEach(log => {
//       // Zde používáme logiku bodování podle typu logu
//       if (log.logTypeId === LOG_TYPE_SUCCESS || log.logTypeId === LOG_TYPE_CATCH) {
//         const teamName = log.playerTeam?.toLowerCase();
//         let points = 1; 
//         // Pokud je to Cíl (Finish), dáváme 3 body (příklad, uprav dle ID lokace cíle)
//         if (log.logTypeId === LOG_TYPE_SUCCESS && log.locationType === 2) points = 3; 

//         if (teamName?.includes("red")) s.red += points;
//         if (teamName?.includes("green")) s.green += points;
//         if (teamName?.includes("blue")) s.blue += points;
//       }
//     });
//     return s;
//   }, [logs]);

//   // 2. HLAVNÍ VÝPOČET Z TABULKY "PLAYER"
//   const realScores = useMemo(() => {
//     const s = { red: 0, green: 0, blue: 0 };
    
//     // Potřebujeme mít načtené hráče a metadata týmů
//     if (!playersList.length || !meta?.teams) return s;

//     playersList.forEach(p => {
//       const team = meta.teams.find(t => t.idTeam === p.teamId);
      
//       if (team) {
//         const tName = team.name.toLowerCase();
//         const pts = p.points || 0;

//         if (tName.includes("red")) s.red += pts;
//         if (tName.includes("green")) s.green += pts;
//         if (tName.includes("blue")) s.blue += pts;
//       }
//     });
//     return s;
//   }, [playersList, meta]);

//   // --- EDITING HANDLERS ---
//   const handleEditChange = (field: string, value: any) => {
//     setEditForm((prev: any) => ({ ...prev, [field]: value }));
//   };

//   const startEditPlayer = (player: any) => {
//     setEditingId(player.idPlayer);
//     setEditForm({
//       id: player.idPlayer,
//       name: player.name,
//       playName: player.playName,
//       pass: player.pass,
//       teamId: player.teamId,
//       roleId: player.roleId,
//       privilegeLevel: player.privilegeLevel
//     });
//   };

//   const startCreatePlayer = () => {
//     setEditingId("new");
//     setEditForm({
//       name: "", playName: "", pass: "", teamId: meta?.teams[0]?.idTeam, roleId: meta?.roles[0]?.idPlayerRole, privilegeLevel: 1
//     });
//   };

//   const submitPlayer = async () => {
//     const res = await savePlayer(editForm);
//     if (res.success) {
//       setEditingId(null);
//       const updated = await getPlayers();
//       if (updated.success && "data" in updated) setPlayersList(updated.data as any[]);
//     } else {
//       alert("Chyba: " + (res as any).message);
//     }
//   };

//   const startEditCheckpoint = (cp: any) => {
//     setEditingId(cp.idLocation);
//     setEditForm({
//       id: cp.idLocation,
//       name: cp.name,
//       typeId: cp.typeId,
//       teamId: cp.teamId,
//       gps: cp.gps
//     });
//   };

//   const startCreateCheckpoint = () => {
//     setEditingId("new");
//     setEditForm({
//       customId: "",
//       name: "",
//       typeId: meta?.types[0]?.idQuestType,
//       teamId: null,
//       gps: ""
//     });
//   };

//   const submitCheckpoint = async () => {
//       const res = await saveCheckpoint(editForm);
//       if (res.success) {
//         setEditingId(null);
//         const updated = await getCheckpoints();
//         if (updated.success && "data" in updated) setCheckpointsList(updated.data as any[]);
//       } else {
//         alert("Chyba: " + (res as any).message);
//       }
//     };

//   // --- HELPERS ---
//   const getLogColor = (id: number) => {
//     switch(id) {
//       case LOG_TYPE_SUCCESS: return "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]";
//       case LOG_TYPE_CATCH: return "text- font-bold drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]";
//       case LOG_TYPE_GPS_NOT_ACCURATE: return "text-orange-400";
//       case 2: return "text-red-400"; // TIMEOUT
//       default: return "text-slate-400";
//     }
//   };

//   // --- RENDER LOGIN ---
//   if (!isAuth) {
//     return (
//       <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
//         <BackgroundEffects />
//         <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm z-10">
//           <div className="text-center mb-8">
//             <h1 className="text-3xl font-bold text-white tracking-wider">GAME OF <span className="text-transparent bg-clip-text bg-linear-to-r from-purple to-pink">TAG</span></h1>
//             <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-2">Admin Console</p>
//           </div>
//           <form onSubmit={handleLogin} className="flex flex-col gap-5">
//             <InputField placeholder="Jméno" value={name} onChange={(e: any) => setName(e.target.value)} required />
//             <InputField type="password" placeholder="PIN" value={pass} onChange={(e: any) => setPass(e.target.value)} required />
//             {loginError && <p className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{loginError}</p>}
//             <button type="submit" className="w-full bg-linear-to-r from-purple to-pink text-white font-bold p-3 rounded-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all">VSTOUPIT</button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   // --- RENDER DASHBOARD ---
//   return (
//     <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-2 md:p-8 font-sans relative overflow-x-hidden">
//       <BackgroundEffects />
      
//       <div className="max-w-7xl mx-auto relative z-10">
        
//         {/* HEADER */}
//       <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-8 backdrop-blur-sm bg-black/20 p-6 rounded-2xl border border-white/5">
//         <div>
//             <h1 className="text-3xl font-black text-white italic tracking-tighter">
//               GAME OF <span className="text-transparent bg-clip-text bg-linear-to-r from-purple to-pink pr-4">TAG</span>
//             </h1>
//             <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Live Control Panel</p>
//         </div>
//         <div className="flex gap-4 items-center">
//           <button 
//             onClick={() => setAutoRefresh(!autoRefresh)}
//             className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded border transition-all ${
//               autoRefresh 
//                 ? "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse" 
//                 : "bg-transparent text-slate-500 border-slate-700 hover:text-slate-300"
//             }`}
//           >
//             {autoRefresh ? "LIVE: ON" : "LIVE: OFF"}
//           </button>

//           {loading && <span className="text- animate-pulse text-xs font-bold uppercase">Synchronizace...</span>}
//           <button onClick={() => loadAllData()} className="text-slate-400 hover:text-white text-sm uppercase tracking-wider font-bold transition-colors">Refresh</button>
//           <div className="h-4 w-px bg-slate-700"></div>
//           <button onClick={handleLogout} className="text-red-500 hover:text-red-400 text-sm uppercase tracking-wider font-bold transition-colors">Odhlásit</button>
//         </div>
//       </div>

//         {/* SCOREBOARD */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
//            {['red', 'blue', 'green'].map(team => {
//              const teamKey = team as keyof typeof realScores;

//              const realScore = realScores[teamKey];
//              const logScore = logScores[teamKey];
//              const isMatch = realScore === logScore;

//              const color = team === 'red' ? 'red' : team === 'blue' ? 'blue' : 'green';
//              const borderColor = team === 'red' ? 'border-red-500/50' : team === 'blue' ? 'border-blue-500/50' : 'border-green-500/50';
//              const shadowColor = team === 'red' ? 'shadow-red-900/20' : team === 'blue' ? 'shadow-blue-900/20' : 'shadow-green-900/20';
             
//              return (
//                <div key={team} className={`bg-slate-900/60 backdrop-blur-md border ${borderColor} p-6 rounded-2xl text-center shadow-xl ${shadowColor} relative overflow-hidden group`}>
//                  <div className={`absolute inset-0 bg-linear-to-b from-${color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                 
//                  <h3 className={`text-${color}-500 font-black uppercase tracking-[0.3em] text-sm mb-2`}>{team} TEAM</h3>
                 
//                  {/* ZOBRAZENÍ HLAVNÍHO SKÓRE */}
//                  <p className="text-6xl font-black text-white drop-shadow-md mb-2">{realScore}</p>
                 
//                  {/* KONTROLA VŮČI LOGŮM */}
//                  <div className="text-xs font-mono border-t border-white/10 pt-2 mt-2">
//                     {isMatch ? (
//                         <span className="text-slate-500 flex items-center justify-center gap-1 opacity-70">
//                           <span className="text-green-500">✓</span> Skóre sedí s logy
//                         </span>
//                     ) : (
//                         <span className="text-orange-400 font-bold flex items-center justify-center gap-1 animate-pulse">
//                           <span className="text-red-500">⚠</span> Nesedí! Logy: {logScore}
//                         </span>
//                     )}
//                  </div>
//                </div>
//              )
//            })}
//         </div>

//         {/* TABS & CONTENT */}
//         <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[600px]">
          
//           {/* Tabs Header */}
//           <div className="flex gap-1 border-b border-white/10 p-4 pb-0 overflow-x-auto bg-black/20">
//             <TabButton active={activeTab === 'logs'} label="Logy" onClick={() => setActiveTab('logs')} />
//             <TabButton active={activeTab === 'players'} label="Hráči" onClick={() => setActiveTab('players')} />
//             <TabButton active={activeTab === 'status'} label="Stav" onClick={() => setActiveTab('status')} />
//             <TabButton active={activeTab === 'checkpoints'} label="Checkpointy" onClick={() => setActiveTab('checkpoints')} />
//           </div>

//           <div className="p-6">
            
//             {/* --- TAB: LOGY --- */}
//             {activeTab === 'logs' && (
//               <div className="animate-in fade-in zoom-in-95 duration-300">
//                 <div className="flex justify-end mb-6">
//                   <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-lg border border-slate-700">
//                     <label className="text-slate-500 text-xs uppercase font-bold pl-2">Filtr:</label>
//                     <select 
//                       className="border-none text-white text-sm focus:ring-0 cursor-pointer"
//                       value={logFilter}
//                       onChange={(e) => setLogFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
//                     >
//                       <option value="all">Všechny události</option>
//                       <option value={LOG_TYPE_SUCCESS}>Splněné úkoly</option>
//                       <option value={LOG_TYPE_CATCH}>Chycení hráče</option>
//                       <option value={LOG_TYPE_GPS_NOT_ACCURATE}>Chyby GPS</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
//                   <table className="w-full text-left border-collapse">
//                     <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
//                       <tr>
//                         <th className="p-4 font-bold">Čas</th>
//                         <th className="p-4 font-bold">Hráč</th>
//                         <th className="p-4 font-bold">Tým</th>
//                         <th className="p-4 font-bold">Akce</th>
//                         <th className="p-4 font-bold">Lokace</th>
//                         <th className="p-4 font-bold">Úkol</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-white/5">
//                       {logs.filter(l => logFilter === "all" || l.logTypeId === logFilter).map(log => (
//                         <tr key={log.id} className="hover:bg-white/5 transition-colors group">
//                           <td className="p-4 text-slate-400 text-xs font-mono">{new Date(log.time).toLocaleTimeString()}</td>
//                           <td className="p-4 font-bold text-white group-hover:text-pink-200">{log.playerName}</td>
//                           {/* Aplikace barvy týmu */}
//                           <td className={`p-4 uppercase text-xs font-black tracking-wider ${getTeamColorClass(log.playerTeam)}`}>
//                              {log.playerTeam}
//                           </td>
//                           <td className={`p-4 text-sm font-medium ${getLogColor(log.logTypeId)}`}>{log.action}</td>
//                           <td className="p-4 text-slate-300 text-sm">{log.locationName}</td>
//                           <td className="p-4 text-slate-300 text-sm">{log.questName}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {/* --- TAB: HRÁČI --- */}
//             {activeTab === 'players' && (
//               <div className="animate-in fade-in zoom-in-95 duration-300">
//                 <div className="mb-6">
//                   <ActionButton onClick={startCreatePlayer}>+ Nový Hráč</ActionButton>
//                 </div>
                
//                 {/* EDIT FORM */}
//                 {editingId === 'new' && (
//                   <div className="mb-8 bg-slate-800/50 backdrop-blur border border-purple/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
//                     <h3 className="text-purple-400 mb-6 font-bold uppercase tracking-widest text-sm border-b border-white/5 pb-2">Vytvoření hráče</h3>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//                       <div><label className="text-xs text-slate-500 uppercase mb-1 block">Login (Jméno)</label><InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} /></div>
//                       <div><label className="text-xs text-slate-500 uppercase mb-1 block">Herní přezdívka</label><InputField value={editForm.playName} onChange={(e: any) => handleEditChange('playName', e.target.value)} /></div>
//                       <div><label className="text-xs text-slate-500 uppercase mb-1 block">Heslo</label><InputField value={editForm.pass} onChange={(e: any) => handleEditChange('pass', e.target.value)} /></div>
                      
//                       <div>
//                         <label className="text-xs text-slate-500 uppercase mb-1 block">Tým</label>
//                         <SelectField value={editForm.teamId || ""} onChange={(e: any) => handleEditChange('teamId', Number(e.target.value))}>
//                           {meta?.teams.map(t => <option key={t.idTeam} value={t.idTeam}>{t.name}</option>)}
//                         </SelectField>
//                       </div>
//                       <div>
//                         <label className="text-xs text-slate-500 uppercase mb-1 block">Role</label>
//                         <SelectField value={editForm.roleId || ""} onChange={(e: any) => handleEditChange('roleId', Number(e.target.value))}>
//                           {meta?.roles.map(r => <option key={r.idPlayerRole} value={r.idPlayerRole}>{r.name}</option>)}
//                         </SelectField>
//                       </div>
//                       <div>
//                         <label className="text-xs text-slate-500 uppercase mb-1 block">Privilegia</label>
//                         <SelectField value={editForm.privilegeLevel} onChange={(e: any) => handleEditChange('privilegeLevel', Number(e.target.value))}>
//                           {meta?.privileges.map(p => <option key={p.idPrivilegeLevel} value={p.idPrivilegeLevel}>{p.name}</option>)}
//                         </SelectField>
//                       </div>
//                     </div>
//                     <div className="flex gap-3 justify-end">
//                       <ActionButton onClick={() => setEditingId(null)} variant="secondary">Zrušit</ActionButton>
//                       <ActionButton onClick={submitPlayer}>Uložit hráče</ActionButton>
//                     </div>
//                   </div>
//                 )}

//                 <div className="grid grid-cols-1 gap-3">
//                   {playersList.map(p => {
//                      const teamName = meta?.teams.find(t => t.idTeam === p.teamId)?.name;
//                      return (
//                       <div key={p.idPlayer} className="bg-black/20 rounded-xl border border-white/5 hover:border-purple/30 transition-all group">
//                         <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
//                           <div className="flex items-center gap-4">
//                             <div className="h-10 w-10 rounded-full bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-400 font-bold">
//                               {p.name.charAt(0)}
//                             </div>
//                             <div>
//                               <div className="flex items-center gap-2">
//                                 <span className="text-white font-bold text-lg">{p.name}</span> 
//                                 <span className="text-slate-500 text-sm">({p.playName})</span>
//                               </div>
//                               <div className="text-xs flex gap-3 mt-1">
//                                 <span className="text-slate-400">Role: <span className="text-white">{meta?.roles.find(r => r.idPlayerRole === p.roleId)?.name}</span></span>
//                                 {/* Aplikace barvy týmu */}
//                                 <span className="text-slate-400">Tým: <span className={`uppercase font-bold ${getTeamColorClass(teamName)}`}>{teamName}</span></span>
//                               </div>
//                             </div>
//                           </div>
//                           <ActionButton onClick={() => editingId === p.idPlayer ? setEditingId(null) : startEditPlayer(p)} variant="secondary">
//                             {editingId === p.idPlayer ? "Zavřít" : "Upravit"}
//                           </ActionButton>
//                         </div>

//                         {/* INLINE EDIT */}
//                         {editingId === p.idPlayer && (
//                           <div className="p-6 border-t border-white/5 bg-slate-900/50">
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//                               <div><label className="text-xs text-slate-500 uppercase mb-1 block">Jméno</label><InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} /></div>
//                               <div><label className="text-xs text-slate-500 uppercase mb-1 block">Herní jméno</label><InputField value={editForm.playName} onChange={(e: any) => handleEditChange('playName', e.target.value)} /></div>
//                               <div><label className="text-xs text-slate-500 uppercase mb-1 block">Heslo</label><InputField value={editForm.pass} onChange={(e: any) => handleEditChange('pass', e.target.value)} /></div>
                              
//                               <div>
//                                 <label className="text-xs text-slate-500 uppercase mb-1 block">Tým</label>
//                                 <SelectField value={editForm.teamId} onChange={(e: any) => handleEditChange('teamId', Number(e.target.value))}>
//                                   {meta?.teams.map(t => <option key={t.idTeam} value={t.idTeam}>{t.name}</option>)}
//                                 </SelectField>
//                               </div>
//                               <div>
//                                 <label className="text-xs text-slate-500 uppercase mb-1 block">Role</label>
//                                 <SelectField value={editForm.roleId} onChange={(e: any) => handleEditChange('roleId', Number(e.target.value))}>
//                                   {meta?.roles.map(r => <option key={r.idPlayerRole} value={r.idPlayerRole}>{r.name}</option>)}
//                                 </SelectField>
//                               </div>
//                                <div>
//                                 <label className="text-xs text-slate-500 uppercase mb-1 block">Privilegia</label>
//                                 <SelectField value={editForm.privilegeLevel} onChange={(e: any) => handleEditChange('privilegeLevel', Number(e.target.value))}>
//                                   {meta?.privileges.map(p => <option key={p.idPrivilegeLevel} value={p.idPrivilegeLevel}>{p.name}</option>)}
//                                 </SelectField>
//                               </div>
//                             </div>
//                             <div className="flex justify-end">
//                                <ActionButton onClick={submitPlayer}>Uložit změny</ActionButton>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                      );
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* --- TAB: STAV --- */}
//             {activeTab === 'status' && (
//               <div className="animate-in fade-in zoom-in-95 duration-300">
//                  <div className="flex justify-end mb-6">
//                   <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-lg border border-slate-700">
//                     <label className="text-slate-500 text-xs uppercase font-bold pl-2">Tým:</label>
//                     <select className="bg-transparent border-none text-white text-sm focus:ring-0 cursor-pointer" value={statusTeamFilter} onChange={e => setStatusTeamFilter(e.target.value)}>
//                       <option value="all">Všechny</option>
//                       <option value="red">Red</option>
//                       <option value="green">Green</option>
//                       <option value="blue">Blue</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
//                   <table className="w-full text-left">
//                     <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
//                       <tr>
//                         <th className="p-4">Hráč</th>
//                         <th className="p-4">Tým / Role</th>
//                         <th className="p-4 text-center">Body</th>
//                         <th className="p-4">Poslední akce</th>
//                         <th className="p-4">Čas</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-white/5">
//                       {statusList
//                         .filter(p => statusTeamFilter === "all" || p.team?.toLowerCase() === statusTeamFilter)
//                         .map(p => (
//                         <tr key={p.id} className="hover:bg-white/5 transition-colors">
//                           <td className="p-4">
//                             <div className="font-bold text-white text-lg">{p.playName || p.name}</div>
//                             <div className="text-xs text-slate-500 font-mono">{p.name}</div>
//                           </td>
//                           <td className="p-4">
//                             {/* Aplikace barvy týmu */}
//                             <span className={`text-sm uppercase font-black tracking-wider ${getTeamColorClass(p.team)}`}>{p.team}</span>
//                             <span className="text-slate-600 mx-2">|</span>
//                             <span className="text-slate-300 text-sm">{p.role}</span>
//                           </td>
//                           <td className="p-4 text-center">
//                              <span className="inline-block bg-slate-800 text-white font-bold px-3 py-1 rounded-full border border-slate-600 min-w-12">
//                                 {p.points}
//                              </span>
//                           </td>
//                           <td className="p-4 text-slate-300 font-medium">{p.lastLogAction || "-"}</td>
//                           <td className="p-4 text-slate-500 text-xs font-mono">
//                             {p.lastLogTime ? new Date(p.lastLogTime).toLocaleTimeString() : "-"}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {/* --- TAB: CHECKPOINTY --- */}
//             {activeTab === 'checkpoints' && (
//                <div className="animate-in fade-in zoom-in-95 duration-300">
//                 <div className="mb-6">
//                   <ActionButton onClick={startCreateCheckpoint}>+ Nový Checkpoint</ActionButton>
//                 </div>

//                 {/* EDIT FORM - NEW CP */}
//                 {editingId === 'new' && (
//                   <div className="mb-8 bg-slate-800/50 backdrop-blur border border-/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.1)]">
//                     <h3 className="text-pink-400 mb-6 font-bold uppercase tracking-widest text-sm border-b border-white/5 pb-2">Nový Checkpoint</h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                       <div className="col-span-2 md:col-span-1">
//                           <label className="text-xs text-slate-500 uppercase mb-1 block">ID (Volitelné)</label>
//                           <input 
//                               className="w-full bg-slate-950 p-2 rounded text-white border border-slate-700 placeholder-slate-600" 
//                               placeholder="Automaticky" 
//                               value={editForm.customId || ""} 
//                               type="number"
//                               onChange={e => handleEditChange('customId', e.target.value)} 
//                           />
//                       </div>
//                       <div>
//                         <label className="text-xs text-slate-500 uppercase mb-1 block">Název</label>
//                         <InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} />
//                       </div>

//                       <div>
//                         <label className="text-xs text-slate-500 uppercase mb-1 block">GPS</label>
//                         <InputField value={editForm.gps} onChange={(e: any) => handleEditChange('gps', e.target.value)} />
//                       </div>
                      
//                       <div>
//                          <label className="text-xs text-slate-500 uppercase mb-1 block">Typ</label>
//                          <SelectField value={editForm.typeId} onChange={(e: any) => handleEditChange('typeId', Number(e.target.value))}>
//                            {meta?.types.map(t => <option key={t.idQuestType} value={t.idQuestType}>{t.name}</option>)}
//                          </SelectField>
//                       </div>
//                       <div>
//                          <label className="text-xs text-slate-500 uppercase mb-1 block">Vlastník (Tým)</label>
//                          <SelectField value={editForm.teamId || ""} onChange={(e: any) => handleEditChange('teamId', e.target.value ? Number(e.target.value) : null)}>
//                            <option value="">-- Žádný tým --</option>
//                            {meta?.teams.map(t => <option key={t.idTeam} value={t.idTeam}>{t.name}</option>)}
//                          </SelectField>
//                       </div>
//                     </div>
//                     <div className="flex gap-3 justify-end">
//                       <ActionButton onClick={() => setEditingId(null)} variant="secondary">Zrušit</ActionButton>
//                       <ActionButton onClick={submitCheckpoint}>Uložit Checkpoint</ActionButton>
//                     </div>
//                   </div>
//                 )}

//                 <div className="grid grid-cols-1 gap-3">
//                   {checkpointsList.map(cp => {
//                      const teamName = meta?.teams.find(t => t.idTeam === cp.teamId)?.name;
//                      return (
//                       <div key={cp.idLocation} className="bg-black/20 rounded-xl border border-white/5 hover:border-/30 transition-all group">
//                         <div className="p-4 flex justify-between items-center">
//                           <div>
//                             <span className="text-slate-500 font-mono mr-2">#{cp.idLocation}</span>
//                             <span className="text-white font-bold text-lg group-hover:text-pink transition-colors">{cp.name}</span>
//                             <div className="text-xs text-slate-500 mt-1 flex gap-3">
//                               <span>Typ: <span className="text-slate-300">{meta?.types.find(t => t.idQuestType === cp.typeId)?.name}</span></span>
//                               <span className="text-slate-600">|</span>
//                               {/* Aplikace barvy týmu */}
//                               <span>Vlastník: <span className={`font-bold uppercase ${getTeamColorClass(teamName)}`}>{teamName || "Všichni"}</span></span>
//                             </div>
//                           </div>
//                            <ActionButton onClick={() => editingId === cp.idLocation ? setEditingId(null) : startEditCheckpoint(cp)} variant="secondary">
//                             {editingId === cp.idLocation ? "Zavřít" : "Upravit"}
//                           </ActionButton>
//                         </div>

//                         {/* INLINE EDIT CP */}
//                         {editingId === cp.idLocation && (
//                            <div className="p-6 border-t border-white/5 bg-slate-900/50">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                               <div><label className="text-xs text-slate-500 uppercase mb-1 block">Název</label><InputField value={editForm.name} onChange={(e: any) => handleEditChange('name', e.target.value)} /></div>
//                               <div><label className="text-xs text-slate-500 uppercase mb-1 block">GPS</label><InputField value={editForm.gps} onChange={(e: any) => handleEditChange('gps', e.target.value)} /></div>
//                               <div>
//                                  <label className="text-xs text-slate-500 uppercase mb-1 block">Typ</label>
//                                  <SelectField value={editForm.typeId} onChange={(e: any) => handleEditChange('typeId', Number(e.target.value))}>
//                                    {meta?.types.map(t => <option key={t.idQuestType} value={t.idQuestType}>{t.name}</option>)}
//                                  </SelectField>
//                               </div>
//                               <div>
//                                  <label className="text-xs text-slate-500 uppercase mb-1 block">Vlastník</label>
//                                  <SelectField value={editForm.teamId || ""} onChange={(e: any) => handleEditChange('teamId', e.target.value ? Number(e.target.value) : null)}>
//                                    <option value="">-- Žádný tým --</option>
//                                    {meta?.teams.map(t => <option key={t.idTeam} value={t.idTeam}>{t.name}</option>)}
//                                  </SelectField>
//                               </div>
//                             </div>
//                             <div className="flex justify-end">
//                                <ActionButton onClick={submitCheckpoint}>Uložit změny</ActionButton>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                      );
//                   })}
//                 </div>
//               </div>
//             )}

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  adminLogin, adminLogout, getFullLogs, 
  getPlayers, savePlayer, getCheckpoints, saveCheckpoint, 
  getAdminMetadata, getPlayerStatus,
  getQuests, saveQuest 
} from "../../src/actions/admin";
import { 
  LOG_TYPE_SUCCESS, 
  LOG_TYPE_CATCH, 
  LOG_TYPE_GPS_NOT_ACCURATE,
  LOG_TYPE_TIMEOUT
} from "../../src/constants";

// // --- STYLING HELPERS ---
// const getTeamColorClass = (teamName: string | null | undefined) => {
//   const t = teamName?.toLowerCase();
//   if (t?.includes("red")) return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
//   if (t?.includes("blue")) return "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]";
//   if (t?.includes("green")) return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]";
//   if (t?.includes("yellow")) return "text-yellow-500 drop-shadow-[0_0_8px_rgba(255,252,128,0.8)]";
//   return "text-slate-400";
// };

   // --- HELPERS ---
   const getLogColor = (id: number) => {
     switch(id) {
       case LOG_TYPE_SUCCESS: return "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]";
       case LOG_TYPE_CATCH: return "text-pink font-bold drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]";
       case LOG_TYPE_GPS_NOT_ACCURATE: return "text-orange-400";
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
    className={`px-6 py-3 font-bold tracking-wider uppercase text-sm transition-all border-b-2 whitespace-nowrap ${
      active 
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
    className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border- focus:ring-1 focus:ring- transition-all placeholder-slate-600"
  />
);

const SelectField = (props: any) => (
  <select 
    {...props}
    className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border- focus:ring-1 focus:ring- transition-all cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
  />
);

export default function AdminPage() {
  // --- STATE ---
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Login
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Data & Tabs
  const [activeTab, setActiveTab] = useState<"logs" | "players" | "status" | "checkpoints" | "quests">("logs");
  
  const [logs, setLogs] = useState<any[]>([]);
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [checkpointsList, setCheckpointsList] = useState<any[]>([]);
  const [questsList, setQuestsList] = useState<any[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);
  
  const [meta, setMeta] = useState<{teams: any[], roles: any[], privileges: any[], types: any[]} | null>(null);

  // Filters
  const [logFilter, setLogFilter] = useState<number | "all">("all");
  const [statusTeamFilter, setStatusTeamFilter] = useState<string>("all");
  const [questFilter, setQuestFilter] = useState<number | "all">("all"); // NOVÉ: Filtr pro úkoly

  // Editing State
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // --- INITIAL LOAD & AUTH ---
  const loadAllData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    
    const [logsRes, metaRes, playersRes, checkRes, statusRes, questsRes] = await Promise.all([
      getFullLogs(),
      getAdminMetadata(),
      getPlayers(),
      getCheckpoints(),
      getPlayerStatus(),
      getQuests()
    ]);

    if (logsRes.success) setLogs((logsRes as any).data);
    if (metaRes.success) setMeta((metaRes as any).data);
    if (playersRes.success) setPlayersList((playersRes as any).data);
    if (checkRes.success) setCheckpointsList((checkRes as any).data);
    if (statusRes.success) setStatusList((statusRes as any).data);
    if (questsRes.success) setQuestsList((questsRes as any).data);

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

  // --- SCORE CALCULATION ---
  // const logScores = useMemo(() => {
  //   const s = { red: 0, green: 0, blue: 0 };
  //   logs.forEach(log => {
  //     if (log.logTypeId === LOG_TYPE_SUCCESS || log.logTypeId === LOG_TYPE_CATCH) {
  //       const teamName = log.playerTeam?.toLowerCase();
  //       let points = 1; 
  //       if (log.logTypeId === LOG_TYPE_SUCCESS && log.locationType === 2) points = 3; 
  //       if (teamName?.includes("red")) s.red += points;
  //       if (teamName?.includes("green")) s.green += points;
  //       if (teamName?.includes("blue")) s.blue += points;
  //     }
  //   });
  //   return s;
  // }, [logs]);

  // const realScores = useMemo(() => {
  //   const s = { red: 0, green: 0, blue: 0 };
  //   if (!playersList.length || !meta?.teams) return s;
  //   playersList.forEach(p => {
  //     const team = meta.teams.find(t => t.idTeam === p.teamId);
  //     if (team) {
  //       const tName = team.name.toLowerCase();
  //       const pts = p.points || 0;
  //       if (tName.includes("red")) s.red += pts;
  //       if (tName.includes("green")) s.green += pts;
  //       if (tName.includes("blue")) s.blue += pts;
  //     }
  //   });
  //   return s;
  // }, [playersList, meta]);

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
      gps: cp.gps
    });
  };

  const startCreateCheckpoint = () => {
    setEditingId("new");
    setEditForm({ customId: "", name: "", typeId: meta?.types?.[0]?.idQuestType || 1, teamId: null, gps: "" });
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

  // --- RENDER LOGIN ---
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
              className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded border transition-all ${
                autoRefresh 
                  ? "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse" 
                  : "bg-transparent text-slate-500 border-slate-700 hover:text-slate-300"
              }`}
            >
              {autoRefresh ? "LIVE: ON" : "LIVE: OFF"}
            </button>

            {loading && <span className="text- animate-pulse text-xs font-bold uppercase">Synchronizace...</span>}
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
                        <span className="text-orange-400 font-bold flex items-center justify-center gap-1 animate-pulse">
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
          </div>

          <div className="p-6">
            
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
                        <th className="p-4">Poslední akce</th>
                        <th className="p-4">Čas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {statusList
                        .filter(p => statusTeamFilter === "all" || p.team?.toLowerCase() === statusTeamFilter)
                        .map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white text-lg">{p.playName || p.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.name}</div>
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
                          <td className="p-4 text-slate-300 font-medium">{p.lastLogAction || "-"}</td>
                          <td className="p-4 text-slate-500 text-xs font-mono">
                            {p.lastLogTime ? new Date(p.lastLogTime).toLocaleTimeString() : "-"}
                          </td>
                        </tr>
                      ))}
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
                      <div key={cp.idLocation} className="bg-black/20 rounded-xl border border-white/5 hover:border-/30 transition-all group">
                        <div className="p-4 flex justify-between items-center">
                          <div>
                            <span className="text-slate-500 font-mono mr-2">#{cp.idLocation}</span>
                            <span className="text-white font-bold text-lg group-hover:text-pink-300 transition-colors">{cp.name}</span>
                            <div className="text-xs text-slate-500 mt-1 flex gap-3">
                              <span>Typ: <span className="text-slate-300">{meta?.types.find(t => t.idQuestType === cp.typeId)?.name}</span></span>
                              <span className="text-slate-600">|</span>
                              <span>Vlastník: <span className={`font-bold uppercase ${getTeamColorClass(teamName)}`}>{teamName || "Všichni"}</span></span>
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

          </div>
        </div>
      </div>
    </div>
  );
}