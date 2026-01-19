import react from 'react';
import Image from "next/image";
import Link from 'next/link';
import logo from "../assets/logo.png";
import { Button } from '@/src/components/Button';

interface HeaderProps {
    type: 'basic' | 'advanced' | 'admin';
    backgroundColor: 'dark' | 'light';
}

export const Header = ({type, backgroundColor}: HeaderProps) => {
    /* --- styly --- */
    /* const typeStyle = type === 'advanced' ? 
                    : type === 'admin' ?
                    : 'p-6 flex justify-between items-center max-w-6xl mx-auto'; */
    const typeStyle = 'p-4 flex justify-between items-center max-w-6xl mx-auto';
    const backgroundColorStyle = backgroundColor === 'dark' ? 'bg-gray-dark'
                               : 'bg-background';
    const linkDivStyle = 'flex justify-between';
    const linkStyle = 'mx-6 font-bold text-purple hover:text-purple-50 transition-transform transform'

    if(type === 'advanced') {
        return (
        <header className={backgroundColorStyle}>
            <div className={typeStyle}>
                <Image 
                    src={logo}
                    alt='Game of Tag logo'
                    className='w-16 h-16'
                />
                <Link href="#function" className={linkStyle}>
                    Jak to funguje?
                </Link>
                <Button 
                    size='small'
                    variant='purple'
                    text='Chci se účastnit!'
                    route='https://docs.google.com/forms/d/e/1FAIpQLSeOerHVSfC8xTmwRmDHpStSzOP72kefFOsbwD0CE0wRUkkgpA/viewform?usp=header'
                />
            </div>
        </header>
        )
    } else if (type === 'admin') {
        return (
        <header className={backgroundColorStyle}>
            <div className={typeStyle}>
                <Image 
                    src={logo}
                    alt='Game of Tag logo'
                    className='w-12 h-12'
                />
                <div className={linkDivStyle}>
                    <Link href="admin/players" className={linkStyle}>
                        Hráči
                    </Link>
                    <Link href="admin/quests" className={linkStyle}>
                        Úkoly
                    </Link>
                    <Link href="admin/locations" className={linkStyle}>
                        Lokace
                    </Link>
                </div>
                <Link href="admin" className={linkStyle}>
                    Odhlásit se
                </Link>
            </div>
        </header>
        )
    } else {
        return (
        <header className={backgroundColorStyle}>
            <div className={typeStyle}>
                <Image 
                    src={logo}
                    alt='Game of Tag logo'
                    className='w-12 h-12'
                />
                <h5 className='text-pink'>Game of Tag</h5>
            </div>
        </header>
        )
    }
}