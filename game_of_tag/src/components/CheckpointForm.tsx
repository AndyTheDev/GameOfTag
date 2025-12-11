/* "use client";

import { useState, useEffect } from "react";
import { getLocationDetails, verifyAndLogQuest } from "../actions/loadLocation"; 

type Props = {
  initialCode: string;
};

type QuestData = {
  playerName: string;
  title: string;
  description: string;
};

export default function CheckpointForm({ initialCode }: Props) {
  // Stavy aplikace
  const [status, setStatus] = useState<"initializing" | "ready" | "loading" | "success" | "error">("initializing");
  
  const [password, setPassword] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationId, setLocationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [questData, setQuestData] = useState<QuestData | null>(null);

  // 1. EFEKT: Po načtení stránky automaticky zjistíme název lokace
  useEffect(() => {
    async function init() {
      const result = await getLocationDetails(initialCode);
      if (result.success) {
        setLocationName(result.name!);
        setLocationId(result.id!);
        setStatus("ready"); // Přepneme na zadávání hesla
      } else {
        setMessage(result.message || "Chyba načítání lokace");
        setStatus("error");
      }
    }
    init();
  }, [initialCode]);

  // 2. FUNKCE: Odeslání hesla
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) return;

    setStatus("loading");
    
    const result = await verifyAndLogQuest(locationId, password);

    if (result.success) {
      setQuestData({
        playerName: result.playerName!,
        title: result.questName!,
        description: result.questDescription!
      });
      setStatus("success");
      setMessage("");
    } else {
      setMessage(result.message || "Chyba ověření.");
      setStatus("ready"); // Vrátíme formulář pro další pokus
    }
  }

  // --- VYKRESLOVÁNÍ ---

  // Stav 1: Načítání nebo Chyba lokace
  if (status === "initializing") return <div className="text-white animate-pulse">Načítám lokaci...</div>;
  if (status === "error") return <div className="bg-red-900/50 p-4 rounded text-red-200 border border-red-500">{message}</div>;

  return (
    <div className="w-full max-w-md p-8 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 transition-all">
      
      {status !== "success" && (
        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm uppercase tracking-widest">Jsi na lokaci</p>
          <h2 className="text-2xl font-bold text-[#00D68F] mt-1">{locationName}{locationId}</h2>
        </div>
      )}

      {message && status !== 'success' && (
        <div className="mb-6 p-3 rounded-xl text-center font-medium bg-red-900/30 text-red-400 border border-red-500/50">
          {message}
        </div>
      )}

      {(status === "ready" || status === "loading") && (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
          <div>
             <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Tvé herní heslo</label>
            <input
              type="text" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              className="w-full p-4 bg-slate-950 text-white rounded-xl border border-slate-800 focus:border-[#00D68F] focus:ring-1 focus:ring-[#00D68F] outline-none transition-all placeholder-slate-600 text-lg text-center tracking-widest"
              autoFocus
              disabled={status === "loading"}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#00D68F] hover:bg-[#00b87a] text-slate-900 font-bold py-4 rounded-full transition-transform transform active:scale-95 shadow-[0_0_15px_rgba(0,214,143,0.3)] disabled:opacity-50"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Ověřuji..." : "Potvrdit"}
          </button>
        </form>
      )}

      {status === "success" && questData && (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Hráč: {questData.playerName}</h2>
            <p className="text-slate-400">Tvůj úkol pro tuto lokaci:</p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-[#00D68F]/30 shadow-[0_0_20px_rgba(0,214,143,0.1)]">
            <h3 className="text-[#00D68F] font-bold text-lg uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">
              {questData.title}
            </h3>
            <p className="text-slate-200 leading-relaxed text-lg">
              {questData.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} */



/* "use client";

import { useState, useEffect } from "react";
import { getLocationDetails, verifyAndLogQuest, finishQuest } from "../actions/loadLocation"; 

type Props = { initialCode: string; };

type QuestData = {
  playerName: string;
  title: string;
  description: string;
  questId?: number; // volitelné
};

export default function CheckpointForm({ initialCode }: Props) {
  // Stavy
  const [status, setStatus] = useState<"initializing" | "ready" | "loading" | "active" | "completed" | "locked" | "error">("initializing");
  
  const [password, setPassword] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationId, setLocationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  
  const [questData, setQuestData] = useState<QuestData | null>(null);
  
  // Časomíra
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // 1. Init lokace
  useEffect(() => {
    async function init() {
      const result = await getLocationDetails(initialCode);
      if (result.success) {
        setLocationName(result.name!);
        setLocationId(result.id!);
        setStatus("ready");
      } else {
        setMessage(result.message || "Chyba načítání lokace");
        setStatus("error");
      }
    }
    init();
  }, [initialCode]);

  // 2. Časovač (běží pouze když je status "active" nebo "locked")
  useEffect(() => {
    if ((status !== "active" && status !== "locked") || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
            // Čas vypršel!
            clearInterval(timer);
            handleTimeExpired(); 
            return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Funkce: Co se stane, když čas dojde
  async function handleTimeExpired() {
     if (status === "active" && locationId) {
         // Pokud běžel úkol a došel čas -> voláme server pro Timeout
         await finishQuest(locationId, password, 'timeout');
         setStatus("locked");
         setTimeLeft(300); // Nastavíme 5 minut zámek lokálně (server to jistí)
         setMessage("Čas vypršel! Lokace je uzamčena.");
     } else if (status === "locked") {
         // Pokud běžel zámek a došel čas -> odemkneme
         setStatus("ready");
         setMessage("Zámek vypršel. Můžeš to zkusit znovu.");
         setPassword(""); // Vyčistit heslo pro nové přihlášení
     }
  }

  // 3. Odeslání hesla (Start/Resume)
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) return;
    setStatus("loading");
    
    const result = await verifyAndLogQuest(locationId, password);

    if (result.success && result.status === "active") {
      setQuestData({
        playerName: result.playerName!,
        title: result.questName!,
        description: result.questDescription!,
      });
      setTimeLeft(result.remainingTime || 300); // Nastavíme čas ze serveru
      setStatus("active");
      setMessage("");
    } else if (result.status === "completed") {
        setStatus("completed");
        setMessage(result.message || "Hotovo.");
    } else if (result.status === "locked") {
        setStatus("locked");
        setTimeLeft(result.remainingTime || 300);
        setMessage(result.message || "Jsi uzamčen.");
    } else {
      setMessage(result.message || "Chyba ověření.");
      setStatus("ready");
    }
  }

  // 4. Splnění úkolu (tlačítko)
  async function handleCompleteTask() {
      if (!locationId) return;
      setStatus("loading");
      const res = await finishQuest(locationId, password, 'success');
      if (res.success) {
          setStatus("completed");
      } else {
          setMessage("Chyba při ukládání splnění.");
          setStatus("active"); // Vrátíme zpět, pokud selhalo
      }
  }

  // Formátování času MM:SS
  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER ---
  if (status === "initializing") return <div className="text-white animate-pulse">Načítám...</div>;
  if (status === "error") return <div className="bg-red-900 text-white p-4">{message}</div>;

  return (
    <div className="w-full max-w-md p-8 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800">
      
      
      <div className="text-center mb-6">
          <p className="text-slate-400 text-sm uppercase">Lokace</p>
          <h2 className="text-2xl font-bold text-[#00D68F]">{locationName}</h2>
          
          {(status === "active" || status === "locked") && (
              <div className={`text-4xl font-mono mt-4 font-bold ${status === 'locked' ? 'text-red-500' : 'text-white'}`}>
                  {formatTime(timeLeft)}
              </div>
          )}
      </div>

      {message && (
         <div className={`mb-6 p-3 rounded text-center ${status === 'locked' ? 'bg-red-900/50 text-red-200' : 'bg-blue-900/30 text-blue-200'}`}>
            {message}
         </div>
      )}

      
      {(status === "ready" || status === "loading") && (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
           <input
             type="text" value={password} onChange={(e) => setPassword(e.target.value)}
             placeholder="Tvé heslo"
             className="w-full p-4 bg-slate-950 text-white rounded-xl border border-slate-800 text-center text-lg"
             disabled={status === "loading"}
           />
           <button type="submit" disabled={status === "loading"} className="w-full bg-[#00D68F] py-4 rounded-full font-bold text-slate-900 hover:bg-[#00b87a] disabled:opacity-50">
             {status === "loading" ? "Ověřuji..." : "Vstoupit"}
           </button>
        </form>
      )}

      
      {status === "active" && questData && (
        <div className="flex flex-col gap-6 animate-in fade-in">
           <div className="bg-slate-950 p-6 rounded-2xl border border-[#00D68F]/30">
              <h3 className="text-[#00D68F] font-bold text-lg mb-2">{questData.title}</h3>
              <p className="text-slate-200 text-lg">{questData.description}</p>
           </div>
           
           <button 
             onClick={handleCompleteTask}
             className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(0,255,0,0.3)] transition-all transform active:scale-95"
           >
             ÚKOL SPLNĚN!
           </button>
        </div>
      )}

      
      {status === "locked" && (
          <div className="text-center text-slate-400">
              <p>Máš dočasný zákaz plnění úkolů.</p>
              <p className="text-sm mt-2">Počkej, až odpočet skončí.</p>
          </div>
      )}

      
      {status === "completed" && (
          <div className="text-center py-10">
              <h3 className="text-3xl font-bold text-[#00D68F] mb-4">Splněno!</h3>
              <p className="text-slate-300">Tento checkpoint máš úspěšně za sebou.</p>
          </div>
      )}

    </div>
  );
} */

/*  "use client";

import { useState, useEffect } from "react";
import { getLocationDetails, verifyAndLogQuest, finishQuest } from "../actions/loadLocation"; 

type Props = { initialCode: string; };

type QuestData = {
  playerName: string;
  title: string;
  description: string;
  questId?: number; 
};

export default function CheckpointForm({ initialCode }: Props) {
  const [status, setStatus] = useState<"initializing" | "ready" | "loading" | "active" | "completed" | "locked" | "error">("initializing");
  
  const [password, setPassword] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationId, setLocationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [questData, setQuestData] = useState<QuestData | null>(null);
  
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // 1. Init
  useEffect(() => {
    async function init() {
      const result = await getLocationDetails(initialCode);
      if (result.success) {
        setLocationName(result.name!);
        setLocationId(result.id!);
        setStatus("ready");
      } else {
        setMessage(result.message || "Chyba načítání lokace");
        setStatus("error");
      }
    }
    init();
  }, [initialCode]);

  // 2. Časovač - spouští se, když je aktivní nebo zamčeno a čas > 0
  useEffect(() => {
    // Pokud nejsme v časovém režimu, nic neděláme
    if (status !== "active" && status !== "locked") return;

    // Pokud čas dojde
    if (timeLeft <= 0) {
        // Trik: Abychom nespustili "timeout" hned při načtení, pokud je 0, 
        // musíme se ujistit, že to není jen inicializační nula.
        // Ale v handlePasswordSubmit nastavujeme čas, takže to by mělo být ok.
        return; 
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
            clearInterval(timer);
            handleTimeExpired(); 
            return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft]); // Závislost na timeLeft zajišťuje aktualizaci

  async function handleTimeExpired() {
     if (status === "active" && locationId) {
         await finishQuest(locationId, password, 'timeout');
         setStatus("locked");
         setTimeLeft(300); 
         setMessage("Čas vypršel! Lokace je uzamčena.");
     } else if (status === "locked") {
         setStatus("ready");
         setMessage("Zámek vypršel. Můžeš to zkusit znovu.");
         setPassword(""); 
     }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) return;
    setStatus("loading");
    setMessage(""); // Vyčistit staré hlášky
    
    const result = await verifyAndLogQuest(locationId, password);

    if (result.success && result.status === "active") {
      // RESUME nebo START
      setQuestData({
        playerName: result.playerName!,
        title: result.questName!,
        description: result.questDescription!,
      });
      // Důležité: Nastavíme čas, který přišel ze serveru
      setTimeLeft(result.remainingTime || 300); 
      setStatus("active");
    } 
    else if (result.status === "completed") {
        setStatus("completed");
        setMessage(result.message || "Hotovo.");
    } 
    else if (result.status === "locked") {
        setStatus("locked");
        setTimeLeft(result.remainingTime || 300);
        setMessage(result.message || "Jsi uzamčen.");
    } 
    else {
      // Error (např. máš úkol jinde)
      setMessage(result.message || "Chyba ověření.");
      setStatus("ready");
    }
  }

  async function handleCompleteTask() {
      if (!locationId) return;
      setStatus("loading");
      const res = await finishQuest(locationId, password, 'success');
      if (res.success) {
          setStatus("completed");
      } else {
          setMessage("Chyba při ukládání splnění.");
          setStatus("active");
      }
  }

  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER ---
  if (status === "initializing") return <div className="text-white animate-pulse">Načítám...</div>;
  if (status === "error") return <div className="bg-red-900 text-white p-4">{message}</div>;

  return (
    <div className="w-full max-w-md p-8 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800">
      
      
      <div className="text-center mb-6">
          <p className="text-slate-400 text-sm uppercase">Lokace</p>
          <h2 className="text-2xl font-bold text-[#00D68F]">{locationName}</h2>
          
          {(status === "active" || status === "locked") && (
              <div className={`text-4xl font-mono mt-4 font-bold ${status === 'locked' ? 'text-red-500' : 'text-white'}`}>
                  {formatTime(timeLeft)}
              </div>
          )}
      </div>

      {message && (
         <div className={`mb-6 p-3 rounded text-center border ${
             status === 'locked' || !status.includes('success') ? 'bg-red-900/30 text-red-200 border-red-500/30' : 'bg-green-900/30 text-green-200 border-green-500/30'
         }`}>
            {message}
         </div>
      )}

      
      {(status === "ready" || status === "loading") && (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
           <input
             type="text" value={password} onChange={(e) => setPassword(e.target.value)}
             placeholder="Tvé heslo"
             className="w-full p-4 bg-slate-950 text-white rounded-xl border border-slate-800 text-center text-lg focus:border-[#00D68F] outline-none"
             disabled={status === "loading"}
           />
           <button type="submit" disabled={status === "loading"} className="w-full bg-[#00D68F] py-4 rounded-full font-bold text-slate-900 hover:bg-[#00b87a] disabled:opacity-50 transition-all">
             {status === "loading" ? "Ověřuji..." : "Vstoupit"}
           </button>
        </form>
      )}

      
      {status === "active" && questData && (
        <div className="flex flex-col gap-6 animate-in fade-in">
           <div className="bg-slate-950 p-6 rounded-2xl border border-[#00D68F]/30 shadow-[0_0_15px_rgba(0,214,143,0.1)]">
              <h3 className="text-[#00D68F] font-bold text-lg mb-2 border-b border-slate-800 pb-2">{questData.title}</h3>
              <p className="text-slate-200 text-lg">{questData.description}</p>
           </div>
           
           <button 
             onClick={handleCompleteTask}
             className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all"
           >
             ÚKOL SPLNĚN!
           </button>
        </div>
      )}

      
      {status === "locked" && (
          <div className="text-center text-slate-400 bg-slate-950/50 p-4 rounded-xl">
              <p className="font-bold text-red-400">DOČASNÝ ZÁMEK</p>
              <p className="text-sm mt-2">Máš dočasný zákaz plnění úkolů z důvodu vypršení času.</p>
          </div>
      )}

      
      {status === "completed" && (
          <div className="text-center py-10 animate-in zoom-in">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-3xl font-bold text-[#00D68F] mb-4">Splněno!</h3>
              <p className="text-slate-300">Tento checkpoint máš úspěšně za sebou.</p>
              <p className="text-slate-500 text-sm mt-4">Pokračuj na další stanoviště.</p>
          </div>
      )}

    </div>
  );
} */

"use client";

import { useState, useEffect } from "react";
import { getLocationDetails, verifyAndLogQuest, finishQuest } from "../actions/loadLocation"; 

type Props = { initialCode: string; };

type QuestData = {
  playerName: string;
  title: string;
  description: string;
  questId?: number; 
};

export default function CheckpointForm({ initialCode }: Props) {
  const [status, setStatus] = useState<"initializing" | "ready" | "loading" | "active" | "completed" | "locked" | "error">("initializing");
  
  const [password, setPassword] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationId, setLocationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [questData, setQuestData] = useState<QuestData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // 1. Init
  useEffect(() => {
    async function init() {
      const result = await getLocationDetails(initialCode);
      if (result.success) {
        setLocationName(result.name!);
        setLocationId(result.id!);
        setStatus("ready");
      } else {
        setMessage(result.message || "Chyba načítání lokace");
        setStatus("error");
      }
    }
    init();
  }, [initialCode]);

  // 2. Časovač
  useEffect(() => {
    if ((status !== "active" && status !== "locked") || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
            clearInterval(timer);
            handleTimeExpired(); 
            return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft]);

  async function handleTimeExpired() {
     // Pokud vypršel aktivní úkol
     if (status === "active" && locationId) {
         await finishQuest(locationId, password, 'timeout');
         setStatus("locked");
         setTimeLeft(300); 
         setMessage("Čas na úkol vypršel! Lokace je uzamčena na 5 minut.");
     } 
     // Pokud vypršel trest (zámek)
     else if (status === "locked") {
         setStatus("ready");
         setMessage("Můžeš hrát znovu.");
         setPassword(""); 
     }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) return;
    setStatus("loading");
    setMessage("");
    
    const result = await verifyAndLogQuest(locationId, password);

    if (result.success && result.status === "active") {
      setQuestData({
        playerName: result.playerName!,
        title: result.questName!,
        description: result.questDescription!,
      });
      // Zde se nastaví aktualizovaný čas (např. 120s místo 300s)
      setTimeLeft(result.remainingTime || 300); 
      setStatus("active");
    } 
    else if (result.status === "locked") {
        setStatus("locked");
        setTimeLeft(result.remainingTime || 300);
        setMessage(result.message || "Freeze!.");
    } 
    else if (result.status === "completed") {
        setStatus("completed");
        setMessage(result.message || "Hotovo.");
    } 
    else {
      setMessage(result.message || "Chyba ověření.");
      setStatus("ready");
    }
  }

  async function handleCompleteTask() {
      if (!locationId) return;
      setStatus("loading");
      const res = await finishQuest(locationId, password, 'success');
      if (res.success) {
          setStatus("completed");
      } else {
          setMessage("Chyba při ukládání splnění.");
          setStatus("active");
      }
  }

  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (status === "initializing") return <div className="text-white animate-pulse">Načítám...</div>;
  if (status === "error") return <div className="bg-red-900 text-white p-4">{message}</div>;

  return (
    <div className="w-full max-w-md p-8 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800">
      
      <div className="text-center mb-6">
          <p className="text-slate-400 text-sm uppercase">Lokace</p>
          <h2 className="text-2xl font-bold text-[#00D68F]">{locationName}{locationId}
          </h2>
          {(status === "active" || status === "locked") && (
              <div className={`text-4xl font-mono mt-4 font-bold ${status === 'locked' ? 'text-red-500' : 'text-white'}`}>
                  {formatTime(timeLeft)}
              </div>
          )}
      </div>

      {message && (
         <div className={`mb-6 p-3 rounded text-center border ${
             status === 'locked' || !status.includes('success') ? 'bg-red-900/30 text-red-200 border-red-500/30' : 'bg-green-900/30 text-green-200 border-green-500/30'
         }`}>
            {message}
         </div>
      )}

      {(status === "ready" || status === "loading") && (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
           <input
             type="text" value={password} onChange={(e) => setPassword(e.target.value)}
             placeholder="Tvé heslo"
             className="w-full p-4 bg-slate-950 text-white rounded-xl border border-slate-800 text-center text-lg focus:border-[#00D68F] outline-none"
             disabled={status === "loading"}
           />
           <button type="submit" disabled={status === "loading"} className="w-full bg-[#00D68F] py-4 rounded-full font-bold text-slate-900 hover:bg-[#00b87a] disabled:opacity-50 transition-all">
             {status === "loading" ? "Ověřuji..." : "Vstoupit"}
           </button>
        </form>
      )}

      {status === "active" && questData && (
        <div className="flex flex-col gap-6 animate-in fade-in">
           <div className="bg-slate-950 p-6 rounded-2xl border border-[#00D68F]/30 shadow-[0_0_15px_rgba(0,214,143,0.1)]">
              <h3 className="text-[#00D68F] font-bold text-lg mb-2 border-b border-slate-800 pb-2">{questData.title}</h3>
              <p className="text-slate-200 text-lg">{questData.description}</p>
           </div>
           
           <button 
             onClick={handleCompleteTask}
             className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all"
           >
             ÚKOL SPLNĚN!
           </button>
        </div>
      )}

      {status === "locked" && (
          <div className="text-center text-slate-400 bg-slate-950/50 p-4 rounded-xl">
              <p className="font-bold text-red-400">Freeze!</p>
              <p className="text-sm mt-2">Jsi zmražen na místě a musíš zde zůstat. Po vypršení času se může š pokusit tento checkpoint znovu splnit.</p>
          </div>
      )}

      {status === "completed" && (
          <div className="text-center py-10 animate-in zoom-in">
              <h3 className="text-3xl font-bold text-[#00D68F] mb-4">Splněno!</h3>
              <p className="text-slate-300">Tento checkpoint máš úspěšně za sebou. Tvé kredity na dopravu jsou obnoveny a máš tak 3 krediyt k použití!</p>
          </div>
      )}

    </div>
  );
}