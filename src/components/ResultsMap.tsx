import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../types';
import type { Guess, QuizPhoto } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ResultsMapProps {
  photo: QuizPhoto;
  guesses: Guess[];
}

export function ResultsMap({ photo, guesses }: ResultsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { isChristmas } = useTheme();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Detect older/slower devices
    const isSlowDevice = /iPad|iPhone/.test(navigator.userAgent) || 
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: isChristmas
        ? 'mapbox://styles/maxmijn/cmj4oe05b00bd01se3bmc7can'
        : 'mapbox://styles/mapbox/outdoors-v12',
      zoom: 2,
      center: [photo.lng, photo.lat],
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
    });
    
    // Force lower pixel ratio on slow devices for better performance
    if (isSlowDevice) {
      const canvas = map.getCanvas();
      canvas.style.imageRendering = 'optimizeSpeed';
    }

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();

    map.on('load', () => {
      // Hide labels
      const style = map.getStyle();
      style?.layers?.forEach((layer) => {
        if (layer.type === 'symbol') {
          try {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          } catch {
            // Ignore
          }
        }
      });

      const bounds = new mapboxgl.LngLatBounds();
      const trueLocation: [number, number] = [photo.lng, photo.lat];

      // Add true location marker
      const answerEl = document.createElement('div');
      answerEl.className = 'custom-marker answer-marker';
      answerEl.style.backgroundColor = '#2ECC71';

      new mapboxgl.Marker({ element: answerEl })
        .setLngLat(trueLocation)
        .addTo(map);
      bounds.extend(trueLocation);

      // Add player guesses with delayed lines
      guesses.forEach((guess, index) => {
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.style.backgroundColor = guess.playerColor;

        new mapboxgl.Marker({ element: markerEl })
          .setLngLat(guess.coordinates)
          .addTo(map);
        bounds.extend(guess.coordinates);

        // Add line after delay (shorter delay on slow devices)
        const lineDelay = isSlowDevice ? 150 : 300;
        setTimeout(() => {
          const sourceId = `line-${index}`;
          const layerId = `line-layer-${index}`;

          if (map.getSource(sourceId)) return;

          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [guess.coordinates, trueLocation],
              },
            },
          });

          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': guess.playerColor,
              'line-width': 3,
              'line-opacity': 0.8,
              // Solid lines are faster to render than dashed
              ...(isSlowDevice ? {} : { 'line-dasharray': [2, 2] }),
            },
          });
        }, lineDelay * index);
      });

      // Fit bounds - use jumpTo on slow devices instead of animated fitBounds
      setTimeout(() => {
        if (isSlowDevice) {
          const center = bounds.getCenter();
          map.jumpTo({
            center: [center.lng, center.lat],
            zoom: Math.min(10, map.getZoom() + 2),
          });
        } else {
          map.fitBounds(bounds, {
            padding: 60,
            maxZoom: 10,
            duration: 1000,
          });
        }
      }, 100);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [photo, guesses, isChristmas]);

  return <div ref={mapContainerRef} className="results-map-container" />;
}
