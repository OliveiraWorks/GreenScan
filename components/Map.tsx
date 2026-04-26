'use client';
// ============================================================
// Map — Componente de mapa interativo com react-leaflet
// IMPORTANTE: deve ser importado com dynamic import + ssr:false
// ============================================================
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WasteReport } from '@/lib/types';
import SeverityBadge from './SeverityBadge';

// Corrige os ícones quebrados do Leaflet no Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Cores por severidade
const SEVERITY_COLORS: Record<string, string> = {
  low: '#639922',
  medium: '#BA7517',
  high: '#A32D2D',
  unknown: '#6B7280',
};

/** Cria um ícone SVG circular colorido por severidade */
function createSeverityIcon(severity: string | null): L.DivIcon {
  const color = SEVERITY_COLORS[severity ?? 'unknown'] ?? SEVERITY_COLORS.unknown;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: markerFadeIn 0.4s ease-out forwards;
      "></div>
      <style>
        @keyframes markerFadeIn {
          from { opacity: 0; transform: rotate(-45deg) scale(0.5) translateY(-10px); }
          to   { opacity: 1; transform: rotate(-45deg) scale(1) translateY(0); }
        }
      </style>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -32],
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Componente para atualizar o view quando os reports chegam


interface MapComponentProps {
  reports: WasteReport[];
}

// Coordenadas centrais do Brasil
const BRAZIL_CENTER: [number, number] = [-14.235, -51.925];
const INITIAL_ZOOM = 4;

export default function MapComponent({ reports }: MapComponentProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <MapContainer
      center={BRAZIL_CENTER}
      zoom={INITIAL_ZOOM}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude]}
          icon={createSeverityIcon(report.severity)}
        >
          <Popup maxWidth={280} className="greenscan-popup">
            <div className="font-inter text-gray-800 w-64">
              <div className="relative h-36 -mx-3 -mt-3 mb-3 rounded-t-lg overflow-hidden bg-gray-100">
                <img src={report.image_url} alt="Descarte irregular" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <SeverityBadge severity={report.severity} size="sm" />
                <span className="text-xs text-gray-400">{formatDate(report.created_at)}</span>
              </div>
              {report.address && (
                <p className="text-xs text-gray-500 mb-2">{report.address}</p>
              )}
              {report.waste_types?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {report.waste_types.map((type, i) => (
                    <span key={i} className="text-xs bg-[#EBF5DC] text-[#3B6D11] rounded px-1.5 py-0.5">{type}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{report.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}