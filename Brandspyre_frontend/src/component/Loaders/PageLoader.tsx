import React from 'react';

interface DotsLoaderProps {
  color?: string; // Tailwind background color class
  size?: 'sm' | 'md' | 'lg' ; // Size variant
  dotCount?: number; // Number of dots
}

export const DotsLoader = ({
  color = 'bg-red-700',
  size = 'sm',
  dotCount = 5
}: DotsLoaderProps) => {
  // Size classes mapping
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // Margin classes mapping
  const marginClasses = {
    sm: 'mr-2',
    md: 'mr-3',
    lg: 'mr-4'
  };

  // Animation delays for each dot
  const getAnimationDelay = (index: number) => {
    const baseDelay = -0.3;
    const increment = 0.1;
    return `${baseDelay + index * increment}s`;
  };

  return (
    <div className="flex items-center justify-center">
      {[...Array(dotCount)].map((_, index) => (
        <div
          key={index}
          className={`rounded-full ${color} ${sizeClasses[size]} ${marginClasses[size]} 
            animate-pulse opacity-80`}
          style={{
            animationDelay: getAnimationDelay(index),
            animationDuration: '1.5s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite'
          }}
        />
      ))}
    </div>
  );
};

// Usage examples:
// <DotsLoader /> // Default red medium size
// <DotsLoader color="bg-blue-500" size="lg" dotCount={4} />