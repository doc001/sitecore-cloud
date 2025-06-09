'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

// Define separate interfaces for different media types
interface ImageMedia {
  type: 'image';
  src: string;
  alt: string;
}

interface VideoMedia {
  type: 'video';
  src: string;
  poster?: string;
}

// Create a union type for media items
type MediaItem = ImageMedia | VideoMedia;

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  height?: number | string;
  media?: MediaItem | MediaItem[];
}

/**
 * HeroBanner component
 * 
 * A call-to-action component that displays a prominent message encouraging users to apply
 * Supports videos, static images, or image carousels as background media
 * 
 * @param title - The main title (defaults to "I am ready")
 * @param subtitle - The subtitle displayed below the title (defaults to "to apply.")
 * @param description - The descriptive text (defaults to "You're ready to make this happen...")
 * @param className - Additional CSS classes for customization
 * @param height - Custom height for the component (defaults to 'auto', max 560px on desktop)
 * @param media - Single media item or array of media items (for carousel)
 */
const HeroBanner: React.FC<HeroBannerProps> = ({
  title = "I am ready",
  subtitle = "to apply.",
  description = "You're ready to make this happen. Let's take the first step together.",
  className = '',
  height = 'auto',
  media,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const mediaArray = media ? (Array.isArray(media) ? media : [media]) : [];

  // Function to toggle video play/pause
  const toggleVideo = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing video:', err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Carousel auto-slide effect
  useEffect(() => {
    if (!mediaArray.length || mediaArray.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mediaArray.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [mediaArray.length]);

  // Calculate height style
  const heightStyle = {
    height: height === 'auto' ? 'auto' : typeof height === 'number' ? `${height}px` : height,
    maxHeight: '560px' // Maximum height for desktop
  };

  return (
    <div 
      className={`bg-[color:var(--color-navy-100)] p-8 md:p-12 lg:p-16 relative overflow-hidden ${className}`}
      style={heightStyle}
    >
      {/* Background Media (Video, Image, or Carousel) */}
      {mediaArray.length > 0 && (
        <div className="absolute inset-0 w-full h-full z-0">
          {/* Overlay to ensure text visibility */}
          <div className="absolute inset-0 bg-[color:var(--navy--100-tr-60)] z-10"></div>
          
          {/* Media Items */}
          {mediaArray.map((item, index) => (
            <div 
              key={`media-${index}`}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              {item.type === 'video' ? (
                <>
                  <video
                    ref={index === currentSlide ? videoRef : null}
                    src={item.src}
                    poster={item.poster}
                    className="w-full h-full object-cover"
                    loop
                    muted
                  />
                  {index === currentSlide && (
                    <button 
                      className="absolute bottom-4 right-4 z-20 bg-[color:var(--color-white)] bg-opacity-20 p-3 rounded-full hover:bg-opacity-30 transition-all"
                      onClick={toggleVideo}
                      aria-label={isPlaying ? "Pause video" : "Play video"}
                    >
                      <span className="material-icon text-[color:var(--color-white)] text-2xl">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              )}
            </div>
          ))}
          
          {/* Carousel Navigation Dots */}
          {mediaArray.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
              {mediaArray.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-[color:var(--color-white)]' 
                      : 'bg-[color:var(--color-white)] bg-opacity-50 hover:bg-opacity-70'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative z-10">
        {/* Left column with main heading */}
        <div 
          className="opacity-100 transform transition-all duration-500 ease-in-out"
          style={{ 
            transform: 'translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)',
            transformStyle: 'preserve-3d' 
          }}
        >
          <div className="mb-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-[color:var(--color-white)] mb-2">
              {title}
            </h2>
            <h1 className="text-5xl lg:text-7xl font-bold text-[color:var(--color-white)]">
              {subtitle}
            </h1>
          </div>
        </div>

        {/* Right column with description */}
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-[color:var(--color-white)]">
            {description}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;