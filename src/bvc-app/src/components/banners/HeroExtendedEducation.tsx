'use client';

import React from 'react';

interface HeroExtendedEducationProps {
  className?: string;
  title?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  youtubeId?: string;
  children?: React.ReactNode;
}

const HeroExtendedEducation: React.FC<HeroExtendedEducationProps> = ({
  className = '',
  title = 'Extended Education',
  backgroundImage,
  backgroundVideo,
  youtubeId,
  children,
}) => {
  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
      linear-gradient(220deg, var(--color-orange-100), var(--color-blue-100) 51%, var(--color-navy-100)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <section
      className={`bg-hero-ecommerce text-white py-20 ${className}`}
      style={backgroundStyle}
    >
      {/* YouTube Video Background */}
      {youtubeId && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&controls=0&playlist=${youtubeId}`}
            title="Background Video"
            frameBorder="0"
            allow="autoplay; fullscreen"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Local Video Background */}
      {backgroundVideo && !youtubeId && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Overlay for readability if video/image exists */}
      {(backgroundVideo || youtubeId) && (
        <div className="absolute inset-0 bg-black/40 z-10" />
      )}

      <div className="relative z-20 box-width-1280 mx-auto">
        <div className="w-layout-layout c-area__quick-stack grid grid-cols-1 md:grid-cols-2 items-center gap-8">
          <div className="w-layout-cell">
            <h1 className="text-4xl font-bold">{title}</h1>
          </div>
          <div className="w-layout-cell cell-20">
            {children && <div className="text-right">{children}</div>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroExtendedEducation;
