import { useState, useEffect } from 'react';
import { useApp } from '../context';
import img1 from '../assets/bici.jpeg';
import img2 from '../assets/plan1.jpeg';
import img3 from '../assets/planinfi.jpeg';
import img4 from '../assets/re1.jpeg';
import img5 from '../assets/re2.jpeg';
import img6 from '../assets/rein.jpeg';
import img7 from '../assets/rein2.jpeg';
import img8 from '../assets/segundo.jpeg';

const localImages = [img1, img2, img3, img4, img5, img6, img7, img8];

export default function CarouselBackground() {
    const { galleryImages } = useApp();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Merge local images + Supabase Storage images
    const allImages = [
        ...localImages,
        ...galleryImages.map(img => img.url),
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % allImages.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [allImages.length]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: -2,
            pointerEvents: 'none',
            backgroundColor: 'var(--bg-main)'
        }}>
            {allImages.map((img, index) => (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('${img}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: index === currentIndex ? 1 : 0,
                        transition: 'opacity 1.5s ease-in-out',
                        willChange: 'opacity'
                    }}
                />
            ))}
        </div>
    );
}
