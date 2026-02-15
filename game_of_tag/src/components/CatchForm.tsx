'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/Button';
import { InfoCard } from '@/src/components/InfoCard';
import { catchRunnerAction } from '../actions/catchRunner'; 

interface CatchFormProps {
  slug: string;
}

export const CatchForm = ({ slug }: CatchFormProps) => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCatch = async () => {
    if (!password) return;
    setStatus('loading');
    
    // Volání Server Action
    try {
        const result = await catchRunnerAction(slug, password);

        if (result.success) {
        setStatus('success');
        setMessage(result.message);
        } else {
        setStatus('error');
        setMessage(result.message);
        }
    } catch (error) {
        setStatus('error');
        setMessage("Nastala chyba při komunikaci se serverem.");
    }
  };

  // 1. Stav ÚSPĚCH - Zobrazíme InfoCard a tlačítko pryč
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300 w-full max-w-[480px]">
         <InfoCard
            title="Skvělá práce!"
            text={message}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            }
            variant="dark"
          />
          
          <div className="text-center mt-4">
            <p className="text-sm text-dark-gray mb-4">Nyní musíš 5 minut zůstat na místě a dát šanci i ostatním! Nastav si stopky na mobilu, ať víš, kdy vyrazit do akce.</p>
          </div>
      </div>
    );
  }

  // 2. Stav FORMULÁŘ (Idle / Loading / Error)
  return (
    <div className="flex flex-col gap-6 bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-white w-full max-w-[480px] shadow-sm">
        
        {/* Zobrazení chyby */}
        {status === 'error' && (
          <div className="p-4 bg-red-100 border border-red-600 rounded-xl">
            <p className="text-red-600 text-center font-semibold text-sm">{message}</p>
          </div>
        )}

        {/* Input pro heslo */}
        <div className="flex flex-col gap-2">
          <label htmlFor="hunter-pass" className="text-sm font-semibold text-dark-gray uppercase tracking-wider ml-1">
            Tvoje heslo
          </label>
          <input
            id="hunter-pass"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === 'loading'}
            className="w-full p-4 rounded-xl bg-white border border-gray-200 focus:border-purple focus:ring-2 focus:ring-purple/20 outline-none transition-all text-lg text-dark-gray disabled:opacity-50"
            placeholder="Zadej svůj kód"
          />
        </div>

        {/* Tlačítko akce */}
        <div className="flex justify-center mt-2">
          <Button 
            variant='purple'
            size='large'
            text={status === 'loading' ? 'Ověřuji...' : 'Potvrdit chycení'}
            onClick={handleCatch}
            disabled={status === 'loading' || !password}
          />
        </div>
    </div>
  );
};