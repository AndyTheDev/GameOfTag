"use client";

import { useState, useEffect } from "react";
import { getLocationDetails, verifyAndLogQuest } from "../actions/loadLocation"; 

type Props = {
  initialCode: string; // Kód z URL je povinný
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
      
      {/* Nadpis s názvem lokace (viditelný vždy před splněním) */}
      {status !== "success" && (
        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm uppercase tracking-widest">Jsi na lokaci</p>
          <h2 className="text-2xl font-bold text-[#00D68F] mt-1">{locationName}</h2>
        </div>
      )}

      {/* Chybové hlášky formuláře */}
      {message && status !== 'success' && (
        <div className="mb-6 p-3 rounded-xl text-center font-medium bg-red-900/30 text-red-400 border border-red-500/50">
          {message}
        </div>
      )}

      {/* FÁZE A: Zadání hesla */}
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
            {status === "loading" ? "Ověřuji..." : "Potvrdit splnění"}
          </button>
        </form>
      )}

      {/* FÁZE B: Zobrazení vylosovaného úkolu */}
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
}



/*  

*/