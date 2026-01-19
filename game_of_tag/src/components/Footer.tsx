import react from 'react';
import Link from 'next/link';

export const Footer = ({}) => {

    return (
        <footer className="py-8 text-center bg-background text-slate-500">
            <div className=" flex space-around justify-center">
                <p className='text-purple'>&copy; {new Date().getFullYear()} Game of Tag. Všechna práva vyhrazena.</p>
                <div className="mx-6">
                    <Link 
                    href='https://www.instagram.com/joingameoftag/'
                    className='text-purple hover:text-purple-50'
                    >
                        <h6>@joingameoftag</h6>
                    </Link>
                </div>
            </div>
        </footer>
    )
}