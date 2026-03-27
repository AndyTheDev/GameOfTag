"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  findNearestCheckpoint,
  verifyPlayer,
  checkActiveQuest,
  logGpsError,
  verifyManualCheckpoint } from "@/src/actions/loadLocation";
import { Header } from "@/src/components/Header";
import { Footer } from "@/src/components/Footer";
import { getGameConfig, GameConfig } from '@/src/actions/adminConfig';
import Link from "next/link";
import CheckpointForm from "@/src/components/CheckpointForm";
import MultiplayerAuth from "@/src/components/MultiplayerAuth";

type LocationState = "idle" | "loading" | "error" | "found" | "not_in_range";
type ViewMode = "login" | "gps" | "quest" | "manual" | "multiplayer_auth";

type CheckpointResult = {
  id: number;
  name: string;
  code: string;
  type: number;
  distanceMeters: number;
  accuracyMeters: number;
  playersRequired: number;
};

export default function GamePage() {
  const router = useRouter();
  
  const [config, setConfig] = useState<GameConfig | null>(null);
  useEffect(() => {
    getGameConfig().then(setConfig);
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>("login");

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerTeamId, setPlayerTeamId] = useState<number | null>(null); 
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [activeQuestCode, setActiveQuestCode] = useState<string | null>(null);

  const [state, setState] = useState<LocationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorMessageBlock, setErrorMessageBlock] = useState<ReactNode>("");
  const [nearestCheckpoint, setNearestCheckpoint] = useState<CheckpointResult | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number>(0);

  const [manualCode, setManualCode] = useState("");
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);
  const [multiplayerPasswords, setMultiplayerPasswords] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number>(2);

  async function handleLogin() {
    if (!password) {
        setAuthError("Zadej heslo.");
        return;
    }
    
    setIsVerifying(true);
    setAuthError("");

    try {
        const result = await verifyPlayer(password);
        if (result.success) {
            setIsAuthenticated(true);
            setPlayerName(result.playerName || "Běžec");
            
            if (result.teamId) {
                setPlayerTeamId(result.teamId);
            }

            const activeCheck = await checkActiveQuest(password);
            
            if (activeCheck.hasActive && activeCheck.code) {
                setActiveQuestCode(activeCheck.code);
                setViewMode("quest");
            } else {
                setViewMode("gps");
            }

        } else {
            setAuthError(result.message || "Přihlášení se nezdařilo.");
        }
    } catch (e) {
        setAuthError("Chyba připojení.");
    } finally {
        setIsVerifying(false);
    }
  }

  async function handleManualSubmit() {
    if (!manualCode.trim()) {
      setErrorMessage("Musíš zadat kód checkpointu.");
      return;
    }

    setIsVerifyingManual(true);
    setErrorMessage("");

    try {
      const result = await verifyManualCheckpoint(password, manualCode.trim(), selectedPlayers);
      
      if (result.success && result.checkpoint) {
        setNearestCheckpoint(result.checkpoint as CheckpointResult);
        setActiveQuestCode(result.checkpoint.code);
        
        if(result.checkpoint.playersRequired > 1) {
            setViewMode("multiplayer_auth");
        } else {
            setViewMode("quest"); // Rovnou quest, nevyžaduje víc hráčů
        }
      } else {
        setErrorMessage(result.message || "Neplatný kód checkpointu.");
      }
    } catch (e) {
      setErrorMessage("Chyba při ověřování kódu.");
    } finally {
      setIsVerifyingManual(false);
    }
  }

  async function handleLoadCheckpoint() {
    setState("loading");
    setErrorMessage("");
    setNearestCheckpoint(null);
    setAccuracyMeters(0);

    if (!navigator.geolocation) {
      setState("error");
      setErrorMessage("Tvůj prohlížeč nepodporuje určování polohy.");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        let watchId: number;
        let timeoutId: NodeJS.Timeout;
        let bestAccuracy = Infinity;

        const cleanup = () => {
          if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
          clearTimeout(timeoutId);
        };

        timeoutId = setTimeout(() => {
          cleanup();
          reject({
            type: "ACCURACY_TIMEOUT",
            bestAccuracy: bestAccuracy,
            required: config!.CHECKPOINT_RADIUS_METERS
          });
        }, config!.GPS_TIMEOUT_MS);

        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const currentAccuracy = pos.coords.accuracy;
            if (currentAccuracy < bestAccuracy) {
              bestAccuracy = currentAccuracy;
            }
            setAccuracyMeters(currentAccuracy); 

            if (currentAccuracy <= config!.CHECKPOINT_RADIUS_METERS) {
              cleanup();
              resolve(pos);
            }
          },
          (err) => {
            cleanup();
            reject(err);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: config!.GPS_TIMEOUT_MS
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      setAccuracyMeters(accuracy);

      const result = await findNearestCheckpoint(password, latitude, longitude, accuracy, selectedPlayers);

      if (!result.success) {
        setState("error");
        setErrorMessage(result.message || "Chyba při hledání checkpointu.");
        if(result.message?.includes("Neplatné heslo") || result.message?.includes("Lovci") || result.message?.includes("trest")) {
             setIsAuthenticated(false);
             setPlayerName("");
             setAuthError(result.message);
             setViewMode("login");
        }
        return;
      }

      if (result.withinRadius && result.checkpoint) {
        setState("found");
        setNearestCheckpoint(result.checkpoint as CheckpointResult);
        setTimeout(() => {
            setActiveQuestCode(result.checkpoint.code);
            
            if(result.checkpoint.playersRequired > 1) {
                setViewMode("multiplayer_auth");
            } else {
                setViewMode("quest"); 
            }
        }, 3000); 
      } else if (result.checkpoint) {
        setState("not_in_range");
        setNearestCheckpoint(result.checkpoint);
      }

    } catch (error: any) {
      setState("error");

      // LOGIKA PRO ZÁPIS CHYBY (Log 5)
      if (error.type === "ACCURACY_TIMEOUT") {
        const actual = error.bestAccuracy === Infinity ? 0 : Math.round(error.bestAccuracy);
        
        // Zapíšeme log na serveru (neblokujeme UI chybou serveru)
        logGpsError(password, actual).catch(console.error);

        const actualText = error.bestAccuracy === Infinity ? "neznámá" : actual;
        setErrorMessageBlock(
          <>
            Nebylo možné dostatečně přesně zaměřit polohu.<br />
            Aktuální přesnost: <strong>{actualText} metrů</strong><br />
            Požadované minimum: <strong>{config!.CHECKPOINT_RADIUS_METERS} metrů</strong>.
          </>
        );
        return;
      }
      if (error.code !== undefined) { 
        switch (error.code) {
          case 1: 
            setErrorMessage("Přístup k poloze byl zamítnut.");
            break;
          case 2: 
            setErrorMessage("Informace o poloze není dostupná.");
            break;
          case 3: 
            setErrorMessage("Vypršel čas pro získání polohy.");
            break;
          default:
            setErrorMessage("Nepodařilo se získat polohu.");
        }
      } else {
        console.error(error);
        setErrorMessage("Došlo k neznámé chybě.");
      }
    }
  }

return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header type="basic" backgroundColor="light" />

      <main className="relative overflow-hidden py-20 px-4 flex-1 flex items-center justify-center">
        <div className="absolute top-[-40] left-[-100] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="absolute top-80 right-[-40] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,#8A00FF_25%,rgba(255,54,184,0)_70%)] blur-3xl" />

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center gap-8">
          
          {viewMode !== "quest" && viewMode !== "manual" && viewMode !== "multiplayer_auth" && (
            <div>
              <h2 className="text-purple">Načíst checkpoint</h2>
              <p className="text-gray-light text-lg">
                {isAuthenticated 
                  ? "Ověř svou polohu a checkpoint se načte automaticky" 
                  : "Pro pokračování se prosím identifikuj"}
              </p>
            </div>
          )}

          {viewMode === "multiplayer_auth" && nearestCheckpoint && (
              <div className="animate-in fade-in zoom-in-95 duration-500 w-full flex justify-center">
                 <MultiplayerAuth 
                    locationName={nearestCheckpoint.name}
                    requiredPlayers={nearestCheckpoint.playersRequired}
                    initiatorPassword={password}
                    initiatorName={playerName}
                    teamId={playerTeamId!}
                    config={config!}
                    onVerified={(passwords: string[]) => {
                        setMultiplayerPasswords(passwords); // Saved for CheckpointForm context if needed
                        setViewMode("quest");
                    }}
                    onCancel={() => {
                        setNearestCheckpoint(null);
                        setState("idle");
                        setViewMode("gps");
                    }}
                 />
              </div>
          )}

          {viewMode === "manual" && (
            <div>
              <h2 className="text-purple">Zadat kód</h2>
              <p className="text-gray-light text-lg">
                Pokud ti nefunguje GPS dostatečně přesně, nelze se dostat na přesnou lokaci nebo nastal jiný problém, volej <a href="tel:+420603966663" className="text-purple font-bold hover:text-pink transition-colors">+420 603 966 663</a> nebo <a href="tel:+420775014602" className="text-purple font-bold hover:text-pink transition-colors">+420 775 014 602</a> a my ti <b>po zaslání screenshotu, kde je vidět, že jsi na místě svého checkpointu</b>, pošleme kód k manuálnímu odemčení
              </p>
              <br />
              <b className="text-gray-light text-lg text-bold">Toto je záložní varianta, je určena pro výjimečné situace.</b>
            </div>
          )}

          {viewMode === "quest" && activeQuestCode && (
             <div className="animate-in fade-in zoom-in-95 duration-500 w-full flex justify-center">
                 <CheckpointForm 
                     initialCode={activeQuestCode} 
                     savedPassword={password} 
                     multiplayerPasswords={multiplayerPasswords.length > 0 ? multiplayerPasswords : undefined}
                     config={config!}
                     onQuestExpired={() => {
                         setActiveQuestCode(null);
                         setNearestCheckpoint(null);
                         setMultiplayerPasswords([]);
                         setState("idle");
                         setViewMode("gps");
                     }}
                 />
             </div>
          )}

          {viewMode !== "quest" && viewMode !== "multiplayer_auth" && (
             <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border-2 border-pink-50">
               
               {/* 1. BLOK: PŘIHLÁŠENÍ */}
               {!isAuthenticated && (
                  <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col items-start gap-2">
                          <label className="text-sm font-bold text-gray-dark ml-1">Zadej své heslo:</label>
                          <input 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                              placeholder="Zadej svůj kód..."
                              className="w-full px-4 py-3 rounded-xl border-2 border-purple-25 bg-gray-50 text-dark-gray focus:outline-none focus:border-purple transition-colors"
                          />
                      </div>
                      
                      {authError && (
                          <div className="text-red-600 bg-red-200 p-4 rounded-xl text-md font-medium">
                              {authError}
                          </div>
                      )}

                      <button
                          onClick={handleLogin}
                          disabled={isVerifying}
                          className="w-full mt-2 bg-purple text-white py-3 px-6 rounded-2xl font-bold text-lg hover:bg-purple-75 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                      >
                          {isVerifying ? "Ověřuji..." : "Pokračovat"}
                      </button>
                  </div>
               )}

               {/* 2. BLOK: GPS ZAMĚŘENÍ */}
               {isAuthenticated && viewMode === "gps" && (
                   <div className="animate-in fade-in zoom-in-95 duration-500">
                     <div className="rounded-2xl p-4 mb-6 flex items-center justify-between bg-purple-25/30">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple text-white rounded-full flex items-center justify-center font-bold text-lg">
                                {playerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-purple font-medium uppercase tracking-wider">Hráč</span>
                                <span className="text-dark-gray font-bold text-lg leading-tight">{playerName}</span>
                            </div>
                         </div>
                     </div>

                     {state === "idle" && (
                       <div className="flex flex-col gap-4 w-full">
                         <div className="flex flex-col items-start gap-2 text-left w-full">
                           <label className="text-sm font-bold text-gray-dark ml-1">Společný úkol pro:</label>
                           <div className="flex gap-2 w-full mt-1 mb-2">
                             {[2, 3, 4, 5].map(num => (
                               <button 
                                 key={num}
                                 onClick={() => setSelectedPlayers(num)}
                                 className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedPlayers === num ? 'bg-pink text-white border-2 border-pink shadow-md transform scale-105' : 'bg-gray-50 text-dark-gray border-2 border-purple-25 hover:border-pink hover:text-pink'}`}
                               >
                                 {num} hráči
                               </button>
                             ))}
                           </div>
                         </div>
                         <button
                           onClick={handleLoadCheckpoint}
                           className="w-full bg-purple text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-purple-75 transition-all transform hover:scale-105 active:scale-95"
                         >
                           Načíst checkpoint
                         </button>
                         <p className="text-sm text-purple mt-2">Pro maximální přesnost se ujisti, že nejsi uvnitř budovy.</p>
                       </div>
                     )}

                     {state === "loading" && (
                        <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
                           <p className="text-gray-dark text-lg font-medium animate-pulse">
                              {accuracyMeters > 0 && accuracyMeters <= config!.CHECKPOINT_RADIUS_METERS ? "Poloha zaměřena!" : "Zpřesňuji polohu..."}
                           </p>
                           <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
                             <div className={`h-full ${accuracyMeters <= config!.CHECKPOINT_RADIUS_METERS ? "bg-green-500" : "bg-pink"} transition-colors duration-300 ease-out origin-left`}
                                  style={{ animation: `fillBar ${config!.GPS_TIMEOUT_MS}ms linear forwards` }} />
                           </div>
                           <p className="text-xl tabular-nums">± {accuracyMeters > 0 ? Math.round(accuracyMeters) : "?"} m</p>
                           <style jsx>{`@keyframes fillBar { from { width: 0%; } to { width: 100%; } }`}</style>
                        </div>
                     )}

                     {state === "found" && nearestCheckpoint && (
                       <div className="flex flex-col items-center gap-4">
                         <div className="text-5xl">✅</div>
                         <h4 className="text-pink">Checkpoint nalezen!</h4>
                         <p className="text-gray-dark">
                           <b>{nearestCheckpoint.name}</b> ({nearestCheckpoint.distanceMeters} m)
                         </p>
                       </div>
                     )}

                     {state === "not_in_range" && nearestCheckpoint && (
                       <div className="flex flex-col items-center gap-4">
                         <div className="bg-background border-2 border-pink-50 rounded-2xl p-6 w-full">
                           <div className="text-4xl mb-3">📍</div>
                           <h5 className="text-purple">Nejsi u checkpointu</h5>
                           <p className="text-gray-dark">
                             Nejbližší checkpoint je <span className="text-pink font-bold">{nearestCheckpoint.distanceMeters} m</span> daleko
                           </p>
                           <p className="text-gray-light text-sm mt-2">Přesnost: {Math.round(accuracyMeters)} m</p>
                         </div>
                         <button onClick={handleLoadCheckpoint} className="w-full bg-pink text-purple py-3 rounded-2xl font-bold">Zkusit znovu</button>
                       </div>
                     )}

                     {state === "error" && (
                       <div className="flex flex-col items-center gap-4">
                          <div className="bg-pink-25 border-2 border-pink-50 rounded-2xl p-6 w-full">
                            <h5 className="text-purple">Chyba</h5>
                            <p className="text-gray-dark">{errorMessageBlock || errorMessage}</p>
                          </div>
                          <button onClick={handleLoadCheckpoint} className="w-full bg-pink text-purple py-3 rounded-2xl font-bold">Zkusit znovu</button>
                          <button onClick={() => { setViewMode("manual"); setErrorMessage(""); }} className="underline text-sm bg-white text-purple border-purple mt-2 hover:text-pink transition-colors">Manuální vyhledání</button>
                       </div>
                     )}
                   </div>
               )}

               {/* 3. BLOK: MANUÁLNÍ ZADÁNÍ KÓDU (Tento blok musel jít ven z GPS bloku!) */}
               {isAuthenticated && viewMode === "manual" && (
                   <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="flex flex-col items-start gap-2 text-left w-full mb-2">
                           <label className="text-sm font-bold text-gray-dark ml-1">Společný úkol pro:</label>
                           <div className="flex gap-2 w-full mt-1">
                             {[2, 3, 4, 5].map(num => (
                               <button 
                                 key={num}
                                 onClick={() => setSelectedPlayers(num)}
                                 className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedPlayers === num ? 'bg-pink text-white border-2 border-pink shadow-md transform scale-105' : 'bg-gray-50 text-dark-gray border-2 border-purple-25 hover:border-pink hover:text-pink'}`}
                               >
                                 {num} hráči
                               </button>
                             ))}
                           </div>
                       </div>
                   
                       <div className="flex flex-col items-start gap-2">
                           <label className="text-sm font-bold text-gray-dark ml-1">Kód checkpointu:</label>
                           <input 
                               value={manualCode}
                               onChange={(e) => setManualCode(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                               placeholder="např. 12-Socha-Husa"
                               className="w-full px-4 py-3 rounded-xl border-2 border-purple-25 bg-gray-50 text-dark-gray focus:outline-none focus:border-purple transition-colors"
                           />
                       </div>
                       
                       {errorMessage && (
                           <div className="text-red-600 bg-red-200 p-4 rounded-xl text-md font-medium text-left">
                               {errorMessage}
                           </div>
                       )}

                       <button
                           onClick={handleManualSubmit}
                           disabled={isVerifyingManual}
                           className="w-full mt-2 bg-purple text-white py-3 px-6 rounded-2xl font-bold text-lg hover:bg-purple-75 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                       >
                           {isVerifyingManual ? "Ověřuji kód..." : "Odemknout checkpoint"}
                       </button>

                       <button 
                           onClick={() => { setViewMode("gps"); setErrorMessage(""); setManualCode(""); }} 
                           className="underline text-sm text-dark-gray mt-2 hover:text-purple transition-colors"
                       >
                           Zpět na zaměření přes GPS
                       </button>
                   </div>
               )}

             </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}