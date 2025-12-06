import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      
      {/* 1. Navigace / Hlavička */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold tracking-wider text-emerald-400">
          Game of Tag
        </h1>
        {/* <nav>
           Zatím jen odkaz na sekci, později třeba Login 
          <Link href="#about" className="hover:text-emerald-400 transition-colors">
            O hře
          </Link>
        </nav> */}
      </header>

      <main>

        <section className="flex flex-col items-center justify-center text-center py-20 px-4">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-4xl border border-slate-700">
            
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-500 text-transparent bg-clip-text">
              Proměň Prahu ve své hřiště.
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Je to závod? Je to Hra?
              Ponoř se do akce, který posune tvé hranice. 
              Připravujeme pro tebe zážitek, na který jen tak nezapomeneš.
              <br />
              První hra už <b>v Neděli 14.12.2025 od 9:30!</b>
            </p>
            
            {/* Call to Action btn */}
            <Link 
            href="https://docs.google.com/forms/d/e/1FAIpQLSd3J5TL_2sHYoMdVdToPg98MQOcvexek6t2vMRwufwkwU-cKw/viewform" 
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105"
            >
            Chci se účastnit!
            </Link>
          </div>
        </section>

        {/* 3. Sekce O hře */}
        <section id="about" className="py-16 bg-slate-800">
          <div className="max-w-5xl mx-auto px-4">
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p className="text-3xl font-semibold text-emerald-400 align-middle text-center">
                  V Game of Tag spolu soupeří tři týmy o to, který z nich probehně Prahou jako první dříve, než ho chytí lovci.
                </p>

              
              {/* Placeholder pro screenshot ze hry - možná doplníme po prvním testu
              <div className="aspect-video bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
                <span className="text-slate-500">
                    Nějakej náhled instagramu? Nebo pros
                </span>
              </div>
              */}
            </div>
          </div>
        </section>

        <section className="py-20 max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-12 text-center">Hlavní prvky hry</h3>
          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 transition-colors">
              <div className="text-emerald-400 text-4xl mb-4">🌍</div>
              <h4 className="text-xl font-bold mb-2">Opravdový Open-world gameplay!</h4>
              <p className="text-slate-400">Zde nejsi omezen pouze na pár tahů a políček, jako v deskové hře - tady hraješ po celé Praze!</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 transition-colors">
              <div className="text-emerald-400 text-4xl mb-4">🎲</div>
              <h4 className="text-xl font-bold mb-2">Dynamické herní role.</h4>
              <p className="text-slate-400">Můžeš být lovec, který se snaží chytit běžce. Po chycení se ale role mění - ty se tak můžeš stát běžcem a pokusit se získat pro svůj tým vítězné body!</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 transition-colors">
              <div className="text-emerald-400 text-4xl mb-4">🤝</div>
              <h4 className="text-xl font-bold mb-2">Multiplayer - ale trochu jinak!</h4>
              <p className="text-slate-400">Hra probíhá ve skupince tří lidí, ve které ty jediný zastupuješ svůj tým. To ale neznamená, že se nevyplatí s nimi spolupracovat...</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center justify-center text-center py-20 px-4 max-w-5xl mx-auto">
            <h3 className="text-3xl font-bold mb-8 text-center border-slate-700 pb-4">
                Herní role
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700/50 shadow-xl hover:border-emerald-500/50 transition-all duration-300 group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                🕵️‍♂️
              </div>
              <h4 className="text-2xl font-bold text-emerald-400 mb-4">
                Lovec
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Tvojí misí je chytit běžce, který má náskok 10 minut. Ty máš ale výhodu - <b>vidíš jeho polohu</b> a <b>můžeš bez omezení používat MHD</b>! Vždy ale lovíš ve společnosti druhého lovce ze své skupiny, <b>nemůžeš lovit běžce sám</b>.
              </p>
            </div>

            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700/50 shadow-xl hover:border-blue-500/50 transition-all duration-300 group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                🏃‍♂️
              </div>
              <h4 className="text-2xl font-bold text-blue-400 mb-4">
                Běžec
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Tvojí misí je <b>uniknout lovcům</b> a <b>získat pro svůj tým vítězné body</b>. Máš náskok, ale nevíš, kde se lovci nacházejí. Zároveň máš omezené množství MHD jízdenek, takže musíš pečlivě plánovat svou trasu. Plněním checkpointů se ti zpřístupňuji další, blíže cíli, a zároveň získáváš body pro svůj tým.
              </p>
            </div>

          </div>
        </section>

        <section className="relative py-24 overflow-hidden bg-slate-950">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-slate-950 to-slate-950 z-0 pointer-events-none" />
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
          </div>
          <div className="relative z-10 max-w-6xl mx-auto px-4">
            
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-6 drop-shadow-sm">
                Cesta k vítězství
              </h3>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                Nestačí jen rychle běhat nebo cyhtře využívat MHD. Musíš chytře střídat role, spolupracovat jako lovec nebo také plnit úkoly jako běžec.
                Vítězí ten, kdo ovládne chaos.
              </p>
            </div>

            <div className="flex flex-col gap-12 relative items-center max-w-3xl mx-auto">
              

              <div className="absolute top-0 bottom-0 left-1/2 w-1 -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent z-0" />
              <div className="relative z-10 w-full bg-slate-900/80 backdrop-blur-sm p-8 rounded-xl border border-slate-700 text-center shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border-2 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  🕵️‍♀️
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Chytni běžce</h4>
                <p className="text-slate-400 leading-relaxed">
                  Jako lovec body nezískáváš. Tvým  úkolem je co nejrychleji spolu s druhým lovcem
                  třetího hráče skupiny, <b>běžce</b>, aby jeho tým nezískal body. Jen díky tomu se mohou role ve skupině měnit. 
                </p>
              </div>

              <div className="relative z-10 w-full bg-slate-900/90 backdrop-blur-md p-10 rounded-2xl border-2 border-amber-500/50 text-center shadow-[0_0_30px_rgba(245,158,11,0.15)] transform md:scale-105 hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Hlavní cíl
                </div>
                
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-slate-900 shadow-lg">
                  💎
                </div>
                <h4 className="text-2xl font-bold text-amber-400 mb-3">Staň se běžcem a sbírej body</h4>
                <p className="text-slate-300 leading-relaxed font-medium">
                  Tohle je tvá chvíle! Jakmile se staneš běžcem, máš možnost sbírat body pro svůj tým.
                  Dostaň se na checkpoint, splň úkol a získej tak body a cestu k dalšímu checkpointu nebo cíli. Čím více checkpointů splníš, tím více bodů!
                </p>
              </div>

            </div>
            
            <div className="mt-16 text-center">
              <div className="inline-block bg-slate-800/50 backdrop-blur rounded-full px-8 py-3 border border-slate-700 text-slate-300 hover:border-amber-500/30 transition-colors cursor-default">
                🏁 Hra končí po uplynutí časového limitu <b>3 hodiny</b>. <span className="text-amber-400 font-bold">Tým s nejvíce body vyhrává.</span>
              </div>
            </div>

          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Game of Tag. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}