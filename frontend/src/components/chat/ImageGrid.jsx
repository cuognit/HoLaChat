import { useState } from 'react';
import ImageLightbox from './ImageLightbox';

/**
 * Smart grid layout for displaying images in chat messages.
 * 1 image: full width
 * 2 images: side by side
 * 3 images: 1 large + 2 small
 * 4 images: 2x2 grid
 * 5+ images: 2x2 grid + overlay showing remaining count
 */
export default function ImageGrid({ images, maxDisplay = 4 }) {
    const [lightboxIndex, setLightboxIndex] = useState(null);

    if (!images || images.length === 0) return null;

    const displayImages = images.slice(0, maxDisplay);
    const remainingCount = images.length - maxDisplay;

    const handleClick = (index) => {
        setLightboxIndex(index);
    };

    const baseClass = "object-cover cursor-pointer transition-all duration-200 hover:brightness-90";

    const renderImage = (url, index, className = "") => (
        <div
            key={index}
            className={`relative overflow-hidden ${className}`}
            onClick={() => handleClick(index)}
        >
            <img
                src={url}
                alt={`Ảnh ${index + 1}`}
                className={`w-full h-full ${baseClass}`}
                loading="lazy"
            />
            {/* Overlay for remaining count on last visible image */}
            {index === maxDisplay - 1 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{remainingCount}</span>
                </div>
            )}
        </div>
    );

    const getGridLayout = () => {
        const count = displayImages.length;

        if (count === 1) {
            return (
                <div className="max-w-[320px] rounded-xl overflow-hidden">
                    {renderImage(displayImages[0], 0, "max-h-[320px]")}
                </div>
            );
        }

        if (count === 2) {
            return (
                <div className="grid grid-cols-2 gap-0.5 max-w-[320px] rounded-xl overflow-hidden">
                    {displayImages.map((url, i) => renderImage(url, i, "aspect-square"))}
                </div>
            );
        }

        if (count === 3) {
            return (
                <div className="grid grid-cols-2 gap-0.5 max-w-[320px] rounded-xl overflow-hidden">
                    <div className="col-span-2">
                        {renderImage(displayImages[0], 0, "aspect-video")}
                    </div>
                    {displayImages.slice(1).map((url, i) => renderImage(url, i + 1, "aspect-square"))}
                </div>
            );
        }

        // 4+ images: 2x2 grid
        return (
            <div className="grid grid-cols-2 gap-0.5 max-w-[320px] rounded-xl overflow-hidden">
                {displayImages.map((url, i) => renderImage(url, i, "aspect-square"))}
            </div>
        );
    };

    return (
        <>
            {getGridLayout()}

            {lightboxIndex !== null && (
                <ImageLightbox
                    images={images}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={(index) => setLightboxIndex(index)}
                />
            )}
        </>
    );
}
