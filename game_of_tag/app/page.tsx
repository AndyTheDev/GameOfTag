import React from 'react';
import Link from 'next/link';
import logo from "../src/assets/logo.png";
import logo_background from "../src/assets/logo_background.png";
import { InfoCard } from '@/src/components/InfoCard';
import { SectionWrapper } from '@/src/components/SectionWrapper';
import { HeroCard } from '@/src/components/HeroCard';
import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';
import { ContentDivider } from '@/src/components/ContentDivider';
import { Button } from '@/src/components/Button';

export default function Home() {
  return (
    <div className='relative w-full overflow-hidden'>
      <Header
        type='basic'
        backgroundColor='light'
      />

      <SectionWrapper
        height='auto'
        grid='none'
        backgroundColor='light'
      >
        {/* Halo efekty */}
        <div className="absolute pointer-events-none overflow-hidden top-[-40] left-[-100] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="absolute pointer-events-none overflow-hidden top-350 right-20 w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="absolute pointer-events-none overflow-hidden top-80 right-[-40] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,#8A00FF_25%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="absolute pointer-events-none overflow-hidden top-600 left-[-10] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,#8A00FF_25%,rgba(255,54,184,0)_70%)] blur-3xl" />

        <div className="px-6 pt-16 inline-flex flex-col justify-start items-center">
          <div className="pb-6 flex flex-col justify-start items-start">
            <div className="px-4 py-1 bg-purple-75 rounded-2xl inline-flex justify-start items-center gap-2">
              <div className="inline-flex flex-col justify-start items-center">
                <p className='text-white text-sm'>Další kolo už ve <b>čtvrtek 11.6.2026 večer!</b></p>
              </div>
            </div>
          </div>

          <div className="max-w-[800px] pb-6 flex flex-col justify-start items-start">
            <div className="w-full h-32 max-w-[800px] flex flex-col justify-start items-center">
              <div className="text-center justify-center">
                <h1 className='text-purple'>Proměň Prahu ve své <span className="text-pink">hřiště</span></h1>
              </div>
            </div>
          </div>

          <div className="max-w-[580px] mt-6 pt-4 pb-10 flex flex-col justify-start items-start">
            <div className="max-w-[580px] px-5 flex flex-col justify-start items-center">
              <p className='text-center justify-center text-dark-gray text-lg'>Sestav tým a přijď si zahrát hru, která propojuje strategii, sport a spolupráci do komplexního eventu plného adrenalinu a zážitků!</p>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center">
            <Button
              variant='purple'
              size='large'
              text='Chci se účastnit!'
              route='https://forms.gle/Eja8nuwLJxpHP6yf6'
            />
          </div>
        </div>
      </SectionWrapper>


      <SectionWrapper
        height='auto'
        grid='none'
        backgroundColor='light'
      >
        <div className="self-stretch mt-20 h-48 px-10 inline-flex flex-col justify-start items-start">
          <div className="w-full px-6 pt-7 pb-3.5 flex flex-col justify-start items-start gap-6">
            <div className="self-stretch flex flex-col justify-start items-center">
              <h3 className="text-center justify-center text-purple">“V Game of Tag spolu týmy soupeří o to, který z nich probehně Prahou jako první dříve, než mu v tom zabrání lovci.”</h3>
            </div>
            <div className="self-stretch h-4" />
          </div>
        </div>

      </SectionWrapper>

      <SectionWrapper
        height='auto'
        grid='none'
        backgroundColor='light'
      >
        <div className="">
          <div className="flex flex-col justify-start items-start gap-12">
            <div className="self-stretch flex flex-col justify-start items-start gap-3">
              <div className="self-stretch flex flex-col justify-start items-start">
                <h6 className="justify-center text-pink">Co zažiješ</h6>
              </div>
              <div className="self-stretch flex flex-col justify-start items-start">
                <h3 className="justify-center text-purple">Pohyb, akce, výzvy.</h3>
              </div>
              <div className="self-stretch flex flex-col justify-start items-start">
                <p className="justify-center text-dark-gray">Game of Tag je městská hra, která kombinuje běh, strategii a výzvy všelijakého druhu.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-8">


              <InfoCard
                title="Open-world gameplay"
                text="Zažij město jako velkou herní plochu, kde tvé možnosti jsou neomezené."
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path fill="#C700FF" d="M12 3a7 7 0 0 0-7 7c0 2.862 1.782 5.623 3.738 7.762A26.158 26.158 0 0 0 12 20.758a26.14 26.14 0 0 0 3.262-2.994C17.218 15.623 19 12.863 19 10a7 7 0 0 0-7-7Zm0 20.214l-.567-.39l-.003-.002l-.006-.005l-.02-.014l-.075-.053a25.34 25.34 0 0 1-1.214-.94a28.157 28.157 0 0 1-2.853-2.698C5.218 16.876 3 13.637 3 10a9 9 0 0 1 18 0c0 3.637-2.218 6.877-4.262 9.112a28.145 28.145 0 0 1-3.796 3.44a16.794 16.794 0 0 1-.345.251l-.021.014l-.006.005l-.002.001l-.568.39ZM12 8a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm-4 2a4 4 0 1 1 8 0a4 4 0 0 1-8 0Z" />
                  </svg>
                }
                variant="light"
              />

              <InfoCard
                title="Dynamické herní role"
                text="Máš možnost si zahrát  jako běžec, ale také jako lovec."
                icon={
                  <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15">
                    <path fill="#C700FF" d="M5 8.9c1.44 0 2.68.252 3.575.855C9.502 10.38 10 11.343 10 12.6a.501.501 0 0 1-1 0c0-.958-.358-1.596-.983-2.017C7.359 10.141 6.35 9.9 5 9.9s-2.36.241-3.017.684C1.358 11.005 1 11.643 1 12.601a.501.501 0 0 1-1 0c0-1.258.497-2.221 1.424-2.846C2.319 9.152 3.56 8.9 5 8.9m4.975 0c1.439 0 2.68.252 3.575.855c.927.625 1.425 1.588 1.425 2.846a.5.5 0 0 1-1 0c0-.958-.358-1.596-.984-2.017c-.518-.349-1.253-.57-2.202-.65a4.5 4.5 0 0 0-.87-1.033zM5 1.85a3.151 3.151 0 0 1 0 6.3a3.15 3.15 0 1 1 0-6.3m4.975 0a3.15 3.15 0 0 1 0 6.3c-.524 0-1.016-.13-1.45-.356a4.5 4.5 0 0 0 .534-.852a2.15 2.15 0 1 0 0-3.887a4.5 4.5 0 0 0-.535-.85a3.1 3.1 0 0 1 1.45-.355M5 2.85a2.151 2.151 0 0 0 0 4.3a2.15 2.15 0 0 0 0-4.3" />
                  </svg>
                }
                variant="light"
              />

              <InfoCard
                title="Výzvy na trase"
                text="Čekají tě úkoly, kterými získáváš body pro svůj tým a překonáváš své hranice."
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
                    <path fill="#C700FF" d="M9.5 6.5L10 0H9L2 9.5h4.5L6 16h1l7-9.5z" />
                  </svg>
                }
                variant="light"
              />

              <InfoCard
                title="Noví lidé"
                text="Seznam se s dalšími hráči, kteří milují pohyb a adrenalin."
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#C700FF">
                    <g fill="none" stroke="#C700FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                      <path d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572" />
                      <path d="M12 6L8.707 9.293a1 1 0 0 0 0 1.414l.543.543c.69.69 1.81.69 2.5 0l1-1a3.182 3.182 0 0 1 4.5 0l2.25 2.25m-7 3l2 2M15 13l2 2" />
                    </g>
                  </svg>
                }
                variant="light"
              />
            </div>
          </div>
        </div>

      </SectionWrapper>

      <SectionWrapper
        height='auto'
        grid='none'
        backgroundColor='light'
      >

        <div className="flex flex-col items-center gap-8 bg-purple rounded-3xl p-12">
          <div className='mr-auto px-2'>
            <h6 className="text-pink">Jak to Celé funguje</h6>
            <h3 className="text-white">Jednoduchá pravidla, velkolepý zážitek.</h3>
            <p className="text-white-light text-base font-normal leading-6">Pravidla? To je hračka, každý přece jako malý hrál na babu.</p>
          </div>

          <div className='grid md:grid-cols-2 gap-8 md:p-2 '>
            <InfoCard
              title="Rozdělení do týmu"
              text="Jako hráč jsi členem jednoho týmu, pro který sbíráš body. V týmu si rozdělíte role na lovce a běžce podle vymyšlené strategie. Tuto roli si můžeš během hry změnit!"
              icon={<h4 className='text-pink'>1</h4>}
              variant="dark"
            />

            <InfoCard
              title="Hromadný start běžců"
              text="Jako první startují hráči v roli běžce. Po uplynutí 5 minut startují zbylí hráči, lovci, a vyrážejí chytat běžce."
              icon={<h4 className='text-pink'>2</h4>}
              variant="dark"
            />

            <InfoCard
              title="Zisk bodů pro tým"
              text="V roli běžce musíš procházet checkpointy, kde plníš ve 2 až 5 lidech časově omezené úkoly. Při nesplnění musíte všichni 5 minut čekat, než se pokusíte splnit úkol znova nebo poběžíte na jiný checkpoint."
              icon={<h4 className='text-pink'>3</h4>}
              variant="dark"
            />

            <InfoCard
              title="Lovci a jejich role"
              text="Jako lovec máš za úkol chytat běžce ostatních týmů a zabránit jim tak ve sběru bodů pro jejich týmy. Vidíš polohu všech běžců na mapě a můžeš si tak vybrat, koho lovíš. Každého běžce ale můžeš chytit pouze jednou!"
              icon={<h4 className='text-pink'>4</h4>}
              variant="dark"
            />

            <InfoCard
              title="Chytání běžců"
              text="Běžce chytíš tím, že se ho dotkneš, nebo ho zřetelně vyfotíš. Tím také získáš bod pro svůj tým! Oba poté můžete pokračovat ve hře, ale běžec nesmí 10 minut plnit žádné úkoly."
              icon={<h4 className='text-pink'>5</h4>}
              variant="dark"
            />

            <InfoCard
              title="Vítězství...?"
              text="Vítězí tým, který nasbírá nejvíce bodů během celé hry, která trvá 2 hodiny."
              icon={<h4 className='text-pink'>6</h4>}
              variant="dark"
            />
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper
        height='auto'
        grid='none'
        backgroundColor='gradient'
      >
        <div className="inline-flex flex-col justify-start items-start">
          <div className="w-full flex flex-col justify-start items-center gap-6">
            <h3 className="text-center justify-center text-white">Přidej se k třetímu kolu Game of Tag!</h3>
            <Button
              variant='white'
              size='large'
              text='Chci se účastnit!'
              route='https://forms.gle/Eja8nuwLJxpHP6yf6'
            />
          </div>
        </div>
      </SectionWrapper>

      <Footer />
    </div>
  );
}