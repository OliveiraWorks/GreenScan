'use client';
// ============================================================
// LocationPicker — Mini mapa clicável para seleção de local
// Deve ser importado com dynamic import + ssr: false
// ============================================================
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ícone do marcador de seleção
const PIN_ICON = L.divIcon({
    className: '',
    html: `<div style="
    width: 28px; height: 28px;
    background: #3B6D11;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

interface ClickHandlerProps {
    onSelect: (lat: number, lng: number) => void;
}

function ClickHandler({ onSelect }: ClickHandlerProps) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface LocationPickerProps {
    latitude: number | null;
    longitude: number | null;
    onSelect: (lat: number, lng: number) => void;
}

export default function LocationPicker({ latitude, longitude, onSelect }: LocationPickerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const center: [number, number] = latitude && longitude
        ? [latitude, longitude]
        : [-14.235, -51.925];

    const zoom = latitude && longitude ? 14 : 4;

    return (
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#97C459]" style={{ height: 220 }}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler onSelect={onSelect} />
                {latitude && longitude && (
                    <Marker position={[latitude, longitude]} icon={PIN_ICON} />
                )}
            </MapContainer>

            {/* Instrução flutuante */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[999] bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full px-3 py-1 shadow text-xs text-gray-600 whitespace-nowrap pointer-events-none">
                {latitude ? '📍 Clique para mover o ponto' : '👆 Clique no mapa para marcar o local'}
            </div>
        </div>
    );
}