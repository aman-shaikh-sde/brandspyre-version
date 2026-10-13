import React from "react";

const DotSpinner = () => {
  const dotStyle = (delay: number) => ({
    animation: `spin 2s infinite`,
    animationDelay: `${delay}ms`,
  });

  return (
    <div className="relative w-[60px] h-[60px]">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i}
          className="absolute inset-0 flex justify-center"
          style={dotStyle(i * 100)}
        >
          <div className="w-[7px] h-[7px] rounded-full bg-red-700" />
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}} />
    </div>
  );
};

export default DotSpinner;