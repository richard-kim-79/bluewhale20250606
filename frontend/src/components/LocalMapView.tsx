'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ContentLocation {
  id: string;
  title: string;
  location: {
    lat: number;
    lng: number;
  };
  type: 'text' | 'pdf';
  aiScore: number;
}

interface LocalMapViewProps {
  contents: ContentLocation[];
  onContentSelect: (contentId: string) => void;
}

const LocalMapView = ({ contents, onContentSelect }: LocalMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Seoul if location access is denied
          setUserLocation({
            lat: 37.5665,
            lng: 126.9780,
          });
        }
      );
    } else {
      // Default to Seoul if geolocation is not supported
      setUserLocation({
        lat: 37.5665,
        lng: 126.9780,
      });
    }
  }, []);

  // Initialize map once we have the user location
  useEffect(() => {
    if (!mapContainer.current || !userLocation) return;

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
      center: [userLocation.lng, userLocation.lat],
      zoom: 13
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker
    new mapboxgl.Marker({ color: '#3B82F6' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current)
      .setPopup(new mapboxgl.Popup().setHTML('<strong>내 위치</strong>'));

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userLocation]);

  // Add content markers when map is loaded and contents change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add content markers
    contents.forEach(content => {
      const el = document.createElement('div');
      el.className = 'content-marker';
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = content.type === 'pdf' ? '#DBEAFE' : '#D1FAE5';
      el.style.border = '2px solid';
      el.style.borderColor = content.type === 'pdf' ? '#3B82F6' : '#10B981';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '10px';
      el.style.color = content.type === 'pdf' ? '#1E40AF' : '#047857';
      el.style.cursor = 'pointer';
      el.innerHTML = content.aiScore.toString();

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<strong>${content.title}</strong><br/>
         <span style="color: ${content.type === 'pdf' ? '#3B82F6' : '#10B981'}">
           ${content.type === 'pdf' ? 'PDF' : 'TEXT'}
         </span>`
      );

      const marker = new mapboxgl.Marker(el)
        .setLngLat([content.location.lng, content.location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onContentSelect(content.id);
      });

      markers.current.push(marker);
    });
  }, [contents, mapLoaded, onContentSelect]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200">
      <div className="w-full h-full" ref={mapContainer}>
        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">Mapbox token is missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalMapView;
