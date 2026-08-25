// src/app/admin/_components/formElements/map/LocationPickerModal.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input, Button } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';

export default function LocationPickerModal({
  initialLat = 24.8607,
  initialLng = 67.0011,
  city = 'Karachi',
  onLocationSelect,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically inject Leaflet CSS & JS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      initMap();
    };
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const defaultLat = coords.lat || 24.8607;
    const defaultLng = coords.lng || 67.0011;

    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', function (e) {
      const position = marker.getLatLng();
      setCoords({ lat: position.lat, lng: position.lng });
      if (onLocationSelect) {
        onLocationSelect({ latitude: position.lat, longitude: position.lng });
      }
    });

    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      if (onLocationSelect) {
        onLocationSelect({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    });

    setIsMapReady(true);
  };

  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;
    try {
      const fullQuery = `${searchQuery}, ${city}, Pakistan`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(first.lat);
        const newLng = parseFloat(first.lon);

        setCoords({ lat: newLat, lng: newLng });
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 15);
          markerRef.current.setLatLng([newLat, newLng]);
        }
        if (onLocationSelect) {
          onLocationSelect({ latitude: newLat, longitude: newLng, displayName: first.display_name });
        }
      }
    } catch (err) {
      console.error('Geo lookup failed:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder={`Search landmark or street in ${city} (e.g. Clifton Block 4, Bilawal House)...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearchAddress}
          prefix={<EnvironmentOutlined className="text-amber-500" />}
          className="h-10 rounded-xl"
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearchAddress}
          className="h-10 bg-[#ffc400] hover:bg-[#e0b210] text-black font-bold border-none rounded-xl"
        >
          Locate
        </Button>
      </div>

      {/* Interactive Map View */}
      <div
        ref={mapRef}
        className="w-full h-56 rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-100 z-0"
      />

      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
        <span>
          Selected Latitude: <strong className="text-neutral-900">{coords.lat.toFixed(5)}</strong>
        </span>
        <span>
          Selected Longitude: <strong className="text-neutral-900">{coords.lng.toFixed(5)}</strong>
        </span>
      </div>
    </div>
  );
}