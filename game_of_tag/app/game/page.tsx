// // "use client";

// // import { ReactNode, useState } from "react";
// // import { useRouter } from "next/navigation";
// // import { findNearestCheckpoint } from "@/src/actions/loadLocation";
// // import { Header } from "@/src/components/Header";
// // import { Footer } from "@/src/components/Footer";
// // import { CHECKPOINT_RADIUS_METERS, GPS_TIMEOUT_MS, REDIRECT_DELAY_MS } from '../../src/constants';
// // import Link from "next/link";

// // type LocationState = "idle" | "loading" | "error" | "found" | "not_in_range";

// // type CheckpointResult = {
// //   id: number;
// //   name: string;
// //   code: string;
// //   type: number;
// //   distanceMeters: number;
// //   accuracyMeters: number;
// // };

// // export default function GamePage() {
// //   const router = useRouter();
// //   const [state, setState] = useState<LocationState>("idle");
// //   const [errorMessage, setErrorMessage] = useState<string>("");
// //   const [errorMessageBlock, setErrorMessageBlock] = useState<ReactNode>("");
// //   const [nearestCheckpoint, setNearestCheckpoint] = useState<CheckpointResult | null>(null);
// //   const [accuracyMeters, setAccuracyMeters] = useState<number>(0);

// //   async function handleLoadCheckpoint() {
// //     setState("loading");
// //     setErrorMessage("");
// //     setNearestCheckpoint(null);
// //     setAccuracyMeters(0);

// //     // Check if geolocation is available
// //     if (!navigator.geolocation) {
// //       setState("error");
// //       setErrorMessage("Tvůj prohlížeč nepodporuje určování polohy.");
// //       return;
// //     }

// //     try {
// //     // 1. Získání přesné polohy pomocí watchPosition + Timeout
// //     const position = await new Promise<GeolocationPosition>((resolve, reject) => {
// //       let watchId: number;
// //       let timeoutId: NodeJS.Timeout;
// //       let bestAccuracy = Infinity;

// //       // Funkce pro úklid (zastavení GPS a timeru)
// //       const cleanup = () => {
// //         if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
// //         clearTimeout(timeoutId);
// //       };

// //       // Spustíme timeout gps MĚŘENÍ
// //       timeoutId = setTimeout(() => {
// //         cleanup();
// //         // Zde vracíme speciální chybu s daty pro výpis
// //         reject({
// //           type: "ACCURACY_TIMEOUT",
// //           bestAccuracy: bestAccuracy,
// //           required: CHECKPOINT_RADIUS_METERS
// //         });
// //       }, GPS_TIMEOUT_MS);

// //       // Spustíme sledování polohy
// //       watchId = navigator.geolocation.watchPosition(
// //         (pos) => {
// //           const currentAccuracy = pos.coords.accuracy;
          
// //           // Průběžně si ukládáme nejlepší dosaženou přesnost
// //           if (currentAccuracy < bestAccuracy) {
// //             bestAccuracy = currentAccuracy;
// //           }
// //           setAccuracyMeters(currentAccuracy); 

// //           // Pokud je přesnost dostatečná, končíme úspěchem
// //           if (currentAccuracy <= CHECKPOINT_RADIUS_METERS) {
// //             cleanup();
// //             resolve(pos);
// //           }
// //         },
// //         (err) => {
// //           // Pokud nastane fatální chyba (např. uživatel zakáže GPS), končíme hned
// //           cleanup();
// //           reject(err);
// //         },
// //         {
// //           enableHighAccuracy: true,
// //           maximumAge: 0,
// //           timeout: GPS_TIMEOUT_MS
// //         }
// //       );
// //     });

// //     // Zde už máme jistotu, že position.coords.accuracy <= 25m
// //     const { latitude, longitude, accuracy } = position.coords;
// //     setAccuracyMeters(accuracy);

// //     // 2. Volání serveru
// //     const result = await findNearestCheckpoint(latitude, longitude, accuracy);

// //     if (!result.success) {
// //       setState("error");
// //       setErrorMessage(result.message || "Chyba při hledání checkpointu.");
// //       return;
// //     }

// //     if (result.withinRadius && result.checkpoint) {
// //       setState("found");
// //       setNearestCheckpoint(result.checkpoint);
// //       setTimeout(() => {
// //         router.push(`/game/checkpoint/${result.checkpoint.code}`);
// //       }, REDIRECT_DELAY_MS);
// //     } else if (result.checkpoint) {
// //       setState("not_in_range");
// //       setNearestCheckpoint(result.checkpoint);
// //     }

// //   } catch (error: any) {
// //     setState("error");

// //     // Vlastní chyba pro nedostatečnou přesnost
// //     if (error.type === "ACCURACY_TIMEOUT") {
// //       const actual = error.bestAccuracy === Infinity ? "neznámá" : Math.round(error.bestAccuracy);
// //       setErrorMessageBlock(
// //         <>
// //           Nebylo možné dostatečně přesně zaměřit polohu.<br />
// //           Aktuální přesnost: <strong>{actual} metrů</strong><br />
// //           Požadované minimum: <strong>{error.required} metrů</strong>.
// //         </>
// //       );
// //       return;
// //     }

// //     // Standardní Geolocation chyby
// //     if (error.code !== undefined) { 
// //       switch (error.code) {
// //         case 1: // PERMISSION_DENIED
// //           setErrorMessage("Přístup k poloze byl zamítnut. Povol přístup k GPS v nastavení prohlížeče.");
// //           break;
// //         case 2: // POSITION_UNAVAILABLE
// //           setErrorMessage("Informace o poloze není dostupná.");
// //           break;
// //         case 3: // TIMEOUT
// //           setErrorMessage("Vypršel čas pro získání polohy. Zkus to znovu.");
// //           break;
// //         default:
// //           setErrorMessage("Nepodařilo se získat polohu.");
// //       }
// //     } else {
// //       console.error(error);
// //       setErrorMessage("Došlo k neznámé chybě.");
// //     }
// //   }
// // }

// //   return (
// //     <div className="min-h-screen bg-background flex flex-col">
// //       <Header type="basic" backgroundColor="light" />

// //       <main className="relative overflow-hidden py-20 px-4 flex-1 flex items-center">
// //         <div className="absolute top-[-40] left-[-100] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
// //         <div className="absolute top-80 right-[-40] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,#8A00FF_25%,rgba(255,54,184,0)_70%)] blur-3xl" />

// //         <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center gap-8">
// //           <div>
// //             <h2 className="text-purple">Načíst checkpoint</h2>
// //             <p className="text-gray-light text-lg">
// //               Ověř svou polohu a checkpoint se načte automaticky
// //             </p>
// //           </div>

// //           <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border-2 border-pink-50">
// //             {state === "idle" && (
// //               <div>
// //                 <button
// //                   onClick={handleLoadCheckpoint}
// //                   className="w-full bg-purple text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-purple-75 transition-all transform hover:scale-105 active:scale-95"
// //                 >
// //                   Načíst checkpoint
// //                 </button>
// //                 <br />
// //                 <p className="text-sm text-purple mt-4">Pro maximální přesnost se ujisti, že nejsi uvnitř budovy nebo v podzemních prostorách.</p>
// //               </div>
// //             )}

// //             {state === "loading" && (() => {
// //               const isPreciseEnough = accuracyMeters > 0 && accuracyMeters <= CHECKPOINT_RADIUS_METERS;
              
// //               const barColorClass = isPreciseEnough ? "bg-green-500" : "bg-pink";
// //               const textColorClass = isPreciseEnough ? "text-green-500 font-bold" : "text-gray-light";

// //               return (
// //                 <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
// //                   {/* 1. Textová informace */}
// //                   <p className="text-gray-dark text-lg font-medium animate-pulse">
// //                     {isPreciseEnough ? "Poloha zaměřena!" : "Zpřesňuji polohu..."}
// //                   </p>

// //                   {/* 2. Progress Bar (Časovač timeoutu) */}
// //                   <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
// //                     <div
// //                       className={`h-full ${barColorClass} transition-colors duration-300 ease-out origin-left`}
// //                       style={{
// //                         animation: `fillBar ${GPS_TIMEOUT_MS}ms linear forwards`
// //                       }}
// //                     />
// //                   </div>

// //                   {/* 3. Výpis přesnosti */}
// //                   <div className={`flex flex-col items-center transition-colors duration-300 ${textColorClass}`}>
// //                     <p className="text-xl tabular-nums">
// //                       ± {accuracyMeters > 0 ? Math.round(accuracyMeters) : "?"} m
// //                     </p>
// //                     <p className="text-xs opacity-80">
// //                       (Minimální potřebná přesnost: {CHECKPOINT_RADIUS_METERS} m)
// //                     </p>
// //                   </div>

// //                   {/* 4. Definice animace (vloženo přímo, aby to fungovalo hned) */}
// //                   <style jsx>{`
// //                     @keyframes fillBar {
// //                       from { width: 0%; }
// //                       to { width: 100%; }
// //                     }
// //                   `}</style>
// //                 </div>
// //               );
// //             })()}

// //             {state === "found" && nearestCheckpoint && (
// //               <div className="flex flex-col items-center gap-4">
// //                 <div className="text-5xl">✅</div>
// //                 <h4 className="text-pink">Checkpoint nalezen!</h4>
// //                 <p className="text-gray-dark">
// //                   {nearestCheckpoint.code} ({nearestCheckpoint.distanceMeters} m)
// //                 </p>
// //                 <p className="text-gray-light text-sm">Přesměrovávám...</p>
// //               </div>
// //             )}

// //             {state === "not_in_range" && nearestCheckpoint && (
// //               <div className="flex flex-col items-center gap-4">
// //                 <div className="bg-background border-2 border-pink-50 rounded-2xl p-6 w-full">
// //                   <div className="text-4xl mb-3">📍</div>
// //                   <h5 className="text-purple">Nejsi u checkpointu</h5>
// //                   <p className="text-gray-dark">
// //                     Nejbližší checkpoint je
// //                     <span className="text-pink font-bold text-xl ml-2">
// //                       {nearestCheckpoint.distanceMeters} m
// //                     </span>
// //                     <span className="text-gray-light ml-1">daleko</span>
// //                   </p>
// //                   <p className="text-gray-light text-sm mt-2">
// //                     Přesnost GPS: {accuracyMeters} metrů
// //                   </p>
// //                   <p className="text-gray-light text-sm mt-2">
// //                     Přibliž se na méně než {CHECKPOINT_RADIUS_METERS} metrů od checkpointu
// //                   </p>
// //                 </div>

// //                 <button
// //                   onClick={handleLoadCheckpoint}
// //                   className="w-full bg-pink text-purple py-3 px-6 rounded-2xl font-bold hover:bg-pink-75 transition-all"
// //                 >
// //                   Zkusit znovu
// //                 </button>
// //               </div>
// //             )}

// //             {state === "error" && (
// //               <div className="flex flex-col items-center gap-4">
// //                 <div className="bg-pink-25 border-2 border-pink-50 rounded-2xl p-6 w-full">
// //                   <div className="text-4xl mb-3">⚠️</div>
// //                   <h5 className="text-purple">Chyba</h5>
// //                   <p className="text-gray-dark">{errorMessageBlock}</p>
// //                 </div>

// //                 <button
// //                   onClick={handleLoadCheckpoint}
// //                   className="w-full bg-pink text-purple py-3 px-6 rounded-2xl font-bold hover:bg-pink-75 transition-all"
// //                 >
// //                   Zkusit znovu
// //                 </button>
// //                 <p className="text-sm text-purple"> Pokud ti nefunguje určení polohy i po více pokusech, volej Andymu na <b>+420603966663</b></p>
// //                 <Link href="https://www.gameoftag.cz" className="underline">
// //                   Manuální vyhledání
// //                 </Link>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </main>

// //       <Footer />
// //     </div>
// //   );
// // }


// --- VERSION 4 - ZOBRAZENÍ PŘIHLÁŠENÉHO HRÁČE ---
"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { findNearestCheckpoint, verifyPlayer } from "@/src/actions/loadLocation";
import { Header } from "@/src/components/Header";
import { Footer } from "@/src/components/Footer";
import { CHECKPOINT_RADIUS_METERS, GPS_TIMEOUT_MS, REDIRECT_DELAY_MS } from '../../src/constants';
import Link from "next/link";

type LocationState = "idle" | "loading" | "error" | "found" | "not_in_range";

type CheckpointResult = {
  id: number;
  name: string;
  code: string;
  type: number;
  distanceMeters: number;
  accuracyMeters: number;
};

export default function GamePage() {
  const router = useRouter();
  
  // Auth stavy
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playerName, setPlayerName] = useState(""); // NOVÉ: Jméno hráče
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // GPS stavy
  const [state, setState] = useState<LocationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorMessageBlock, setErrorMessageBlock] = useState<ReactNode>("");
  const [nearestCheckpoint, setNearestCheckpoint] = useState<CheckpointResult | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number>(0);

  // --- 1. LOGIN LOGIC ---
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
        } else {
            setAuthError(result.message || "Přihlášení se nezdařilo.");
        }
    } catch (e) {
        setAuthError("Chyba připojení.");
    } finally {
        setIsVerifying(false);
    }
  }

  // --- 2. GPS LOGIC ---
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
          required: CHECKPOINT_RADIUS_METERS
        });
      }, GPS_TIMEOUT_MS);

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const currentAccuracy = pos.coords.accuracy;
          if (currentAccuracy < bestAccuracy) {
            bestAccuracy = currentAccuracy;
          }
          setAccuracyMeters(currentAccuracy); 

          if (currentAccuracy <= CHECKPOINT_RADIUS_METERS) {
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
          timeout: GPS_TIMEOUT_MS
        }
      );
    });

    const { latitude, longitude, accuracy } = position.coords;
    setAccuracyMeters(accuracy);

    const result = await findNearestCheckpoint(password, latitude, longitude, accuracy);

    if (!result.success) {
      setState("error");
      setErrorMessage(result.message || "Chyba při hledání checkpointu.");
      if(result.message?.includes("Neplatné heslo") || result.message?.includes("Lovci") || result.message?.includes("trest")) {
         setIsAuthenticated(false);
         setPlayerName("");
         setAuthError(result.message);
      }
      return;
    }

    if (result.withinRadius && result.checkpoint) {
      setState("found");
      setNearestCheckpoint(result.checkpoint);
      setTimeout(() => {
        router.push(`/game/checkpoint/${result.checkpoint.code}`);
      }, REDIRECT_DELAY_MS);
    } else if (result.checkpoint) {
      setState("not_in_range");
      setNearestCheckpoint(result.checkpoint);
    }

  } catch (error: any) {
    setState("error");

    if (error.type === "ACCURACY_TIMEOUT") {
      const actual = error.bestAccuracy === Infinity ? "neznámá" : Math.round(error.bestAccuracy);
      setErrorMessageBlock(
        <>
          Nebylo možné dostatečně přesně zaměřit polohu.<br />
          Aktuální přesnost: <strong>{actual} metrů</strong><br />
          Požadované minimum: <strong>{error.required} metrů</strong>.
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

      <main className="relative overflow-hidden py-20 px-4 flex-1 flex items-center">
        <div className="absolute top-[-40] left-[-100] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="absolute top-80 right-[-40] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,#8A00FF_25%,rgba(255,54,184,0)_70%)] blur-3xl" />

        <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center gap-8">
          <div>
            <h2 className="text-purple">Načíst checkpoint</h2>
            <p className="text-gray-light text-lg">
              {isAuthenticated 
                ? "Ověř svou polohu a checkpoint se načte automaticky" 
                : "Pro pokračování se prosím identifikuj"}
            </p>
          </div>

          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border-2 border-pink-50">
            
            {/* LOGIN FORM */}
            {!isAuthenticated && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col items-start gap-2">
                        <label className="text-sm font-bold text-gray-dark ml-1">Kód hráče (heslo)</label>
                        <input 
                            type="password" 
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


            {/* GPS ACTION AREA */}
            {isAuthenticated && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  
                  {/* NOVÉ: Zobrazení přihlášeného hráče */}
                  <div className="rounded-2xl p-4 mb-6 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple text-white rounded-full flex items-center justify-center font-bold text-lg">
                            {playerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-purple font-medium uppercase tracking-wider">Hráč</span>
                            <span className="text-dark-gray font-bold text-lg leading-tight">{playerName}</span>
                        </div>
                     </div>
                     
                     <button 
                        onClick={() => { setIsAuthenticated(false); setPassword(""); setPlayerName(""); }}
                        className="text-sm text-pink hover:text-purple font-semibold px-3 py-1 rounded-lg hover:bg-white/50 transition-colors"
                      >
                        Odhlásit
                      </button>
                  </div>

                  {state === "idle" && (
                    <div>
                      <button
                        onClick={handleLoadCheckpoint}
                        className="w-full bg-purple text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-purple-75 transition-all transform hover:scale-105 active:scale-95"
                      >
                        Načíst checkpoint
                      </button>
                      <br />
                      <p className="text-sm text-purple mt-4">Pro maximální přesnost se ujisti, že nejsi uvnitř budovy nebo v podzemních prostorách.</p>
                    </div>
                  )}

                  {state === "loading" && (() => {
                    const isPreciseEnough = accuracyMeters > 0 && accuracyMeters <= CHECKPOINT_RADIUS_METERS;
                    const barColorClass = isPreciseEnough ? "bg-green-500" : "bg-pink";
                    const textColorClass = isPreciseEnough ? "text-green-500 font-bold" : "text-gray-light";

                    return (
                      <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
                        <p className="text-gray-dark text-lg font-medium animate-pulse">
                          {isPreciseEnough ? "Poloha zaměřena!" : "Zpřesňuji polohu..."}
                        </p>

                        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
                          <div
                            className={`h-full ${barColorClass} transition-colors duration-300 ease-out origin-left`}
                            style={{
                              animation: `fillBar ${GPS_TIMEOUT_MS}ms linear forwards`
                            }}
                          />
                        </div>

                        <div className={`flex flex-col items-center transition-colors duration-300 ${textColorClass}`}>
                          <p className="text-xl tabular-nums">
                            ± {accuracyMeters > 0 ? Math.round(accuracyMeters) : "?"} m
                          </p>
                          <p className="text-xs opacity-80">
                            (Minimální potřebná přesnost: {CHECKPOINT_RADIUS_METERS} m)
                          </p>
                        </div>
                        <style jsx>{`
                          @keyframes fillBar {
                            from { width: 0%; }
                            to { width: 100%; }
                          }
                        `}</style>
                      </div>
                    );
                  })()}

                  {state === "found" && nearestCheckpoint && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-5xl">✅</div>
                      <h4 className="text-pink">Checkpoint nalezen!</h4>
                      <p className="text-gray-dark">
                        {nearestCheckpoint.code} ({nearestCheckpoint.distanceMeters} m)
                      </p>
                      <p className="text-gray-light text-sm">Přesměrovávám...</p>
                    </div>
                  )}

                  {state === "not_in_range" && nearestCheckpoint && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-background border-2 border-pink-50 rounded-2xl p-6 w-full">
                        <div className="text-4xl mb-3">📍</div>
                        <h5 className="text-purple">Nejsi u checkpointu</h5>
                        <p className="text-gray-dark">
                          Nejbližší checkpoint je
                          <span className="text-pink font-bold text-xl ml-2">
                            {nearestCheckpoint.distanceMeters} m
                          </span>
                          <span className="text-gray-light ml-1">daleko</span>
                        </p>
                        <p className="text-gray-light text-sm mt-2">
                          Přesnost GPS: {accuracyMeters} metrů
                        </p>
                        <p className="text-gray-light text-sm mt-2">
                          Přibliž se na méně než {CHECKPOINT_RADIUS_METERS} metrů od checkpointu
                        </p>
                      </div>

                      <button
                        onClick={handleLoadCheckpoint}
                        className="w-full bg-pink text-purple py-3 px-6 rounded-2xl font-bold hover:bg-pink-75 transition-all"
                      >
                        Zkusit znovu
                      </button>
                    </div>
                  )}

                  {state === "error" && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-pink-25 border-2 border-pink-50 rounded-2xl p-6 w-full">
                        <div className="text-4xl mb-3">⚠️</div>
                        <h5 className="text-purple">Chyba</h5>
                        <p className="text-gray-dark">{errorMessageBlock || errorMessage}</p>
                      </div>

                      <button
                        onClick={handleLoadCheckpoint}
                        className="w-full bg-pink text-purple py-3 px-6 rounded-2xl font-bold hover:bg-pink-75 transition-all"
                      >
                        Zkusit znovu
                      </button>
                      <Link href="https://www.gameoftag.cz" className="underline text-sm text-purple mt-2">
                        Manuální vyhledání
                      </Link>
                    </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}