import React from 'react';
import Link from 'next/link';

import CheckpointForm from "../../../../src/components/CheckpointForm"; // Import komponenty z kroku 1

export default async function CheckpointPage({
  params,
}: {
  params: Promise<{ checkpointId: string }>;
}) {
  // V Next.js 15 je params Promise, musíme počkat
  const { checkpointId } = await params;

  // Dekódujeme ID (prohlížeč může udělat např. "1%20JZQ1")
  const decodedId = decodeURIComponent(checkpointId);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 flex flex-col items-center justify-center">
      {/* Logo nebo nadpis nahoře, jako na obrázku */}
      <div className="absolute top-6 left-6 text-[#00D68F] font-bold text-xl tracking-wide">
        Game of Tag
      </div>

      <div className="text-center mb-8 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#00D68F] mb-4 drop-shadow-lg">
          Checkpoint nalezen!
        </h1>
        <p className="text-slate-400 text-lg">
          Po zadání hesla se ti zobrazí úkol ke splnění v tomto checkpointu. Pokud stránku zavřeš, můžeš se sem kdykoliv vrátit, úkol ti nikam nezmizí.
        </p>
      </div>

      <CheckpointForm initialCode={decodedId} />
    </main>
  );
}

/* type PageProps = {
  params: {
    checkpointId: string;
  };
};

export default async function CheckpointPage(
    {params}: 
    {params: Promise<{ checkpointId: string }>;}
) {
  const { checkpointId } = await params;
  return (
    <>
      <h1>Checkpoint Page</h1>
      <p>Checkpoint ID: {checkpointId}</p>
    </>
  );
} */
/* export default function WorkInProgress() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        
        <div className="text-7xl mb-6 animate-bounce">
          🚧
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Work in Progress
        </h1>

        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
          Herní část aplikace je stále ve vývoji. 
        </p>

        <Link 
          href="/" 
          className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-full border border-slate-700 hover:border-emerald-500 transition-all duration-300"
        >
          Zpět na hlavní stránku
        </Link>

      </div>
      
      <footer className="bg-slate-950 py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Game of Tag. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
} */