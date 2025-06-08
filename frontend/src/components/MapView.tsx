'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  location: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

const MapView = ({ location, zoom = 15 }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      console.error('Mapbox token is missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [location.lng, location.lat],
      zoom: zoom
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    marker.current = new mapboxgl.Marker({ color: '#3B82F6' })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location, zoom]);

  useEffect(() => {
    if (map.current && marker.current) {
      map.current.setCenter([location.lng, location.lat]);
      marker.current.setLngLat([location.lng, location.lat]);
    }
  }, [location]);

  return (
    <div className="w-full h-full" ref={mapContainer}>
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Mapbox token is missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.</p>
        </div>
      )}
    </div>
  );
};

export default MapView;
