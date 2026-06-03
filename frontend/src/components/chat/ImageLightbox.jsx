import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export default function ImageLightbox({ images, currentIndex, onClose, onNavigate }) {
    const currentImage = images[currentIndex];
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
        if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
    }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = currentImage;
        link.target = '_blank';
        link.download = `image-${currentIndex + 1}`;
        link.click();
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
                <span className="text-white/70 text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Tải xuống"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Prev button */}
            {hasPrev && (
                <button
                    onClick={() => onNavigate(currentIndex - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-10 hover:scale-110"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            {/* Image */}
            <img
                src={currentImage}
                alt={`Ảnh ${currentIndex + 1}`}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none"
                draggable={false}
            />

            {/* Next button */}
            {hasNext && (
                <button
                    onClick={() => onNavigate(currentIndex + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-10 hover:scale-110"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}
