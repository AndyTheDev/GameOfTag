// "use client";

// import { useState, useEffect } from "react";
// import { adminLogin, getFullLogs } from "../../src/actions/admin";

// type LogItem = {
//   id: number;
//   time: string;
//   playerName: string | null;
//   locationName: string | null;
//   locationId: number | null;
//   action: string | null;
//   questName: string | null;
//   logTypeId: number;
// };

// export default function AdminPage() {
//   const [isAuth, setIsAuth] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [name, setName] = useState("");
//   const [pass, setPass] = useState("");
//   const [error, setError] = useState("");
//   const [logs, setLogs] = useState<LogItem[]>([]);

//   async function handleLogin(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     const res = await adminLogin(name, pass);
//     if (res.success) {
//       setIsAuth(true);
//       fetchData();
//     } else {
//       setError(res.message || "Chyba");
//     }
//     setLoading(false);
//   }

//   async function fetchData() {
//     setLoading(true);
//     const res = await getFullLogs();
//     if (res.success) {
//       setLogs(res.data);
//     }
//     setLoading(false);
//   }

//   // Formátování času (Oprava časové zóny)
//   const formatDate = (dbString: string) => {
//     if (!dbString) return "-";
//     const timeString = dbString.endsWith("Z") ? dbString : dbString + "Z";
//     const date = new Date(timeString);
    
//     // Vrátí např. "10. 12. 19:03:49"
//     return date.toLocaleString('cs-CZ', {
//       day: '2-digit', month: '2-digit', 
//       hour: '2-digit', minute: '2-digit', second: '2-digit'
//     });
//   };

//   // Barvičky pro typy logů
//   const getActionColor = (typeId: number) => {
//     switch(typeId) {
//       case 1: return "text-blue-400"; // Spuštění
//       case 2: return "text-red-400"; // Neúspěšný quest
//       case 3: return "text-green-400";   // Úspěšně splněný quest
//       default: return "text-gray-400";
//     }
//   };

//   // --- 1. PŘIHLAŠOVACÍ OBRAZOVKA ---
//   if (!isAuth) {
//     return (
//       <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
//         <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-sm">
//           <h1 className="text-2xl font-bold text-[#00D68F] mb-6 text-center">Admin</h1>
//           <form onSubmit={handleLogin} className="flex flex-col gap-4">
//             <input 
//               className="bg-slate-950 border border-slate-700 text-white p-3 rounded"
//               placeholder="Jméno"
//               value={name} onChange={e => setName(e.target.value)}
//             />
//             <input 
//               className="bg-slate-950 border border-slate-700 text-white p-3 rounded"
//               type="password"
//               placeholder="PIN"
//               value={pass} onChange={e => setPass(e.target.value)}
//             />
//             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
//             <button 
//               type="submit" 
//               disabled={loading}
//               className="bg-[#00D68F] text-slate-900 font-bold p-3 rounded hover:bg-[#00b87a] transition"
//             >
//               {loading ? "Ověřuji..." : "Vstoupit"}
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   // --- 2. PŘEHLED LOGŮ (DASHBOARD) ---
//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-200 p-2 md:p-8 font-mono text-sm">
//       <div className="max-w-7xl mx-auto">
        
//         {/* Hlavička */}
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold text-[#00D68F]">LOGY HRY</h1>
//           <div className="flex gap-4">
//              <button 
//                onClick={fetchData} 
//                className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 border border-slate-600"
//              >
//                {loading ? "Načítám..." : "Aktualizovat"}
//              </button>
//              <button 
//                onClick={() => setIsAuth(false)} 
//                className="px-4 py-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 border border-red-900"
//              >
//                Odhlásit
//              </button>
//           </div>
//         </div>

//         {/* Tabulka */}
//         <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
//                 <th className="p-4">ID</th>
//                 <th className="p-4">Čas</th>
//                 <th className="p-4">Hráč</th>
//                 <th className="p-4">Akce</th>
//                 <th className="p-4">Lokace</th>
//                 <th className="p-4">Úkol</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-800">
//               {logs.map((log) => (
//                 <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
//                   <td className="p-4 text-slate-500">#{log.id}</td>
//                   <td className="p-4 text-slate-300 font-medium">
//                     {formatDate(log.time)}
//                   </td>
//                   <td className="p-4 font-bold text-white">
//                     {log.playerName || "Neznámý"}
//                   </td>
//                   <td className={`p-4 font-bold ${getActionColor(log.logTypeId)}`}>
//                     {log.action || `Typ ${log.logTypeId}`}
//                   </td>
//                   <td className="p-4">
//                     {log.locationName} <span className="text-slate-500 text-xs">({log.locationId})</span>
//                   </td>
                  
//                   <td className="p-4 text-slate-400 italic">
//                     {log.questName || "-"}
//                   </td>
//                 </tr>
//               ))}
              
//               {logs.length === 0 && !loading && (
//                 <tr>
//                   <td colSpan={6} className="p-8 text-center text-slate-500">
//                     Žádné záznamy v logu.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useMemo } from "react";
import { adminLogin, getFullLogs } from "../../src/actions/admin";

// Rozšířený typ o nové sloupce
type LogItem = {
  id: number;
  time: string;
  playerName: string | null;
  playerTeam: string | null; // NOVÉ
  locationName: string | null;
  locationId: number | null;
  locationType: string | null; // NOVÉ
  action: string | null;
  questName: string | null;
  logTypeId: number;
};

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<LogItem[]>([]);

  // --- LOGIN LOGIKA ---
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await adminLogin(name, pass);
    if (res.success) {
      setIsAuth(true);
      fetchData();
    } else {
      setError(res.message || "Chyba");
    }
    setLoading(false);
  }

  // --- NAČTENÍ DAT ---
  async function fetchData() {
    setLoading(true);
    const res = await getFullLogs();
    if (res.success) {
      // TypeScriptu musíme říct, že data odpovídají našemu rozšířenému typu
      setLogs(res.data as unknown as LogItem[]);
    }
    setLoading(false);
  }

  // --- VÝPOČET SKÓRE ---
  // Používáme useMemo, aby se to nepřepočítávalo zbytečně
  const scores = useMemo(() => {
    const newScores = { red: 0, green: 0, blue: 0 };

    logs.forEach((log) => {
      // 1. Musí to být úspěšně splněný úkol (ID 3 = LOG_TYPE_SUCCESS)
      //    nebo kontrola podle stringu log.action === "quest_accomplished"
      if (log.logTypeId === 3) {
        
        // 2. Zjistíme tým (převedeme na lowercase pro jistotu)
        const team = log.playerTeam?.toLowerCase();
        
        // 3. Zjistíme body podle typu lokace
        let points = 0;
        if (log.locationType === "quest") points = 1;
        else if (log.locationType === "finish") points = 3;

        // 4. Přičteme body, pokud tým existuje v našem počítadle
        if (team && (team === "red" || team === "green" || team === "blue")) {
           newScores[team] += points;
        }
      }
    });

    return newScores;
  }, [logs]);

  // --- POMOCNÉ FUNKCE ---
  const formatDate = (dbString: string) => {
    if (!dbString) return "-";
    const timeString = dbString.endsWith("Z") ? dbString : dbString + "Z";
    const date = new Date(timeString);
    return date.toLocaleString('cs-CZ', {
      day: '2-digit', month: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getActionColor = (typeId: number) => {
    switch(typeId) {
      case 1: return "text-blue-400";
      case 2: return "text-red-400";
      case 3: return "text-green-400";
      default: return "text-gray-400";
    }
  };

  // Helper pro barvu týmu v tabulce
  const getTeamColorClass = (team: string | null) => {
    const t = team?.toLowerCase();
    if (t === "red") return "text-red-500 font-bold uppercase";
    if (t === "blue") return "text-blue-500 font-bold uppercase";
    if (t === "green") return "text-green-500 font-bold uppercase";
    return "text-gray-500";
  }

  // --- 1. LOGIN SCREEN ---
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-sm">
          <h1 className="text-2xl font-bold text-[#00D68F] mb-6 text-center">Admin</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              className="bg-slate-950 border border-slate-700 text-white p-3 rounded"
              placeholder="Jméno"
              value={name} onChange={e => setName(e.target.value)}
            />
            <input 
              className="bg-slate-950 border border-slate-700 text-white p-3 rounded"
              type="password"
              placeholder="PIN"
              value={pass} onChange={e => setPass(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit" disabled={loading}
              className="bg-[#00D68F] text-slate-900 font-bold p-3 rounded hover:bg-[#00b87a] transition"
            >
              {loading ? "Ověřuji..." : "Vstoupit"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 2. DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-2 md:p-8 font-mono text-sm">
      <div className="max-w-7xl mx-auto">
        
        {/* Hlavička */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-[#00D68F]">LOGY HRY</h1>
          <div className="flex gap-4">
             <button onClick={fetchData} className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 border border-slate-600">
               {loading ? "Načítám..." : "Aktualizovat"}
             </button>
             <button onClick={() => setIsAuth(false)} className="px-4 py-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 border border-red-900">
               Odhlásit
             </button>
          </div>
        </div>

        {/* SKÓRE KARTY (NOVÉ) */}
        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900 border border-red-900/50 p-4 rounded-xl text-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs mb-1">RED TEAM</h3>
                <p className="text-4xl font-bold text-white">{scores.red}</p>
            </div>
            <div className="bg-slate-900 border border-blue-900/50 p-4 rounded-xl text-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <h3 className="text-blue-500 font-bold uppercase tracking-widest text-xs mb-1">BLUE TEAM</h3>
                <p className="text-4xl font-bold text-white">{scores.blue}</p>
            </div>
            <div className="bg-slate-900 border border-green-900/50 p-4 rounded-xl text-center shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <h3 className="text-green-500 font-bold uppercase tracking-widest text-xs mb-1">GREEN TEAM</h3>
                <p className="text-4xl font-bold text-white">{scores.green}</p>
            </div>
        </div>

        {/* Tabulka */}
        <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                <th className="p-4">ID</th>
                <th className="p-4">Čas</th>
                <th className="p-4">Hráč</th>
                <th className="p-4">Tým</th> 
                <th className="p-4">Akce</th>
                <th className="p-4">Lokace</th>
                <th className="p-4">Úkol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-slate-500">#{log.id}</td>
                  <td className="p-4 text-slate-300 font-medium whitespace-nowrap">
                    {formatDate(log.time)}
                  </td>
                  <td className="p-4 font-bold text-white">
                    {log.playerName || "Neznámý"}
                  </td>
                  {/* NOVÝ SLOUPEC TÝM */}
                  <td className={`p-4 ${getTeamColorClass(log.playerTeam)}`}>
                    {log.playerTeam || "-"}
                  </td>
                  
                  <td className={`p-4 font-bold ${getActionColor(log.logTypeId)}`}>
                    {log.action || `Typ ${log.logTypeId}`}
                  </td>
                  <td className="p-4">
                    {log.locationName} <span className="text-slate-500 text-xs">({log.locationId})</span>
                    {/* Debug info pro admina - typ lokace */}
                    <span className="ml-2 text-[10px] px-1 py-0.5 bg-slate-800 rounded text-slate-500">{log.locationType}</span>
                  </td>
                  
                  <td className="p-4 text-slate-400 italic">
                    {log.questName || "-"}
                  </td>
                </tr>
              ))}
              
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Žádné záznamy v logu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}