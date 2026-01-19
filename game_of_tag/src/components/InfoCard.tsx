import react from 'react';
import { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  titleAlign?: 'center' | 'right';
  text: string;
  icon?: ReactNode;
  variant: 'dark' | 'light';
}

export const InfoCard = ({title, titleAlign, text, icon,variant}: InfoCardProps) => {

    /* --- styly --- */
    const baseStyle = "p-6 rounded-xl hover ";
    const titleAlignStyle = titleAlign === 'center' ? 'text-left' 
                          : titleAlign === 'right' ? 'text-right'
                          : 'text-left';
    const variantStyle = variant === 'dark' ? 'bg-purple-75 border-2 border-white-light': 'bg-background border-2 border-pink-50';
    const textStyle = variant === 'dark' ? 'text-white' : 'text-gray-dark';

    return (
        <div className={`${baseStyle} ${variantStyle}`}>
            <div className="text-4xl mb-4">{icon}</div>
            <h6 className={`${textStyle} ${titleAlignStyle}`}>{title}</h6>
            <p className={textStyle}>{text}</p>
        </div>
    ) 
}