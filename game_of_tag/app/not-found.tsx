import React from 'react';
import Link from 'next/link';
import {Header} from '@/src/components/Header';
import { Button } from '@/src/components/Button';
import {Footer} from '@/src/components/Footer';
import {SectionWrapper} from '@/src/components/SectionWrapper';

export default function WorkInProgress() {
  return (
    
    <div>
      <Header type='basic' backgroundColor='light'/>
      <SectionWrapper
        height='full'
        grid='none'
        backgroundColor='light'
      >
        <div className=" bg-background flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
            style={
              { backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '32px 32px' }
            }>
          </div>
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="text-7xl mb-6 animate-bounce">
              🚧
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink to-purple">
              Work in Progress
            </h1>
            <p className="text-lg text-gray-dark mb-8 leading-relaxed">
              Tato část aplikace je ještě ve vývoji 
            </p>

            <Button 
              variant='purple'
              size='large'
              text='Zpět na hlavní stránku'
              route='/'
            />
          </div>
        </div>
      </SectionWrapper>
      

      <Footer />
    </div>
  );
}