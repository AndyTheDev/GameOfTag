// import react from 'react';
// import Link from 'next/link';

// interface ButtonProps {
//     variant: 'purple' | 'pink' | 'white';
//     size: 'large' | 'small';
//     text: string;
//     route: string;
//     disabled?: 'true'; 
// }

// export const Button = ({variant, size, text, route}: ButtonProps) => {
//     const baseStyle = 'inline-block font-bold rounded-2xl transition-transform transform hover:scale-105';
//     const textSizeStyle = size === 'large' ? 'text-lg' : 'text-base';
//     const buttonSizeStyle = size === 'large' ? 'px-8 py-4' : 'px-4 py-2';
//     const variantStyle = variant === 'purple' ? 'bg-purple text-white hover:bg-purple-75'
//                        : variant === 'pink' ? 'bg-pink text-purple hover:bg-pink-75'
//                        : 'bg-white text-purple hover:bg-white-light';

//     return (
//         <Link
//             href={route}
//             className={`${baseStyle} ${variantStyle} ${buttonSizeStyle}`}
//         >
//             <p className={textSizeStyle}>{text}</p>
//         </Link>
//     )
// }

import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  variant: 'purple' | 'pink' | 'white';
  size: 'large' | 'medium' | 'small'; // Přidal jsem medium, hodí se
  text: string;
  route?: string; // Route je nyní volitelná
  onClick?: () => void; // Přidána podpora pro click handler
  disabled?: boolean; // Opraven typ na boolean pro lepší práci v Reactu
  type?: 'button' | 'submit' | 'reset'; // Pro formuláře
}

export const Button = ({ 
  variant, 
  size, 
  text, 
  route, 
  onClick, 
  disabled = false, 
  type = 'button' 
}: ButtonProps) => {
  
  // Základní styly
  const baseStyle = 'inline-block font-bold rounded-2xl transition-transform transform';
  
  // Interaktivita - vypneme hover efekty, pokud je disabled
  const interactiveStyle = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'hover:scale-105 cursor-pointer';

  const textSizeStyle = size === 'large' ? 'text-lg' : 'text-base';
  
  const buttonSizeStyle = 
    size === 'large' ? 'px-8 py-4' 
    : size === 'medium' ? 'px-6 py-3' 
    : 'px-4 py-2';

  const variantStyle = 
    variant === 'purple' ? 'bg-purple text-white hover:bg-purple-75'
    : variant === 'pink' ? 'bg-pink text-purple hover:bg-pink-75'
    : 'bg-white text-purple hover:bg-white-light';

  // Sloučení tříd
  const className = `${baseStyle} ${variantStyle} ${buttonSizeStyle} ${interactiveStyle}`;

  // 1. Pokud je zadána "route" a tlačítko není disabled, vykreslíme Link
  if (route && !disabled) {
    return (
      <Link href={route} className={className}>
         <p className={`${textSizeStyle} text-center`}>{text}</p>
      </Link>
    );
  }

  // 2. Jinak vykreslíme klasický HTML button (pro akce nebo disabled stav)
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <p className={textSizeStyle}>{text}</p>
    </button>
  );
};