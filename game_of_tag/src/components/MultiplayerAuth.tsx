"use client";

import { useState, useEffect } from "react";
import { validateTeammate } from "../actions/loadLocation";
import type { GameConfig } from "@/src/actions/adminConfig";

type Teammate = {
  id: number;
  name: string;
  password: string;
};

type Props = {
  locationName: string;
  requiredPlayers: number;
  initiatorPassword: string;
  initiatorName: string;
  teamId: number; // We need to know the initiator's team to validate teammates
  config: GameConfig;
  onVerified: (passwords: string[]) => void;
  onCancel: () => void;
};

export default function MultiplayerAuth({ 
  locationName, 
  requiredPlayers, 
  initiatorPassword, 
  initiatorName,
  teamId,
  config,
  onVerified, 
  onCancel 
}: Props) {
  // První hráč je vždycky ten, kdo lokaci objevil
  const [verifiedPlayers, setVerifiedPlayers] = useState<Teammate[]>([
    { id: 0, name: initiatorName, password: initiatorPassword } // initiatorId je zástupný 0, nepoužíváme ho dál, jen heslo
  ]);

  const [inputVal, setInputVal] = useState("");
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const totalTime = config.MULTIPLAYER_BASE_SECONDS * (requiredPlayers - 1);
  const [timeLeft, setTimeLeft] = useState(totalTime);

  // 60-second strict timeout
  useEffect(() => {
    if (timeLeft <= 0) {
      onCancel();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onCancel]);


  async function handleVerifySubmit(slotIndex: number) {
    if (!inputVal.trim()) return;
    
    // Check if password already used
    if (verifiedPlayers.some(vp => vp.password === inputVal.trim())) {
      setErrorMessage("Tento hráč je již přidán.");
      setErrorIndex(slotIndex);
      return;
    }

    setIsVerifying(true);
    setErrorIndex(null);
    setErrorMessage("");

    try {
      const result = await validateTeammate(inputVal.trim(), teamId);
      if (result.success && result.playerName && result.playerId) {
        setVerifiedPlayers(prev => [
            ...prev, 
            { id: result.playerId!, name: result.playerName!, password: inputVal.trim() }
        ]);
        setInputVal(""); // Reset pro další políčko
      } else {
        setErrorMessage(result.message || "Neplatý běžec.");
        setErrorIndex(slotIndex);
      }
    } catch (e) {
      setErrorMessage("Chyba spojení.");
      setErrorIndex(slotIndex);
    } finally {
      setIsVerifying(false);
    }
  }


  function handleRemovePlayer(indexToRemove: number) {
    if (indexToRemove === 0) return; // Nemůžeme odebrat zakladatele
    setVerifiedPlayers(prev => prev.filter((_, idx) => idx !== indexToRemove));
  }


  function handleStartQuest() {
    if (verifiedPlayers.length === requiredPlayers) {
      onVerified(verifiedPlayers.map(vp => vp.password));
    }
  }


  // Generujeme pole pro zobrazení
  const slots = Array.from({ length: requiredPlayers }).map((_, i) => {
    return verifiedPlayers[i] || null;
  });


  return (
    <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border-2 border-pink-50 animate-in fade-in zoom-in-95">
      
      <div className="text-center mb-6">
          <p className="text-gray-light text-sm uppercase">Příprava úkolu</p>
          <h2 className="text-2xl font-bold text-purple">{locationName}</h2>
          
          <div className="mt-4 pt-4 border-t border-purple-25">
             <div className="text-4xl font-mono font-bold text-pink tracking-wider">
               {timeLeft}s
             </div>
             <p className="text-gray-dark text-sm mt-1">na shromáždění skupiny</p>
          </div>
      </div>

      <div className="flex flex-col gap-4">
        {slots.map((player, idx) => {
          
          // Pokud je slot už OBSAZENÝ:
          if (player) {
             return (
               <div key={`slot-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-purple-25/50 border-2 border-purple-25">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-purple text-white rounded-full flex items-center justify-center font-bold">
                        {player.name.charAt(0).toUpperCase()}
                     </div>
                     <span className="font-bold text-dark-gray">{player.name}</span>
                  </div>
                  {idx !== 0 && ( // Tlačítko na smazání kromě 1. hráče
                    <button 
                      onClick={() => handleRemovePlayer(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-25 text-pink font-bold transition-colors"
                    >
                      ✕
                    </button>
                  )}
               </div>
             );
          }

          // Pokud je slot prázdný a je "na řadě" (zobrazujeme ten první prázdný a ostatní zablokované):
          const isNextEmptySlot = slots.findIndex(s => s === null) === idx;

          if (isNextEmptySlot) {
              return (
                <div key={`slot-${idx}`} className="flex flex-col gap-2">
                   <div className="flex gap-2">
                       <input 
                         type="text"
                         value={inputVal}
                         onChange={(e) => setInputVal(e.target.value)}
                         placeholder="Zadej kód dalšího běžce"
                         disabled={isVerifying}
                         className={`flex-1 px-4 py-3 rounded-xl border-2 bg-gray-50 focus:outline-none transition-colors ${errorIndex === idx ? 'border-pink focus:border-pink text-pink' : 'border-purple-25 focus:border-purple text-dark-gray'}`}
                       />
                       <button 
                         onClick={() => handleVerifySubmit(idx)}
                         disabled={isVerifying || !inputVal.trim()}
                         className="px-4 py-3 bg-purple text-white font-bold rounded-xl hover:bg-purple-75 disabled:opacity-50 transition-colors"
                       >
                         {isVerifying ? "..." : "✓"}
                       </button>
                   </div>
                   {errorIndex === idx && errorMessage && (
                      <p className="text-pink text-sm ml-2">{errorMessage}</p>
                   )}
                </div>
              );
          }

          // Slot je prázdný, ukážeme placeholder:
          return (
            <div key={`slot-${idx}`} className="p-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 text-center text-gray-light">
               Čekám na hráče...
            </div>
          );

        })}
      </div>

      <div className="mt-8">
         <button 
           onClick={handleStartQuest}
           disabled={verifiedPlayers.length < requiredPlayers}
           className="w-full bg-pink hover:bg-pink-75 text-purple font-bold py-4 rounded-2xl transition-all shadow-md disabled:bg-gray-200 disabled:text-gray-light disabled:cursor-not-allowed"
         >
           {verifiedPlayers.length < requiredPlayers 
             ? `Svolej tým (${verifiedPlayers.length}/${requiredPlayers})`
             : "Spustit úkol na tomto zařízení"
           }
         </button>
         
         <button 
           onClick={onCancel} 
           className="w-full mt-3 py-3 text-dark-gray text-sm underline hover:text-purple transition-colors"
         >
           Zrušit a odejít od checkpointu
         </button>
      </div>

    </div>
  );
}
