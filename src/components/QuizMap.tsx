import { useEffect, useRef, useCallback } from 'react';
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

  const getMapStyle = useCallback(() => {
    return isChristmas
      ? 'mapbox://styles/maxmijn/cmj4oe05b00bd01se3bmc7can'
      : 'mapbox://styles/mapbox/streets-v12';
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
      cooperativeGestures: true,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on('load', () => {
      map.resize();
      hideMapLabels(map);
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

  // Reset map view when no guess
  useEffect(() => {
    const map = mapRef.current;
    if (!map || guessCoordinates) return;

    map.flyTo({
      center: [0, 20],
      zoom: 1.5,
      duration: 500,
    });
  }, [guessCoordinates]);

  return <div ref={mapContainerRef} className="map-container" />;
}
