interface ButtonLoaderProps {
  color?: string;
  size?: number;
  text?: string;
}

export const ButtonLoader = ({
  color = 'text-gray-300', // Using Tailwind color class
  size = 5, // This will translate to h-5 w-5 (1 = 0.25rem)
  text = 'Processing...'
}: ButtonLoaderProps) => {
  // Convert size number to Tailwind class
  const sizeClass = `h-${size} w-${size}`;
  
  return (
    <div className="inline-flex items-center gap-2">
      <div className={`${sizeClass} relative`}>
        <div
          className={`absolute inset-0 rounded-full border-2 border-current ${color} opacity-25`}
        ></div>
        
        <div
          className={`absolute inset-0 rounded-full border-2 border-transparent border-t-current ${color} animate-spin`}
          style={{
            animationDuration: '1s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite'
          }}
        ></div>
      </div>
      
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
};