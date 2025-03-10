
import React from 'react';

interface LiquidButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

const LiquidButtonComponent: React.FC<LiquidButtonProps> = ({ text, onClick, className = '' }) => {
  const buttonRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (buttonRef.current && onClick) {
      buttonRef.current.addEventListener('click', onClick);
      
      return () => {
        if (buttonRef.current) {
          buttonRef.current.removeEventListener('click', onClick);
        }
      };
    }
  }, [onClick]);

  return (
    <div 
      ref={buttonRef} 
      className={`inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
    >
      {text}
    </div>
  );
};

export { LiquidButtonComponent as LiquidButton };
