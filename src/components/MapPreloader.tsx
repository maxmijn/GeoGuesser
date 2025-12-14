import { useEffect } from 'react';
import { useMap } from '../context/MapContext';

/**
 * Invisible component that preloads the Mapbox map in the background.
 * Place this on the screen BEFORE the quiz starts (e.g., SetupScreen).
 */
export function MapPreloader() {
  const { preloadMap, isPreloaded } = useMap();

  useEffect(() => {
    // Start preloading after a small delay to let the UI render first
    const timer = setTimeout(() => {
      if (!isPreloaded) {
        preloadMap();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [preloadMap, isPreloaded]);

  // This component renders nothing
  return null;
}
