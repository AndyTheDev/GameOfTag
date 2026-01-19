import react from 'react';

interface ContentDividerProps {
    style: 'light' | 'dark';
    text: string;
}

export const ContentDivider = ({style, text}: ContentDividerProps) => {
    const textStyle = style === 'dark' ? 'text-pink' : 'text-purple';
    const baseTextStyle = 'text-3xl align-middle text-center font-semibold';

    return (
    <section id="about">
        <div className="max-w-5xl mx-auto px-4">
            <div className="space-y-4 leading-relaxed">
              <p className={`${baseTextStyle} ${textStyle}`}>
                {text}
              </p>  
          </div>
        </div>
      </section>
    )
}