import react, { Children } from 'react';
import Image, { StaticImageData } from "next/image";

interface HeroCardProps {
    style: 'light' | 'dark';
    layout: 'left' | 'right' | 'top' | 'down';
    header: string;
    image_src: StaticImageData;
    image_alt: string;
}

export const HeroCard = ({style, layout, header, image_src, image_alt, children}: React.PropsWithChildren<HeroCardProps>) => {
    const cardStyle = 'flex flex-col items-center max-w-4xl rounded-2xl py-12 px-12';
    const cardColorStyle = style === 'dark' ? 'bg-purple' : 'bg-pink-75';
    const textColorStyle = style === 'dark' ? 'text-white' : 'text-purple';
    const headingStyle = 'text-center';

    return (
        <div className={`${cardStyle} ${cardColorStyle} ${textColorStyle}`}>
            <Image src={image_src} alt={image_alt} className=' w-64 h-64'/>
            <div>
                <h1 className={headingStyle}>{header}</h1>
                <div>
                    {children}
                </div>
            </div>
        </div>
    )
}