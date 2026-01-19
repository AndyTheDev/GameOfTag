"use client";

import { useState, useEffect } from "react";
import { getLocationDetails, verifyAndLogQuest, finishQuest } from "../actions/loadLocation"; 

// KONSTANTY (Musí sedět se serverem)
const QUEST_LIMIT_SECONDS = 360; // 6 minut
const LOCKOUT_SECONDS = 300;     // 5 minut

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
  const [targetTime, setTargetTime] = useState<number | null>(null);
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
    if ((status !== "active" && status !== "locked") || !targetTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const diffSeconds = Math.ceil((targetTime - now) / 1000);

      if (diffSeconds <= 0) {
          clearInterval(timer);
          setTimeLeft(0);
          handleTimeExpired(); 
      } else {
          setTimeLeft(diffSeconds);
      }
    }, 1000);

    // Okamžitý render
    const initialDiff = Math.ceil((targetTime - Date.now()) / 1000);
    setTimeLeft(initialDiff > 0 ? initialDiff : 0);

    return () => clearInterval(timer);
  }, [status, targetTime]);

  // Logika při vypršení času
  async function handleTimeExpired() {
     // A) Vypršel AKTIVNÍ úkol -> Přechod do FREEZE (LOCKED)
     if (status === "active" && locationId) {
         
         // DŮLEŽITÁ ZMĚNA: Trest začíná TEĎ, protože právě teď to vypršelo v prohlížeči.
         // Nemůžeme spoléhat na 'targetTime', protože ten mohl být v minulosti (kvůli chybě).
         const now = Date.now();
         const newLockoutTarget = now + (LOCKOUT_SECONDS * 1000);
         
         setStatus("locked");
         setMessage("Čas na úkol vypršel! Lokace je uzamčena na 5 minut.");
         setTargetTime(newLockoutTarget); 

         // Zapíšeme na server
         await finishQuest(locationId, password, 'timeout');
     } 
     
     // B) Vypršel TREST (LOCKED) -> Přechod do READY
     else if (status === "locked") {
         setStatus("ready");
         setMessage("Můžeš hrát znovu.");
         setPassword(""); 
         setTargetTime(null);
     }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) return;
    setStatus("loading");
    setMessage("");
    
    const result = await verifyAndLogQuest(locationId, password);

    if (result.success && result.status === "active" && result.startTime) {
      setQuestData({
        playerName: result.playerName!,
        title: result.questName!,
        description: result.questDescription!,
      });

      // Cíl = Čas startu z DB (už normalizovaný na serveru) + 6 minut
      const startTimeMs = new Date(result.startTime).getTime();
      const endTimestamp = startTimeMs + (QUEST_LIMIT_SECONDS * 1000);
      
      setTargetTime(endTimestamp);
      setStatus("active");
    } 
    else if (result.status === "locked" && result.startTime) {
        // Cíl = Čas kdy trest začal (normalizovaný) + 5 minut
        const lockStartMs = new Date(result.startTime).getTime();
        setTargetTime(lockStartMs + (LOCKOUT_SECONDS * 1000));

        setStatus("locked");
    } 
    else if (result.status === "completed") {
        setStatus("completed");
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
          setTargetTime(null);
      } else {
          setMessage("Chyba při ukládání splnění.");
          setStatus("active");
      }
  }

  const formatTime = (sec: number) => {
      const safeSec = Math.max(0, sec);
      const m = Math.floor(safeSec / 60);
      const s = safeSec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (status === "initializing") return <div className="text-white animate-pulse">Načítám...</div>;
  if (status === "error") return <div className="bg-red-900 text-white p-4">{message}</div>;

  return (
    <div className="w-full max-w-md p-8 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800">
      
      <div className="text-center mb-6">
        
          <p className="text-slate-400 text-sm uppercase">Lokace: {locationName}{locationId}</p>
          <h2 className="text-2xl font-bold text-[#00D68F]">Vítej {questData ? ` ${questData.playerName}` : 'na checkpointu'}!
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
          <h2>Přihlášený hráč: {questData.playerName}</h2>
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
              <p className="font-bold text-red-400">Máš aktivní trest.</p>
              <p className="text-sm mt-2">Jsi "zmražen na místě" a musíš zde zůstat, dokud nevyprší časomíra a poté se můžeš pokusit tento checkpoint znovu splnit.</p>
          </div>
      )}

      {status === "completed" && (
          <div className="text-center py-10 animate-in zoom-in">
              <h3 className="text-3xl font-bold text-[#00D68F] mb-4">Checkpoint {locationName}{locationId} splněn!</h3>
              <p className="text-slate-300">Tento checkpoint máš úspěšně za sebou. Tvé kredity na dopravu jsou obnoveny a máš tak 3 kredity k použití!</p>
          </div>
      )}

    </div>
  );
}