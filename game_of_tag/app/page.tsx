import React from 'react';
import Link from 'next/link';
import logo from "../src/assets/logo.png";
import logo_background from "../src/assets/logo_background.png";
import {InfoCard} from '@/src/components/InfoCard';
import {SectionWrapper} from '@/src/components/SectionWrapper';
import { HeroCard } from '@/src/components/HeroCard';
import {Header} from '@/src/components/Header';
import {Footer} from '@/src/components/Footer';
import {ContentDivider} from '@/src/components/ContentDivider';
import { Button } from '@/src/components/Button';

export default function Home() {
  return (
    <div>
      <Header 
          type='basic'
          backgroundColor='light'
      />

      <SectionWrapper
        height='auto'
        grid='none'
        backgroundColor='light'
      >
        <div className="absolute top-[-40] left-[-100] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="absolute top-350 right-20 w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,var(--color-pink)_0%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="absolute top-80 right-[-40] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,#8A00FF_25%,rgba(255,54,184,0)_70%)] blur-3xl" />
                <div className="absolute top-600 left-[-10] w-4xl h-[768px] opacity-20 bg-[radial-gradient(ellipse_70.71%_70.71%_at_50.00%_50.00%,#8A00FF_25%,rgba(255,54,184,0)_70%)] blur-3xl" />
        <div className="px-6 pt-16 inline-flex flex-col justify-start items-center">
          <div className="pb-6 flex flex-col justify-start items-start">
            <div className="px-4 py-1 bg-purple-75 rounded-2xl inline-flex justify-start items-center gap-2">
              <div className="inline-flex flex-col justify-start items-center">
                <p className='text-white text-sm'>Další kolo už <b>15.2.2026</b>, přihlašování bude brzy spuštěno!</p>
              </div>
            </div>
          </div>

          <div className="max-w-[800px] pb-6 flex flex-col justify-start items-start">
            <div className="w-[400px] h-32 max-w-[800px] flex flex-col justify-start items-center">
              <div className="text-center justify-center">
                <h1 className='text-purple'>Proměň Prahu ve své <span className="text-pink">hřiště</span></h1>
              </div>
            </div>
          </div>

          <div className="max-w-[580px] mt-6 pt-4 pb-10 flex flex-col justify-start items-start">
            <div className="max-w-[580px] px-5 flex flex-col justify-start items-center">
                <p className='text-center justify-center text-dark-gray text-lg'>Přijď si zahrát hru, která propojuje strategii, sport a spolupráci do komplexního eventu plného adrenalinu a zážitků.</p>
            </div>
          </div>

          {/*<div className="flex flex-col justify-center items-center">
              <Button 
              variant='purple'
              size='large'
              text='Chci se účastnit!'
              route=''
            /> 
          </div>*/}
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
              <h3 className="text-center justify-center text-purple">“V Game of Tag spolu soupeří tři týmy o to, který z nich probehně Prahou jako první dříve, než ho chytí lovci.”</h3>
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
                        <path fill="#C700FF" d="M12 3a7 7 0 0 0-7 7c0 2.862 1.782 5.623 3.738 7.762A26.158 26.158 0 0 0 12 20.758a26.14 26.14 0 0 0 3.262-2.994C17.218 15.623 19 12.863 19 10a7 7 0 0 0-7-7Zm0 20.214l-.567-.39l-.003-.002l-.006-.005l-.02-.014l-.075-.053a25.34 25.34 0 0 1-1.214-.94a28.157 28.157 0 0 1-2.853-2.698C5.218 16.876 3 13.637 3 10a9 9 0 0 1 18 0c0 3.637-2.218 6.877-4.262 9.112a28.145 28.145 0 0 1-3.796 3.44a16.794 16.794 0 0 1-.345.251l-.021.014l-.006.005l-.002.001l-.568.39ZM12 8a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm-4 2a4 4 0 1 1 8 0a4 4 0 0 1-8 0Z"/>
                      </svg>
                    }
                    variant="light"
                  />
                  
                  <InfoCard
                    title="Dynamické herní role"
                    text="Máš možnost si zahrát  jako běžec, ale také jako lovec."
                    icon={
                      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15">
                        <path fill="#C700FF" d="M5 8.9c1.44 0 2.68.252 3.575.855C9.502 10.38 10 11.343 10 12.6a.501.501 0 0 1-1 0c0-.958-.358-1.596-.983-2.017C7.359 10.141 6.35 9.9 5 9.9s-2.36.241-3.017.684C1.358 11.005 1 11.643 1 12.601a.501.501 0 0 1-1 0c0-1.258.497-2.221 1.424-2.846C2.319 9.152 3.56 8.9 5 8.9m4.975 0c1.439 0 2.68.252 3.575.855c.927.625 1.425 1.588 1.425 2.846a.5.5 0 0 1-1 0c0-.958-.358-1.596-.984-2.017c-.518-.349-1.253-.57-2.202-.65a4.5 4.5 0 0 0-.87-1.033zM5 1.85a3.151 3.151 0 0 1 0 6.3a3.15 3.15 0 1 1 0-6.3m4.975 0a3.15 3.15 0 0 1 0 6.3c-.524 0-1.016-.13-1.45-.356a4.5 4.5 0 0 0 .534-.852a2.15 2.15 0 1 0 0-3.887a4.5 4.5 0 0 0-.535-.85a3.1 3.1 0 0 1 1.45-.355M5 2.85a2.151 2.151 0 0 0 0 4.3a2.15 2.15 0 0 0 0-4.3"/>
                      </svg>
                    }
                    variant="light"
                  />
                  
                  <InfoCard
                    title="Výzvy na trase"
                    text="Čekají tě úkoly, kterými získáváš body pro svůj tým a překonáváš své hranice."
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
                        <path fill="#C700FF" d="M9.5 6.5L10 0H9L2 9.5h4.5L6 16h1l7-9.5z"/>
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
                          <path d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"/>
                          <path d="M12 6L8.707 9.293a1 1 0 0 0 0 1.414l.543.543c.69.69 1.81.69 2.5 0l1-1a3.182 3.182 0 0 1 4.5 0l2.25 2.25m-7 3l2 2M15 13l2 2"/>
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

          <div className="flex flex-col items-center gap-16 bg-purple rounded-3xl p-12">
              <div className='mr-auto px-10'>
                  <h6 className="text-pink">Jak to Celé funguje</h6>
                  <h3 className="text-white">Jednoduchá pravidla, velkolepý zážitek.</h3>
                  <p className="text-white-light text-base font-normal leading-6">Pravidla? To je hračka, každý přece jako malý hrál na babu.</p>
              </div>

              <div className='grid md:grid-cols-2 gap-8 mx-10'>
                  <InfoCard
                    title="Rozdělení do týmu"
                    text="Budete rozdělení do tří týmů, pro které sbíráte body. Ve hře se ale pohybujete v trojicích, kdy každý z trojice je z jiného týmu."
                    icon={<h4 className='text-pink'>1</h4>}
                    variant="dark"
                  />

                  <InfoCard
                    title="Hromadný start běžců"
                    text="Jako první startuje hráč v roli běžce s náskokem 10 minut. Po této době startují zbylí hráči z trojice, lovci."
                    icon={<h4 className='text-pink'>2</h4>}
                    variant="dark"
                  />

                  <InfoCard
                    title="Zisk bodů pro tým"
                    text="V roli běžce musíte postupně projít checkpointy na své trase, ve kterých plníte časově omezené úkoly. Při nesplnění musí běžec 5 minut čekat, než se pokusí splnit úkol znova."
                    icon={<h4 className='text-pink'>3</h4>}
                    variant="dark"
                  />

                  <InfoCard
                    title="Lovci a jejich výhody"
                    text="Lovci musí společně chytit běžce a zabránit mu tak ve sběru bodů pro jeho tým. Vidí polohu běžce na mapě a mohou se pohybovat veřejnou dopravou, jak se jim zlíbí!"
                    icon={<h4 className='text-pink'>4</h4>}
                    variant="dark"
                  />

                  <InfoCard
                    title="Chycení běžce a výměna rolí"
                    text="Lovci se snaží chytit běžce tím, že se ho dotknou, nebo ho zřetelně vyfotí. Poté se podle stanoveného pořadí stává jeden z lovců běžcem a vyráží, opět s náskokem 10 minut."
                    icon={<h4 className='text-pink'>5</h4>}
                    variant="dark"
                  />

                  <InfoCard
                    title="Vítězství...?"
                    text="Vítězí tým, který nasbírá nejvíce bodů během celé hry, která trvá 3 hodiny."
                    icon={<h4 className='text-pink'>6</h4>}
                    variant="dark"
                  />
              </div>
              <h5 className='text-center text-white-light mx-10'>Aktuálně pracujeme na vylepšeném konceptu hry. Budete o něm včas informováni!</h5>
          </div>
      </SectionWrapper>

      <SectionWrapper
        height='auto'
        grid='none'
        backgroundColor='gradient'
      >
        <div className="inline-flex flex-col justify-start items-start">
          <div className="w-full flex flex-col justify-start items-center gap-6">
            <h3 className="text-center justify-center text-white">Přidej se k druhému kolu Game of Tag!</h3>
            <p className='text-center text-white font-bold'>Přihlašování bude brzy spuštěno.</p>
            {/* <Button 
              variant='white'
              size='large'
              text='Chci se účastnit!'
              route=''
            /> */}
          </div>
        </div>
      </SectionWrapper>

      <Footer />
    </div>








    // <div className="self-stretch inline-flex justify-center items-start gap-10">
    //               <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start">
    //                   <div className="self-stretch opacity-60 flex flex-col justify-start items-start">
    //                       <h3 className="justify-center text-pink">1</h3>
    //                   </div>
    //                   <div className="self-stretch flex-1 px-8 pt-12 bg-gray-dark rounded-3xl outline outline-offset-1px outline-white/10 backdrop-blur-[5px] flex flex-col justify-start items-start gap-4">
    //                       <div className="w-72 flex flex-col justify-start items-start">
    //                           <h5 className="justify-center text-white text-lg font-bold">Rozdělení do týmů</h5>
    //                       </div>
    //                       <div className="w-72 opacity-70 flex flex-col justify-start items-start">
    //                           <p className="self-stretch justify-center text-white text-sm font-normal leading-6">Budete rozdělení do tří týmů, pro které sbíráte body. Ve hře se ale pohybujete v trojicích, kdy každý z trojice je z jiného týmu.</p>
    //                       </div>
    //                   </div>
    //               </div>

    //               <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start">
    //                   <div className="self-stretch opacity-60 flex flex-col justify-start items-start">
    //                       <div className="w-10 justify-center text-pink text-7xl font-extrabold leading-16">2</div>
    //                   </div>
    //                   <div className="self-stretch flex-1 px-8 pt-12 pb-24 bg-gray-dark rounded-3xl outline outline-offset-1px outline-white/10 backdrop-blur-[5px] flex flex-col justify-start items-start gap-4">
    //                       <div className="w-72 flex flex-col justify-start items-start">
    //                           <div className="w-52 justify-center text-white text-lg font-bold">Hromadný start běžců</div>
    //                       </div>
    //                       <div className="w-72 opacity-70 flex flex-col justify-start items-start">
    //                           <div className="self-stretch justify-center"><span class="text-white text-sm font-normal leading-6">Jako první startuje z trojice hráč v roli </span><span class="text-white text-sm font-bold leading-6">běžce </span><span class="text-white text-sm font-normal leading-6">s náskokem 10 minut. Po této době startují zbylí hráči, </span><span class="text-white text-sm font-bold leading-6">lovci.</span></div>
    //                       </div>
    //                   </div>
    //               </div>

    //               <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start">
    //                   <div className="self-stretch opacity-60 flex flex-col justify-start items-start">
    //                       <div className="w-11 justify-center text-pink text-7xl font-extrabold leading-16">3</div>
    //                   </div>
    //                   <div className="self-stretch flex-1 px-8 pt-12 pb-24 bg-gray-dark rounded-3xl outline outline-offset-1px outline-white/10 backdrop-blur-[5px] flex flex-col justify-start items-start gap-4">
    //                       <div className="w-72 flex flex-col justify-start items-start">
    //                           <div className="w-56 justify-center text-white text-lg font-bold">Zisk bodů pro tým</div>
    //                       </div>
    //                       <div className="w-72 opacity-70 flex flex-col justify-start items-start">
    //                           <div className="self-stretch justify-center"><span class="text-white text-sm font-normal leading-6">V roli běžce musíte postupně projít checkpointy na své trase, ve kterých plníte časově omezený úkol. Při nesplnění musí běžec </span><span class="text-white text-sm font-bold leading-6">5 minut </span><span class="text-white text-sm font-normal leading-6">čekat, než se pokusí splnit úkol znova.</span></div>
    //                       </div>
    //                   </div>
    //               </div>
                  
    //           </div>
    //           <div className="self-stretch inline-flex justify-center items-start gap-10">
    //               <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start">
    //                   <div className="self-stretch opacity-60 flex flex-col justify-start items-start">
    //                       <div className="w-7 justify-center text-pink text-7xl font-extrabold leading-16">4</div>
    //                   </div>
    //                   <div className="self-stretch flex-1 px-8 pt-12 pb-24 bg-gray-dark rounded-3xl outline outline-offset-1px outline-white/10 backdrop-blur-[5px] flex flex-col justify-start items-start gap-4">
    //                       <div className="w-72 flex flex-col justify-start items-start">
    //                           <div className="self-stretch justify-center text-white text-lg font-bold">Lovci a jejich výhody</div>
    //                       </div>
    //                       <div className="w-72 opacity-70 flex flex-col justify-start items-start">
    //                           <div className="self-stretch justify-center"><span class="text-white text-sm font-normal leading-6">Lovci musí společně chytit běžce a zabránit mu tak ve sběru bodů pro jeho tým. Vidí </span><span class="text-white text-sm font-bold leading-6">polohu běžce na mapě</span><span class="text-white text-sm font-normal leading-6"> a mohou se pohybovat veřejnou dopravou, jak se jim zlíbí!</span></div>
    //                       </div>
    //                   </div>
    //               </div>
    //               <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start">
    //                   <div className="self-stretch opacity-60 flex flex-col justify-start items-start">
    //                       <div className="w-10 justify-center text-pink text-7xl font-extrabold leading-16">5</div>
    //                   </div>
    //                   <div className="self-stretch flex-1 px-8 pt-12 pb-24 bg-gray-dark rounded-3xl outline outline-offset-1px outline-white/10 backdrop-blur-[5px] flex flex-col justify-start items-start gap-4">
    //                       <div className="w-72 flex flex-col justify-start items-start">
    //                           <div className="self-stretch justify-center text-white text-lg font-bold">Chycení běžce a výměna rolí</div>
    //                       </div>
    //                       <div className="w-72 opacity-70 flex flex-col justify-start items-start">
    //                           <div className="self-stretch justify-center"><span class="text-white text-sm font-normal leading-6">Lovci se snaží chytit běžce tím, že se ho </span><span class="text-white text-sm font-bold leading-6">dotknou</span><span class="text-white text-sm font-normal leading-6">, nebo ho </span><span class="text-white text-sm font-bold leading-6">zřetelně vyfotí</span><span class="text-white text-sm font-normal leading-6">. Poté se podle stanoveného pořadí stává jeden z lovců běžcem a vyráží, opět s </span><span class="text-white text-sm font-bold leading-6">náskokem 10 minut.</span></div>
    //                       </div>
    //                   </div>
    //               </div>
    //               <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start">
    //                   <div className="self-stretch opacity-60 flex flex-col justify-start items-start">
    //                       <div className="w-11 justify-center text-pink text-7xl font-extrabold leading-16">6</div>
    //                   </div>
    //                   <div className="self-stretch flex-1 px-8 pt-12 pb-24 bg-gray-dark rounded-3xl outline outline-offset-1px outline-white/10 backdrop-blur-[5px] flex flex-col justify-start items-start gap-4">
    //                       <div className="w-72 flex flex-col justify-start items-start">
    //                           <div className="w-44 h-4 justify-center text-white text-lg font-bold">Vítězství...?</div>
    //                       </div>
    //                       <div className="w-72 opacity-70 flex flex-col justify-start items-start">
    //                           <div className="self-stretch h-16 justify-center"><span class="text-white text-sm font-normal leading-6">Vítězí tým, který nasbírá nejvíce bodů během celé hry, která trvá </span><span class="text-white text-sm font-bold leading-6">3 hodiny</span><span class="text-white text-sm font-normal leading-6">.</span></div>
    //                       </div>
    //                   </div>
    //               </div>
    //           </div>


      

      /* <SectionWrapper
          height='auto'
          grid='none'
          backgroundColor='white'
        >

        <HeroCard
          style='dark'
          layout='left'
          header='Proměň Prahu ve své hřiště.'
          image_src={logo_background}
          image_alt='Logo'
        >
          <div className='flex flex-col items-center'>
            <p className='text-xl text-center mb-8'>
              Pohyb, akce, výzvy, seznamování.
              <br/><br/>
              Zažij akci, která u nás nemá obdoby.
              <br/><br/>
              Hra na babu,  
              <b><i> evolved.</i></b>
            </p>
            <Button 
              variant='white'
              size='large'
              text='Chci se účastnit!'
              route='https://docs.google.com/forms/d/e/1FAIpQLSeOerHVSfC8xTmwRmDHpStSzOP72kefFOsbwD0CE0wRUkkgpA/viewform?usp=header'
            />
          </div>
          
        </HeroCard>
      </SectionWrapper>

      <SectionWrapper 
        grid='none'
        height='auto'
        backgroundColor='dark'
      >
        <ContentDivider 
          style='dark'
          text=' V Game of Tag spolu soupeří tři týmy o to, který z nich probehně Prahou jako první dříve, než ho chytí lovci.  '
        />
      </SectionWrapper>

      <SectionWrapper 
        title="Hlavní prvky hry"
        height="full"
        grid="triple"
        backgroundColor='white'
      >
        <InfoCard
          title="Opravdový Open-world gameplay!"
          text="Zde nejsi omezen pouze na pár tahů a políček, jako v deskové hře - tady hraješ po celé Praze!"
          icon="🌍"
          variant="dark"
        />
        
        <InfoCard
          title="Dynamické herní role."
          text="Můžeš být lovec, který se snaží chytit běžce. Po chycení se ale role mění - ty se tak můžeš stát běžcem a máš tak šanci získat pro svůj tým vítězné body!"
          icon="🎲"
          variant="dark"
        />

        <InfoCard
          title="Multiplayer - ale trochu jinak!"
          text="Hra probíhá ve trojicích, kde jsi jediným zástupcem svého týmu. I přesto se ti ale vyplatí s druhým lovcem z trojice spolupracovat."
          icon="🤝"
          variant="light"
        />
      </SectionWrapper>

      <SectionWrapper 
        title="Role ve hře"
        height="auto"
        grid="double"
        backgroundColor='white'
      >

        <InfoCard 
          title="Lovec"
          text="Tvojí misí je chytit běžce, který má náskok 10 minut. Ty máš ale výhodu - vidíš jeho polohu a můžeš bez omezení používat MHD! Vždy ale lovíš ve společnosti druhého lovce ze své skupiny, nemůžeš lovit běžce sám"
          icon="🕵️‍♂️"
          variant="dark"
        />

        <InfoCard
          title="Běžec"
          text="Tvojí misí je uniknout lovcům a získat pro svůj tým vítězné body. Máš náskok, ale nevíš, kde se lovci nacházejí. Zároveň máš omezené množství MHD jízdenek, takže musíš pečlivě plánovat svou trasu. Plněním checkpointů se ti zpřístupňuji další, blíže cíli, a zároveň získáváš body pro svůj tým."
          icon="🏃‍♂️"
          variant="light"
        />
      </SectionWrapper>

      <section className="relative py-24 overflow-hidden bg-slate-950">
        <div className= top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-slate-950 to-slate-950 z-0 pointer-events-none" />
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
                Jako lovec body nezískáváš. Tvým  úkolem je co nejrychleji spolu s druhým lovcem chytit
                třetího hráče skupiny, <b>běžce</b>, aby nezískal body pro jeho tým. Jen díky tomu se mohou role ve skupině měnit. 
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
                Dostaň se na checkpoint, splň úkol a získej tak body pro tým, nové jízdenky na MHD a cestu k dalšímu checkpointu nebo cíli. Čím více checkpointů splníš, tím více bodů!
              </p>
            </div>

          </div>
          
          <div className="mt-16 text-center">
            <div className="inline-block bg-slate-800/50 backdrop-blur rounded-full px-8 py-3 border border-slate-700 text-slate-300 hover:border-amber-500/30 transition-colors cursor-default">
              🏁 Hra končí po uplynutí časového limitu <b>3 hodiny</b>. <span className="text-amber-400 font-bold">Tým s nejvíce body vyhrává.</span>
            </div>
          </div>

        </div>
      </section> */
  );
}