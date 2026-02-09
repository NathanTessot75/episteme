import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force le scroll tout en haut (0, 0) instantanément
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" // Important pour éviter l'effet de défilement lent
    });
  }, [pathname]); // Se déclenche à chaque fois que l'URL change

  return null; // Ce composant n'affiche rien visuellement
};

export default ScrollToTop;