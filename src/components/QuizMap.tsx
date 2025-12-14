import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useMap } from '../context/MapContext';

interface QuizMapProps {
  playerColor: string;
  onGuess: (coordinates: [number, number]) => void;
  guessCoordinates: [number, number] | null;
}

// Detect older/slower devices once
const isSlowDevice = typeof navigator !== 'undefined' && (
  /iPad|iPhone/.test(navigator.userAgent) || 
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
);

export function QuizMap({ playerColor, onGuess, guessCoordinates }: QuizMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { isChristmas } = useTheme();
  const { isPreloaded } = useMap();
  const [isLoading, setIsLoading] = useState(true);

  // Use simpler/lighter map style for better performance on slow devices
  const getMapStyle = useCallback(() => {
    if (isSlowDevice) {
      // Use much lighter style for slow devices
      return 'mapbox://styles/mapbox/light-v11';
    }
    return isChristmas
      ? 'mapbox://styles/maxmijn/cmj4oe05b00bd01se3bmc7can'
      : 'mapbox://styles/mapbox/outdoors-v12';
  }, [isChristmas]);

  const hideMapLabels = useCallback((map: mapboxgl.Map) => {
    try {
      const style = map.getStyle();
      if (!style?.layers) return;

      style.layers.forEach((layer) => {
        if (layer.type === 'symbol') {
          try {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          } catch {
            // Skip layers that can't be modified
          }
        }
      });
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(),
      zoom: 1.5,
      center: [0, 20],
      // Performance optimizations for older devices
      antialias: false,
      fadeDuration: 0,
      trackResize: false,
      maxTileCacheSize: isSlowDevice ? 20 : 50,
      refreshExpiredTiles: false,
      // Additional performance options
      renderWorldCopies: false,
      preserveDrawingBuffer: false,
      maxZoom: 12,
      attributionControl: false,
      // Skip loading CJK fonts
      localIdeographFontFamily: 'sans-serif',
      // Disable resource timing collection
      collectResourceTiming: false,
      // Critical for slow devices: reduce pixel ratio (renders fewer pixels)
      // Note: pixelRatio is valid but not in TS types
      ...(isSlowDevice ? { pixelRatio: 1 } : {}),
    } as mapboxgl.MapOptions);
    
    // Additional canvas optimizations for slow devices
    if (isSlowDevice) {
      const canvas = map.getCanvas();
      canvas.style.imageRendering = 'optimizeSpeed';
      // Reduce quality for smoother interactions
      canvas.style.willChange = 'transform';
    }

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();
    
    // Reduce animation complexity on slow devices
    if (isSlowDevice) {
      // Disable terrain/3D for better 2D performance  
      map.setMaxPitch(0);
    }

    map.on('load', () => {
      map.resize();
      hideMapLabels(map);
      setIsLoading(false);
    });

    map.on('click', (e) => {
      onGuess([e.lngLat.lng, e.lngLat.lat]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [getMapStyle, hideMapLabels, onGuess]);

  // Update marker when guess changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (guessCoordinates) {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = playerColor;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(guessCoordinates)
        .addTo(map);

      markerRef.current = marker;
    }
  }, [guessCoordinates, playerColor]);

  // Reset map view when no guess (instant jump for better performance)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || guessCoordinates) return;

    // Use jumpTo instead of flyTo for better performance on older devices
    map.jumpTo({
      center: [0, 20],
      zoom: 1.5,
    });
  }, [guessCoordinates]);

  return (
    <div className="map-container-wrapper">
      {isLoading && (
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <span>{isPreloaded ? 'Kaart laden...' : 'Kaart voorbereiden...'}</span>
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        className="map-container" 
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease' }}
      />
    </div>
  );
}
