import react from 'react';
import Link from 'next/link';

interface ButtonProps {
    variant: 'purple' | 'pink' | 'white';
    size: 'large' | 'small';
    text: string;
    route: string;
    disabled?: 'true'; 
}

export const Button = ({variant, size, text, route}: ButtonProps) => {
    const baseStyle = 'inline-block font-bold rounded-2xl transition-transform transform hover:scale-105';
    const textSizeStyle = size === 'large' ? 'text-lg' : 'text-base';
    const buttonSizeStyle = size === 'large' ? 'px-8 py-4' : 'px-4 py-2';
    const variantStyle = variant === 'purple' ? 'bg-purple text-white hover:bg-purple-75'
                       : variant === 'pink' ? 'bg-pink text-purple hover:bg-pink-75'
                       : 'bg-white text-purple hover:bg-white-light';

    return (
        <Link
            href={route}
            className={`${baseStyle} ${variantStyle} ${buttonSizeStyle}`}
        >
            <p className={textSizeStyle}>{text}</p>
        </Link>
    )
}