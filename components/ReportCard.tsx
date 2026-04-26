// ============================================================
// ReportCard — Card de uma denúncia individual
// ============================================================
import React from 'react';
import Image from 'next/image';
import { WasteReport } from '@/lib/types';
import SeverityBadge from './SeverityBadge';

interface ReportCardProps {
  report: WasteReport;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReportCard({ report }: ReportCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden animate-fadeIn group">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        <Image
          src={report.image_url}
          alt={`Denúncia em ${report.address ?? 'local desconhecido'}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {/* Status overlay */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full font-inter ${
            report.status === 'confirmed'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : report.status === 'rejected'
              ? 'bg-red-100 text-red-800 border border-red-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            {report.status === 'confirmed' ? '✓ Confirmado' : report.status === 'rejected' ? '✗ Rejeitado' : '⏳ Pendente'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Date and severity */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-gray-400 font-inter">
            {formatDate(report.created_at)}
          </span>
          <SeverityBadge severity={report.severity} size="sm" />
        </div>

        {/* Address */}
        {report.address && (
          <p className="text-sm text-gray-600 font-inter flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#3B6D11] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{report.address}</span>
          </p>
        )}

        {/* Waste types */}
        {report.waste_types && report.waste_types.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {report.waste_types.map((type, i) => (
              <span
                key={i}
                className="text-xs bg-[#EBF5DC] text-[#3B6D11] border border-green-200 rounded-lg px-2 py-0.5 font-inter"
              >
                {type}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 font-inter line-clamp-2 leading-relaxed">
          {report.description}
        </p>

        {/* Confidence */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-inter">Confiança da IA:</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#97C459] to-[#3B6D11] rounded-full transition-all"
              style={{ width: `${Math.round(report.confidence * 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[#3B6D11] font-inter">
            {Math.round(report.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
