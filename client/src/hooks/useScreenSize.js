// src/hooks/useScreenSize.js
import { useState, useEffect } from 'react';

export default function useIsSmallScreen(breakpoint = 768) {
  const [isSmall, setIsSmall] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isSmall; // Mantemos exatamente a mesma saída original
}