import React from 'react';
import Link from 'next/link';

export default function WorkInProgress() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      
      {/* Dekorativní pozadí (stejná mřížka jako na hlavní stránce) */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* Hlavní obsah */}
      <div className="relative z-10 max-w-lg mx-auto">
        
        {/* Ikonka s animací */}
        <div className="text-7xl mb-6 animate-bounce">
          🚧
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Work in Progress
        </h1>

        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
          Tato část aplikace je ještě ve vývoji 
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
}