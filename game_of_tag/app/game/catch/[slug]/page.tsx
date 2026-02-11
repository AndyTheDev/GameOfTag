// VERZE 2 --- ZOBRAZENÍ JMÉNA HRÁČE
import React from 'react';
import { notFound } from 'next/navigation';
import { SectionWrapper } from '@/src/components/SectionWrapper';
import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';
import { getRunnerBySlug } from '@/src/lib/getRunner'; // Naše nová funkce
import { CatchForm } from '@/src/components/CatchForm'; // Náš nový formulář

// ZMĚNA 1: Typ pro params musí být Promise
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CatchPage({ params }: PageProps) {
  // ZMĚNA 2: Musíme počkat na params, než vytáhneme slug
  const { slug } = await params;
  
  // Teď už slug string a můžeme ho poslat dál
  const runner = await getRunnerBySlug(slug);

  if (!runner) {
    return notFound(); 
  }

  return (
    <div className='relative w-full overflow-x-hidden bg-light-gray min-h-screen'>
      <Header type='basic' backgroundColor='light' />

      <SectionWrapper height='auto' grid='none' backgroundColor='light'>
        {/* Pozadí */}
        <div className="absolute pointer-events-none overflow-hidden top-[-40] left-[-100] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
        
        <div className="px-6 pt-24 pb-12 w-full flex flex-col items-center gap-8 relative z-10">
          
          {/* Nadpis s dynamickými daty z DB */}
          <div className="text-center max-w-2xl flex flex-col gap-2">
            <h2 className="text-purple">Chycení běžce</h2>
            
            <div className="mt-2 p-6 bg-white rounded-2xl w-md shadow-sm border border-white-light">
              <p className="text-dark-gray text-sm uppercase tracking-widest mb-1">Našel jsi hráče</p>
              <h3 className="text-pink text-4xl font-bold mb-2">{runner.name}</h3>
              {runner.teamName && (
                <div className="inline-block px-4 py-1 rounded-full bg-purple/10">
                  <p className="text-purple font-semibold text-sm">Tým: {runner.teamName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vložení klientského formuláře */}
          <CatchForm slug={slug} />

        </div>
      </SectionWrapper>

      <Footer />
    </div>
  );
}