import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../types';
import { useTheme } from './ThemeContext';

interface MapContextType {
  isPreloaded: boolean;
  preloadMap: () => void;
  getPreloadedMap: () => mapboxgl.Map | null;
  releasePreloadedMap: () => void;
}

const MapContext = createContext<MapContextType | null>(null);

// Detect slow devices
const isSlowDevice = typeof navigator !== 'undefined' && (
  /iPad|iPhone/.test(navigator.userAgent) || 
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
);

// Use simpler style for slow devices
const getOptimalStyle = (isChristmas: boolean) => {
  if (isSlowDevice) {
    // Even lighter style for slow devices
    return 'mapbox://styles/mapbox/light-v11';
  }
  return isChristmas
    ? 'mapbox://styles/maxmijn/cmj4oe05b00bd01se3bmc7can'
    : 'mapbox://styles/mapbox/outdoors-v12';
};

export function MapProvider({ children }: { children: ReactNode }) {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const preloadContainerRef = useRef<HTMLDivElement | null>(null);
  const preloadedMapRef = useRef<mapboxgl.Map | null>(null);
  const preloadingRef = useRef(false);
  const { isChristmas } = useTheme();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preloadedMapRef.current) {
        preloadedMapRef.current.remove();
        preloadedMapRef.current = null;
      }
      if (preloadContainerRef.current) {
        preloadContainerRef.current.remove();
        preloadContainerRef.current = null;
      }
    };
  }, []);

  const preloadMap = useCallback(() => {
    // Don't preload twice
    if (preloadingRef.current || isPreloaded || preloadedMapRef.current) return;
    preloadingRef.current = true;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Create a hidden container for the preload map
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 300px;
      height: 200px;
      visibility: hidden;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    preloadContainerRef.current = container;

    const map = new mapboxgl.Map({
      container,
      style: getOptimalStyle(isChristmas),
      zoom: 1.5,
      center: [0, 20],
      // Same performance options as QuizMap
      antialias: false,
      fadeDuration: 0,
      trackResize: false,
      maxTileCacheSize: isSlowDevice ? 20 : 50,
      refreshExpiredTiles: false,
      renderWorldCopies: false,
      preserveDrawingBuffer: false,
      maxZoom: 18,
      attributionControl: false,
      localIdeographFontFamily: 'sans-serif',
      collectResourceTiming: false,
      // Critical for slow devices: reduce pixel ratio
      ...(isSlowDevice ? { pixelRatio: 1 } : {}),
    } as mapboxgl.MapOptions);

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();
    
    if (isSlowDevice) {
      map.setMaxPitch(0);
    }

    // Function to hide all map labels
    const hideLabels = () => {
      try {
        const style = map.getStyle();
        style?.layers?.forEach((layer) => {
          const isLabelLayer = layer.type === 'symbol' || 
            layer.id.includes('label') || 
            layer.id.includes('place') || 
            layer.id.includes('poi');
          
          if (isLabelLayer) {
            try {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
            } catch {
              // Ignore
            }
          }
        });
      } catch {
        // Ignore
      }
    };

    // Also hide labels when style data changes (catches late-loading labels)
    map.on('styledata', hideLabels);

    map.on('load', () => {
      hideLabels();

      preloadedMapRef.current = map;
      setIsPreloaded(true);
      console.log('[MapPreloader] Map preloaded successfully');
    });

    map.on('error', (e) => {
      console.warn('[MapPreloader] Map preload error:', e);
      preloadingRef.current = false;
    });
  }, [isPreloaded, isChristmas]);

  const getPreloadedMap = useCallback(() => {
    return preloadedMapRef.current;
  }, []);

  const releasePreloadedMap = useCallback(() => {
    // Just mark as not preloaded so the QuizMap can use its own instance
    // The preloaded map stays for tile caching benefits
  }, []);

  return (
    <MapContext.Provider
      value={{
        isPreloaded,
        preloadMap,
        getPreloadedMap,
        releasePreloadedMap,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
