"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getLocationDetails, verifyAndLogQuest, finishQuest } from "../actions/loadLocation"; 
import { QUEST_LIMIT_SECONDS, LOCKOUT_SECONDS } from "../constants";

// Přidali jsme savedPassword
type Props = { 
    initialCode: string; 
    savedPassword?: string; 
};

type QuestData = {
  playerName: string;
  teamName: string;
  title: string;
  description: string;
};

export default function CheckpointForm({ initialCode, savedPassword }: Props) {
  // Pokud máme uložené heslo, začneme rovnou v loading stavu, jinak ready
  const [status, setStatus] = useState<"initializing" | "ready" | "loading" | "active" | "completed" | "locked" | "error">("initializing");
  
  const [password, setPassword] = useState(savedPassword || "");
  const [locationName, setLocationName] = useState("");
  const [locationId, setLocationId] = useState<number | null>(null);
  
  const [message, setMessage] = useState("");
  const [messageVariant, setMessageVariant] = useState<"error" | "info">("info");
  
  const [questData, setQuestData] = useState<QuestData | null>(null);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  // Ref, abychom zamezili dvojímu volání při mountu
  const hasAutoLoaded = useRef(false);

  // 1. Init Lokace + Auto Login
  useEffect(() => {
    async function init() {
      // A) Načteme detaily lokace (Název + ID)
      const locResult = await getLocationDetails(initialCode);
      
      let currentLocId: number | null = null;

      if (locResult.success && locResult.id) {
        setLocationName(locResult.name || "");
        setLocationId(locResult.id);
        currentLocId = locResult.id;
      } else {
        setMessage("Chyba načítání lokace");
        setStatus("error");
        return;
      }

      // B) Pokud máme heslo, automaticky načteme úkol (Auto-Login)
      if (savedPassword && currentLocId && !hasAutoLoaded.current) {
         hasAutoLoaded.current = true; // Zamezíme zacyklení
         setStatus("loading");
         
         // Voláme přímo logiku ověření
         await performVerification(currentLocId, savedPassword);
      } else {
         // Pokud nemáme heslo, čekáme na uživatele
         setStatus("ready");
      }
    }
    
    init();
  }, [initialCode, savedPassword]);

  // Vyčleněná funkce pro ověření (použitá v auto-loginu i ručním submitu)
  async function performVerification(locId: number, pass: string) {
      const result = await verifyAndLogQuest(locId, pass);

      if (result.success) {
          if (result.status === "active" && result.startTime) {
              setQuestData({
                  playerName: result.playerName || "",
                  teamName: result.teamName || "",
                  title: result.questName || "",
                  description: result.questDescription || "",
              });

              const startTimeMs = new Date(result.startTime).getTime();
              const endTimestamp = startTimeMs + (QUEST_LIMIT_SECONDS * 1000);
              
              setTargetTime(endTimestamp);
              setTimeLeft(Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000)));
              setStatus("active");
          } 
          else if (result.status === "locked" && result.startTime) {
              const lockStartMs = new Date(result.startTime).getTime();
              const lockTargetMs = lockStartMs + (LOCKOUT_SECONDS * 1000);
              setTargetTime(lockTargetMs);
              setTimeLeft(Math.max(0, Math.ceil((lockTargetMs - Date.now()) / 1000)));
              setStatus("locked");
          } 
          else if (result.status === "completed") {
              setStatus("completed");
          }
      } else {
          setMessage(result.message || "Chyba ověření.");
          setMessageVariant("error");
          setStatus("ready");
      }
  }

  // Logika při vypršení času (zůstává stejná)
  const handleTimeExpired = useCallback(async () => {
     if (status === "active" && locationId) {
         const now = Date.now();
         const newLockoutTarget = now + (LOCKOUT_SECONDS * 1000);
         setStatus("locked");
         setMessage("Čas na úkol vypršel! Lokace je uzamčena.");
         setMessageVariant("error");
         setTargetTime(newLockoutTarget); 
         setTimeLeft(Math.max(0, Math.ceil((newLockoutTarget - Date.now()) / 1000)));
         await finishQuest(locationId, password, 'timeout');
     } else if (status === "locked") {
         setStatus("ready");
         setMessage("Můžeš hrát znovu.");
         setMessageVariant("info");
         setTargetTime(null);
     }
  }, [locationId, password, status]);

  // Časovač (zůstává stejný)
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
    return () => clearInterval(timer);
  }, [handleTimeExpired, status, targetTime]);

  // Ruční odeslání (pro případ chyby nebo když heslo nebylo)
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) return;
    const safePassword = password.trim();
    setStatus("loading");
    await performVerification(locationId, safePassword);
  }

  // Dokončení úkolu (zůstává stejné)
  async function handleCompleteTask() {
      if (!locationId) return;
      setShowConfirmComplete(true);
  }

  async function handleConfirmCompleteTask() {
      if (!locationId) return;
      setShowConfirmComplete(false);
      setStatus("loading");
      const res = await finishQuest(locationId, password, 'success');
      if (res.success) {
          setStatus("completed");
          setTargetTime(null);
      } else {
          setMessage("Chyba při ukládání.");
          setMessageVariant("error");
          setStatus("active");
      }
  }

  const formatTime = (sec: number) => {
      const safeSec = Math.max(0, sec);
      const m = Math.floor(safeSec / 60);
      const s = safeSec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER ---
  if (status === "initializing") {
    return <div className="text-center text-purple animate-pulse">Načítám lokaci...</div>;
  }

  // Pokud se něco pokazilo
  if (status === "error") {
      return (
        <div className="text-center bg-pink-25 text-purple p-4 rounded-2xl border-2 border-pink-50">
           {message}
           <button onClick={() => window.location.reload()} className="block mt-4 text-sm underline">Zkusit znovu</button>
        </div>
      );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border-2 border-pink-50">
      
      {/* HLAVIČKA FORMULÁŘE */}
      <div className="text-center mb-6">
          <p className="text-gray-light text-sm uppercase">Checkpoint: {locationName}</p>
          
          {/* Zobrazení jména a týmu, pokud máme questData */}
          {questData ? (
             <div className="mt-2">
                <h2 className="text-2xl font-bold text-purple">{questData.playerName}</h2>
                <span className="text-xs bg-purple text-white px-2 py-1 rounded-full">{questData.teamName}</span>
             </div>
          ) : (
             <h2 className="text-2xl font-bold text-purple">Ověření</h2>
          )}

          {(status === "active" || status === "locked") && (
              <div className={`text-5xl font-mono mt-6 font-bold tracking-wider ${status === 'locked' ? 'text-pink' : 'text-purple'}`}>
                  {formatTime(timeLeft)}
              </div>
          )}
      </div>

      {message && (
         <div className={`mb-6 p-3 rounded-2xl text-center border ${messageVariant === 'error' ? 'bg-pink-25 text-purple border-pink-50' : 'bg-purple-25 text-purple border-purple-50'}`}>
            {message}
         </div>
      )}

      {/* STAV: Čekání na heslo (nebo manuální zadání) */}
      {(status === "ready" || status === "loading") && (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
           {!savedPassword && ( 
               // Zobrazíme input jen pokud nemáme heslo z rodiče (nebo chceme dovolit změnu)
               <input
                 type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                 placeholder="Tvé heslo"
                 className="w-full p-4 bg-white text-gray-dark rounded-2xl border-2 border-pink-50 text-center text-lg focus:border-pink outline-none"
                 disabled={status === "loading"}
               />
           )}
           <button type="submit" disabled={status === "loading"} className="w-full bg-purple py-4 rounded-2xl font-bold text-white hover:bg-purple-75 disabled:opacity-50 transition-all flex justify-center items-center">
             {status === "loading" ? (
                 <>
                   <span className="animate-spin mr-2">⏳</span> Načítám úkol...
                 </>
             ) : "Vstoupit"}
           </button>
        </form>
      )}

      {/* STAV: Aktivní úkol */}
      {status === "active" && questData && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
           <div className="bg-background p-6 rounded-2xl border-2 border-pink-50 text-left">
              <h4 className="text-pink font-bold mb-2 border-b border-pink-50 pb-2 text-lg">{questData.title}</h4>
              <p className="text-gray-dark text-lg leading-relaxed">{questData.description}</p>
           </div>
           
           <button 
             onClick={handleCompleteTask}
             className="w-full bg-pink hover:bg-pink-75 text-purple font-bold py-5 rounded-2xl transform active:scale-95 transition-all text-xl shadow-md"
           >
             ÚKOL SPLNĚN!
           </button>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirmComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border-2 border-pink-50 bg-white p-6 text-center shadow-xl animate-in zoom-in-95">
            <h4 className="text-xl font-bold text-purple">Opravdu hotovo?</h4>
            <p className="mt-2 text-gray-dark">Tuto akci nelze vrátit zpět.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowConfirmComplete(false)} className="flex-1 rounded-2xl border-2 border-pink-50 bg-white py-3 font-bold text-purple hover:bg-pink-25 transition-all">
                Zrušit
              </button>
              <button onClick={handleConfirmCompleteTask} className="flex-1 rounded-2xl bg-pink py-3 font-bold text-purple hover:bg-pink-75 transition-all">
                Potvrdit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAV: Locked / Completed zprávy zůstávají stejné ... */}
      {status === "locked" && (
          <div className="text-center text-gray-dark bg-background p-4 rounded-2xl border-2 border-pink-50">
              <p className="font-bold text-pink text-lg">Máš aktivní trest.</p>
              <p className="text-sm mt-2">Musíš zůstat na místě, dokud nevyprší časomíra.</p>
          </div>
      )}

      {status === "completed" && (
          <div className="text-center py-6 animate-in zoom-in">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-purple mb-2">Splněno!</h3>
              <p className="text-gray-dark">Checkpoint {locationName} je tvůj.</p>
          </div>
      )}
    </div>
  );
}