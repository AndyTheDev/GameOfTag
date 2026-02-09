"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findNearestCheckpoint } from "@/src/actions/loadLocation";
import { Header } from "@/src/components/Header";
import { Footer } from "@/src/components/Footer";

type LocationState = "idle" | "loading" | "error" | "found" | "not_in_range";

type CheckpointResult = {
  id: number;
  name: string;
  code: string;
  type: number;
  distanceMeters: number;
};

export default function GamePage() {
  const router = useRouter();
  const [state, setState] = useState<LocationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [nearestCheckpoint, setNearestCheckpoint] = useState<CheckpointResult | null>(null);
  const redirectDelayMs = 2000;

  async function handleLoadCheckpoint() {
    setState("loading");
    setErrorMessage("");
    setNearestCheckpoint(null);

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setState("error");
      setErrorMessage("Tvůj prohlížeč nepodporuje geolokaci.");
      return;
    }

    try {
      // Request high-accuracy position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // If accuracy is poor, warn user but continue
      if (accuracy > 50) {
        console.warn(`GPS accuracy is ${accuracy}m - may be imprecise`);
      }

      // Call server action to find nearest checkpoint
      const result = await findNearestCheckpoint(latitude, longitude);

      if (!result.success) {
        setState("error");
        setErrorMessage(result.message || "Chyba při hledání checkpointu.");
        return;
      }

      if (result.withinRadius && result.checkpoint) {
        // Found checkpoint within range - redirect to checkpoint page
        setState("found");
        setNearestCheckpoint(result.checkpoint);
        // Navigate to the checkpoint page after a short delay
        setTimeout(() => {
          router.push(`/game/checkpoint/${result.checkpoint.code}`);
        }, redirectDelayMs);
      } else if (result.checkpoint) {
        // Found checkpoint but not within range
        setState("not_in_range");
        setNearestCheckpoint(result.checkpoint);
      }
    } catch (error) {
      setState("error");
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage("Přístup k poloze byl zamítnut. Povol přístup k GPS v nastavení prohlížeče.");
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMessage("Informace o poloze není dostupná.");
            break;
          case error.TIMEOUT:
            setErrorMessage("Vypršel čas pro získání polohy. Zkus to znovu.");
            break;
          default:
            setErrorMessage("Nepodařilo se získat polohu.");
        }
      } else {
        setErrorMessage("Nepodařilo se získat polohu.");
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
              Ověř svou polohu a checkpoint se načte automaticky
            </p>
          </div>

          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border-2 border-pink-50">
            {state === "idle" && (
              <button
                onClick={handleLoadCheckpoint}
                className="w-full bg-purple text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-purple-75 transition-all transform hover:scale-105 active:scale-95"
              >
                Načíst checkpoint
              </button>
            )}

            {state === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-pink border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-dark text-lg">Hledám tvoji polohu...</p>
                <p className="text-gray-light text-sm">
                  Ujisti se, že máš zapnutou GPS
                </p>
              </div>
            )}

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
                    Přibliž se na méně než 20 metrů od checkpointu
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
                  <p className="text-gray-dark">{errorMessage}</p>
                </div>

                <button
                  onClick={handleLoadCheckpoint}
                  className="w-full bg-pink text-purple py-3 px-6 rounded-2xl font-bold hover:bg-pink-75 transition-all"
                >
                  Zkusit znovu
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
