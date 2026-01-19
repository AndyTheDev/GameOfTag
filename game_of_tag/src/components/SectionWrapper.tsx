import react from 'react';

interface SectionWrapperProps {
    title?: string;
    width?: 'full';
    height: 'full' | 'auto';
    grid: 'double' | 'triple'| 'quad'| 'none';
    backgroundColor?: 'dark' | 'light' | 'white' | 'gradient';
}

export const SectionWrapper = ({title, width, height, grid, backgroundColor, children}: React.PropsWithChildren<SectionWrapperProps>) => {
    /* --- styly --- */
    const backgroundColorStyle = backgroundColor === 'dark' ? 'bg-gray-dark'
                                  : backgroundColor === 'light' ? 'bg-background'
                                  : backgroundColor === 'white' ? 'bg-white'
                                  : backgroundColor === 'gradient' ? 'bg-linear-to-br from-purple to-pink'
                                  : 'bg-black';
    const titleColorStyle = backgroundColor === 'white' ? 'text-pink'
                          : 'text-purple'
    const baseStyle = "py-20 px-4 mx-auto flex flex-col items-center justify-center";
    const widthStyle = width === 'full' ? '' : 'max-w-6xl';
    const heightStyle = height === 'full' ? 'min-h-screen' : 'min-h-auto';
    const gridStyle = grid === 'double' ? 'grid md:grid-cols-2 gap-8'
                    : grid === 'triple' ? 'grid md:grid-cols-3 gap-8'
                    : grid === 'quad' ? 'grid md:grid-cols-4 gap-8'
                    : '';

    /* --- render --- */
    return (
        <section id={title} className={backgroundColorStyle}>
            <div className={`${baseStyle} ${widthStyle} ${heightStyle}`}>
                <h3 className={titleColorStyle}>{title}</h3>
                <div className={gridStyle}>
                    {children}
                </div>
            </div>
        </section>
    )
}