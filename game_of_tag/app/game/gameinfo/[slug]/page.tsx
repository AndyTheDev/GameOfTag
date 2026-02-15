import React from 'react';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '../../../../src/db'; // Uprav cestu k tvé instanci Drizzle DB
import { players, teams, playerRoles } from '../../../../src/db/schema'; // Uprav cestu
import { parsePlayerIdFromSlug, validateSlug } from '../../../../src/lib/slug'; // Uprav cestu k tvé utilitě
import { InfoCard } from '@/src/components/InfoCard';
import { SectionWrapper } from '@/src/components/SectionWrapper';
import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';
import { Button } from '@/src/components/Button';
import { ContentDivider } from '@/src/components/ContentDivider';

interface PlayerPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params;

  // 1. Získání ID ze slugu
  const playerId = parsePlayerIdFromSlug(slug);
  if (!playerId) {
    notFound();
  }

  // 2. Načtení dat z DB (včetně mapy)
  const [playerData] = await db
    .select({
      idPlayer: players.idPlayer,
      name: players.name,
      pass: players.pass,
      teamName: teams.name,
      mapUrl: teams.map,
      roleName: playerRoles.name,
      life360: teams.life360,
    })
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.idTeam))
    .leftJoin(playerRoles, eq(players.roleId, playerRoles.idPlayerRole))
    .where(eq(players.idPlayer, playerId))
    .limit(1);

  // 3. Kontrola existence hráče a validace slugu
  if (!playerData) {
    notFound();
  }

  const isValid = validateSlug(slug, {
    idPlayer: playerData.idPlayer,
    name: playerData.name,
  });

  if (!isValid) {
    notFound();
  }

  // 4. Renderování
  return (
    // Přidáno bg-light na absolutní obal
    <div className='min-h-screen flex flex-col w-full overflow-x-hidden bg-light'>
      <Header 
        type='basic'
        backgroundColor='light'
      />

      {/* ZDE JE OPRAVA MEZERY: přidáno w-full a bg-light přímo na main */}
      <main className="grow flex flex-col bg-light w-full">
        <SectionWrapper
          height='auto'
          grid='none'
          backgroundColor='light'
        >
          <div className="px-6 py-16 flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center gap-8">
            
            {/* Osobní info: Jméno, Role a Tým pod sebou */}
            <div className="flex flex-col items-center gap-4">
              <h1 className='text-purple text-4xl md:text-5xl font-extrabold'>
                {playerData.name}
              </h1>
                <div className="flex flex-row flex-wrap justify-center items-stretch gap-3">
                {/* Pilulka s rolí */}
                <div className="px-6 py-2.5 rounded-2xl bg-gray-200 shadow-sm border border-purple flex items-center">
                    <span className="text-gray text-sm md:text-base font-bold uppercase tracking-wider">
                    <span className="opacity-75 font-medium mr-1.5">Role:</span> 
                    {playerData.roleName || 'Hráč'}
                    </span>
                </div>
                
                {/* Tým - Tmavé pozadí pro vyniknutí dynamické barvy týmu */}
                <div className="px-6 py-2.5 bg-gray-200 rounded-2xl shadow-sm border border-gray-800 flex items-center">
                    <span className="text-sm md:text-base font-bold uppercase tracking-wider drop-shadow-sm">
                    <span className="font-medium mr-1.5">Tým:</span>
                    <span style={{ color: playerData.teamName || '#ffffff' }}>
                        {playerData.teamName || 'Bez týmu'}
                    </span>
                    </span>
                </div>
                </div>
            </div>

            <ContentDivider 
                style='light'
                text='Užitečné odkazy'
            />

            <div className="mt-2">
                <Button 
                  variant='purple'
                  size='large'
                  text='Skenování checkpointů'
                  route="/game"
                />
              </div>

            {/* Odkaz na mapu */}
            {playerData.mapUrl && (
              <div className="mt-2">
                <Button 
                  variant='purple'
                  size='large'
                  text='Otevřít herní mapu (Mapy.cz)'
                  route={playerData.mapUrl}
                />
              </div>
            )}

            <ContentDivider 
                style='light'
                text='Heslo a kód pro Life360'
            />

            {/* Karty s hesly */}
            <div className="w-full grid md:grid-cols-2 gap-6 text-left">
              <InfoCard
                title="Herní heslo"
                text={playerData.pass}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C700FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                }
                variant="light"
              />

              <InfoCard
                title="Kód pro Life360"
                text={playerData.life360 || 'Není k dispozici'}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C700FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                }
                variant="light"
              />
            </div>

            <ContentDivider 
                style='light'
                text='Telefonní čísla'
            />

            {/* Kontakty na organizátory */}
            <div className="w-full flex flex-col items-center gap-6">
              <p className="text-center text-purple text-m font-bold">
                Kdyby cokoliv, volej a vyřešíme to! Stačí kliknout na kartu.
              </p>
              
                <div className="w-full grid md:grid-cols-2 gap-6 text-left">
                    
                    {/* Andy - Celá karta je klikatelná */}
                    <a 
                    href="tel:+420603966663" 
                    className="block w-full transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                    <InfoCard
                        title="Andy"
                        text="+420 603 966 663"
                        icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C700FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        }
                        variant="light"
                    />
                    </a>
                    
                    {/* Ivo - Celá karta je klikatelná */}
                    <a 
                    href="tel:+420775014602" 
                    className="block w-full transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                    <InfoCard
                        title="Ivo"
                        text="+420 775 014 602"
                        icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C700FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        }
                        variant="light"
                    />
                    </a>

                </div>    
            </div>

          </div>
        </SectionWrapper>
      </main>

      <Footer />
    </div>
  );
}