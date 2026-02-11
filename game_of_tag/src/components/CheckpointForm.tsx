// "use client";

// import { useState, useEffect, useCallback } from "react";
// import Link from "next/link";
// import { getLocationDetails, verifyAndLogQuest, finishQuest } from "../actions/loadLocation"; 

// // KONSTANTY (Musí sedět se serverem)
// const QUEST_LIMIT_SECONDS = 360; // 6 minut
// const LOCKOUT_SECONDS = 300;     // 5 minut

// type Props = { initialCode: string; };

// type QuestData = {
//   playerName: string;
//   title: string;
//   description: string;
//   questId?: number; 
// };

// export default function CheckpointForm({ initialCode }: Props) {
//   const [status, setStatus] = useState<"initializing" | "ready" | "loading" | "active" | "completed" | "locked" | "error">("initializing");
//   const [password, setPassword] = useState("");
//   const [locationName, setLocationName] = useState("");
//   const [locationId, setLocationId] = useState<number | null>(null);
//   const [message, setMessage] = useState("");
//   const [messageVariant, setMessageVariant] = useState<"error" | "info">("info");
//   const [questData, setQuestData] = useState<QuestData | null>(null);
//   const [targetTime, setTargetTime] = useState<number | null>(null);
//   const [timeLeft, setTimeLeft] = useState<number>(0);
//   const [showConfirmComplete, setShowConfirmComplete] = useState(false);

//   // 1. Init
//   useEffect(() => {
//     async function init() {
//       const result = await getLocationDetails(initialCode);
//       if (
//         result.success &&
//         "name" in result &&
//         typeof result.name === "string" &&
//         "id" in result &&
//         typeof result.id === "number"
//       ) {
//         // Type guard kvuli union typu ze server action.
//         setLocationName(result.name);
//         setLocationId(result.id);
//         setStatus("ready");
//       } else {
//         const fallbackMessage = "Chyba načítání lokace";
//         setMessage("message" in result ? result.message || fallbackMessage : fallbackMessage);
//         setMessageVariant("error");
//         setStatus("error");
//       }
//     }
//     init();
//   }, [initialCode]);

//   // Logika při vypršení času
//   const handleTimeExpired = useCallback(async () => {
//      // A) Vypršel AKTIVNÍ úkol -> Přechod do FREEZE (LOCKED)
//      if (status === "active" && locationId) {
//          const safePassword = password.trim();
         
//          // DŮLEŽITÁ ZMĚNA: Trest začíná TEĎ, protože právě teď to vypršelo v prohlížeči.
//          // Nemůžeme spoléhat na 'targetTime', protože ten mohl být v minulosti (kvůli chybě).
//          const now = Date.now();
//          const newLockoutTarget = now + (LOCKOUT_SECONDS * 1000);
         
//          setStatus("locked");
//          setMessage("Čas na úkol vypršel! Lokace je uzamčena na 5 minut.");
//          setMessageVariant("error");
//          setTargetTime(newLockoutTarget); 
//          setTimeLeft(Math.max(0, Math.ceil((newLockoutTarget - Date.now()) / 1000)));

//          // Zapíšeme na server
//          await finishQuest(locationId, safePassword, 'timeout');
//      } 
     
//      // B) Vypršel TREST (LOCKED) -> Přechod do READY
//      else if (status === "locked") {
//          setStatus("ready");
//          setMessage("Můžeš hrát znovu.");
//          setMessageVariant("info");
//          setPassword(""); 
//          setTargetTime(null);
//      }
//   }, [locationId, password, status]);

//   // 2. Časovač
//   useEffect(() => {
//     if ((status !== "active" && status !== "locked") || !targetTime) return;

//     const timer = setInterval(() => {
//       const now = Date.now();
//       const diffSeconds = Math.ceil((targetTime - now) / 1000);

//       if (diffSeconds <= 0) {
//           clearInterval(timer);
//           setTimeLeft(0);
//           handleTimeExpired(); 
//       } else {
//           setTimeLeft(diffSeconds);
//       }
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [handleTimeExpired, status, targetTime]);

//   async function handlePasswordSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     if (!locationId) return;
//     const safePassword = password.trim();
//     if (safePassword.length < 3) {
//       setMessage("Zadej prosím své heslo.");
//       setMessageVariant("error");
//       setStatus("ready");
//       return; // Jednoducha validace na klientovi pro lepsi UX.
//     }
//     setPassword(safePassword); // Ulozime ocistenou hodnotu, aby se pouzila i pri dokončení.
//     setStatus("loading");
//     setMessage("");
//     setMessageVariant("info");
    
//     const result = await verifyAndLogQuest(locationId, safePassword);

//     if (
//       result.success &&
//       "status" in result &&
//       result.status === "active" &&
//       "startTime" in result &&
//       result.startTime
//     ) {
//       setQuestData({
//         playerName: "playerName" in result ? result.playerName ?? "" : "",
//         title: "questName" in result ? result.questName ?? "" : "",
//         description: "questDescription" in result ? result.questDescription ?? "" : "",
//       });

//       // Cíl = Čas startu z DB (už normalizovaný na serveru) + 6 minut
//       const startTimeMs = new Date(result.startTime).getTime();
//       const endTimestamp = startTimeMs + (QUEST_LIMIT_SECONDS * 1000);
      
//       setTargetTime(endTimestamp);
//       setTimeLeft(Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000)));
//       setStatus("active");
//     } 
//     else if (
//       "status" in result &&
//       result.status === "locked" &&
//       "startTime" in result &&
//       result.startTime
//     ) {
//         // Cíl = Čas kdy trest začal (normalizovaný) + 5 minut
//         const lockStartMs = new Date(result.startTime).getTime();
//         const lockTargetMs = lockStartMs + (LOCKOUT_SECONDS * 1000);
//         setTargetTime(lockTargetMs);
//         setTimeLeft(Math.max(0, Math.ceil((lockTargetMs - Date.now()) / 1000)));

//         setStatus("locked");
//     } 
//     else if ("status" in result && result.status === "completed") {
//         setStatus("completed");
//     } 
//     else {
//       setMessage(result.message || "Chyba ověření.");
//       setMessageVariant("error");
//       setStatus("ready");
//     }
//   }

//   async function handleCompleteTask() {
//       if (!locationId) return;
//       setShowConfirmComplete(true);
//   }

//   async function handleConfirmCompleteTask() {
//       if (!locationId) return;
//       setShowConfirmComplete(false);
//       const safePassword = password.trim();
//       if (!safePassword) {
//           setMessage("Heslo chybí, zkus se přihlásit znovu.");
//           setMessageVariant("error");
//           return;
//       }
//       setStatus("loading");
//       const res = await finishQuest(locationId, safePassword, 'success');
//       if (res.success) {
//           setStatus("completed");
//           setTargetTime(null);
//       } else {
//           setMessage("Chyba při ukládání splnění.");
//           setMessageVariant("error");
//           setStatus("active");
//       }
//   }

//   const formatTime = (sec: number) => {
//       const safeSec = Math.max(0, sec);
//       const m = Math.floor(safeSec / 60);
//       const s = safeSec % 60;
//       return `${m}:${s < 10 ? '0' : ''}${s}`;
//   };

//   const showBackLink = status !== "active" && status !== "locked";

//   if (status === "initializing") {
//     return (
//       <div className="text-center">
//         <div className="text-purple animate-pulse">Načítám...</div>
//         {showBackLink && (
//           <div className="mt-4">
//             <Link
//               href="/game"
//               className="inline-block text-purple hover:text-purple-50 transition-colors font-bold"
//             >
//               Zpět na hru
//             </Link>
//           </div>
//         )}
//       </div>
//     );
//   }
//   if (status === "error") {
//     return (
//       <div className="text-center">
//         <div className="bg-pink-25 text-purple p-4 rounded-2xl border-2 border-pink-50">
//           {message}
//         </div>
//         {showBackLink && (
//           <div className="mt-4">
//             <Link
//               href="/game"
//               className="inline-block text-purple hover:text-purple-50 transition-colors font-bold"
//             >
//               Zpět na hru
//             </Link>
//           </div>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-sm border-2 border-pink-50">
      
//       <div className="text-center mb-6">
        
//           <p className="text-gray-light text-sm uppercase">Lokace: {locationName}{locationId}</p>
//           <h2 className="text-2xl font-bold text-purple">Vítej {questData ? ` ${questData.playerName}` : 'na checkpointu'}!
//           </h2>
//           {(status === "active" || status === "locked") && (
//               <div className={`text-4xl font-mono mt-4 font-bold ${status === 'locked' ? 'text-pink' : 'text-purple'}`}>
//                   {formatTime(timeLeft)}
//               </div>
//           )}
//       </div>

//       {message && (
//          <div className={`mb-6 p-3 rounded-2xl text-center border ${
//              messageVariant === 'error' ? 'bg-pink-25 text-purple border-pink-50' : 'bg-purple-25 text-purple border-purple-50'
//          }`}>
//             {message}
//          </div>
//       )}

//       {(status === "ready" || status === "loading") && (
//         <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
//            <input
//              type="text" value={password} onChange={(e) => setPassword(e.target.value)}
//              placeholder="Tvé heslo"
//              className="w-full p-4 bg-white text-gray-dark rounded-2xl border-2 border-pink-50 text-center text-lg focus:border-pink outline-none"
//              disabled={status === "loading"}
//              minLength={3}
//              maxLength={40}
//              required
//            />
//            <button type="submit" disabled={status === "loading"} className="w-full bg-purple py-4 rounded-2xl font-bold text-white hover:bg-purple-75 disabled:opacity-50 transition-all">
//              {status === "loading" ? "Ověřuji..." : "Vstoupit"}
//            </button>
//         </form>
//       )}

//       {status === "active" && questData && (
//         <div className="flex flex-col gap-6 animate-in fade-in">
//            <div className="bg-background p-6 rounded-2xl border-2 border-pink-50">
//               <h4 className="text-pink font-bold mb-2 border-b border-pink-50 pb-2">{questData.title}</h4>
//               <p className="text-gray-dark text-lg">{questData.description}</p>
//            </div>
           
//            <button 
//              onClick={handleCompleteTask}
//              className="w-full bg-pink hover:bg-pink-75 text-purple font-bold py-4 rounded-2xl transform active:scale-95 transition-all"
//            >
//              ÚKOL SPLNĚN!
//            </button>
//         </div>
//       )}

//       {showConfirmComplete && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
//           {/* Potvrzeni v game stylu zabrani omylu a nerusi UX. */}
//           <div className="w-full max-w-sm rounded-3xl border-2 border-pink-50 bg-white p-6 text-center shadow-lg">
//             <h4 className="text-xl font-bold text-purple">Opravdu splnit úkol?</h4>
//             <p className="mt-2 text-gray-dark">Tuto akci nelze vrátit zpět.</p>
//             <div className="mt-6 flex gap-3">
//               <button
//                 onClick={() => setShowConfirmComplete(false)}
//                 className="flex-1 rounded-2xl border-2 border-pink-50 bg-white py-3 font-bold text-purple hover:bg-pink-25 transition-all"
//               >
//                 Zrušit
//               </button>
//               <button
//                 onClick={handleConfirmCompleteTask}
//                 className="flex-1 rounded-2xl bg-pink py-3 font-bold text-purple hover:bg-pink-75 transition-all"
//               >
//                 Potvrdit
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {status === "locked" && (
//           <div className="text-center text-gray-dark bg-background p-4 rounded-2xl border-2 border-pink-50">
//               <p className="font-bold text-pink">Máš aktivní trest.</p>
//               <p className="text-sm mt-2">Jsi &quot;zmražen na místě&quot; a musíš zde zůstat, dokud nevyprší časomíra a poté se můžeš pokusit tento checkpoint znovu splnit.</p>
//           </div>
//       )}

//       {status === "completed" && (
//           <div className="text-center py-10 animate-in zoom-in">
//               <h3 className="text-3xl font-bold text-purple mb-4">Checkpoint {locationName}{locationId} splněn!</h3>
//               <p className="text-gray-dark">Tento checkpoint máš úspěšně za sebou.</p>
//           </div>
//       )}

//       {showBackLink && (
//         <div className="mt-6 text-center">
//           <Link
//             href="/game"
//             className="inline-block text-purple hover:text-purple-50 transition-colors font-bold"
//           >
//             Zpět na hru
//           </Link>
//         </div>
//       )}

//     </div>
//   );
// }