'use client';

import React, { useState, useEffect } from 'react';
import App from '../components/App';

const TAGLINES = [
  "Writer, no block.",
  "Where ideas take root.",
  "Branch out your thoughts.",
  "Plant seeds of innovation.",
  "Growing ideas together."
];

const useTaglineCarousel = (interval = 4000, initialDelay = 500) => {
  const [tagline, setTagline] = useState(TAGLINES[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Initial entrance animation
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
      setHasInitialized(true);
    }, initialDelay);

    return () => clearTimeout(initialTimer);
  }, [initialDelay]);

  useEffect(() => {
    if (!hasInitialized) return;

    let currentIndex = 0;
    const transitionDuration = 800; // Smoother transition duration
    
    const fadeTimer = setInterval(() => {
      setIsVisible(false);
      
      const nextTimer = setTimeout(() => {
        currentIndex = (currentIndex + 1) % TAGLINES.length;
        setTagline(TAGLINES[currentIndex]);
        setIsVisible(true);
      }, transitionDuration);

      return () => clearTimeout(nextTimer);
    }, interval);

    return () => clearInterval(fadeTimer);
  }, [interval, hasInitialized]);

  return { tagline, isVisible };
};

const FloatingLeaf = ({ delay, position }: { delay: number; position: string }) => (
  <div
    className={`absolute w-8 h-8 opacity-0 ${position} animate-float`}
    style={{
      animationDelay: `${delay}s`,
    }}
  >
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full text-green-500 rotate-45 transform"
      fill="currentColor"
    >
      <path d="M12 2L2 22L12 19L22 22L12 2Z" />
    </svg>
  </div>
);

export default function Page() {
  const [showApp, setShowApp] = useState(false);
  const { tagline, isVisible } = useTaglineCarousel();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
      {/* Animated background elements */}
      <FloatingLeaf delay={0} position="top-1/4 left-1/4" />
      <FloatingLeaf delay={1} position="top-1/3 right-1/3" />
      <FloatingLeaf delay={2} position="bottom-1/4 right-1/4" />
      <FloatingLeaf delay={3} position="bottom-1/3 left-1/3" />

      {!showApp && (<div className="flex flex-col items-center justify-center min-h-screen transition-opacity duration-1000 opacity-100">
        <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 animate-title mb-8">
          Sprout
        </h1>
        
        <p 
          className={`
            text-gray-300 text-xl md:text-2xl mb-12
            transition-all duration-800 ease-in-out
            transform
            ${isVisible 
              ? 'opacity-100 translate-y-0 blur-0' 
              : 'opacity-0 translate-y-4 blur-sm'
            }
          `}
          style={{ 
            willChange: 'opacity, transform, filter',
            perspective: '1000px',
            backfaceVisibility: 'hidden'
          }}
        >
          {tagline}
        </p>
        
        <button
          onClick={() => setShowApp(true)}
          className="cursor-pointer px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-full
                   hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300
                   shadow-lg hover:shadow-xl animate-fadeIn opacity-0"
          style={{ animationDelay: '1s' }}
        >
          Start Growing
        </button>
      </div>)}

      {showApp && (
        <div className="fixed inset-0 bg-gray-900">
          <App />
        </div>
      )}
    </div>
  );
}
