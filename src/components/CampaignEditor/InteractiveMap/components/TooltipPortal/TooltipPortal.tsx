import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';

interface TooltipPortalProps {
  children: React.ReactNode;
  targetPosition: { x: number; y: number };
  viewport: { x: number; y: number; scale: number; width: number; height: number };
}

export const TooltipPortal: React.FC<TooltipPortalProps> = ({ 
  children, 
  targetPosition,
  viewport 
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        left: mousePos.x + 15,
        top: mousePos.y + 15,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: mousePos.x === 0 && mousePos.y === 0 ? 0 : 1,
        transition: 'opacity 0.2s'
      }}
    >
      {children}
    </div>,
    document.body
  );
};