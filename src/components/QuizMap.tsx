import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../types';
import { useTheme } from '../context/ThemeContext';

interface QuizMapProps {
  playerColor: string;
  onGuess: (coordinates: [number, number]) => void;
  guessCoordinates: [number, number] | null;
}

export function QuizMap({ playerColor, onGuess, guessCoordinates }: QuizMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { isChristmas } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Use simpler/lighter map style for better performance
  const getMapStyle = useCallback(() => {
    return isChristmas
      ? 'mapbox://styles/maxmijn/cmj4oe05b00bd01se3bmc7can'
      : 'mapbox://styles/mapbox/outdoors-v12'; // Lighter than streets-v12
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

    // Detect older/slower devices
    const isSlowDevice = /iPad|iPhone/.test(navigator.userAgent) || 
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    
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
      renderWorldCopies: false, // Don't render map copies on sides
      preserveDrawingBuffer: false,
      maxZoom: 12, // Limit max zoom to reduce tile loading
      attributionControl: false, // Add manually if needed, saves rendering
    });
    
    // Force lower pixel ratio on slow devices for better performance
    if (isSlowDevice) {
      const canvas = map.getCanvas();
      canvas.style.imageRendering = 'optimizeSpeed';
    }

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    
    // Additional performance tweaks
    map.touchPitch.disable();

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
          <span>Kaart laden...</span>
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
