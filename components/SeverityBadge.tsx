// ============================================================
// SeverityBadge — Badge visual de severidade de uma denúncia
// ============================================================
import React from 'react';

interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | null;
  size?: 'sm' | 'md';
}

const config = {
  low: {
    label: 'Baixa',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-[#639922]',
  },
  medium: {
    label: 'Média',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-[#BA7517]',
  },
  high: {
    label: 'Alta',
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-[#A32D2D]',
  },
  null: {
    label: 'Desconhecida',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
  },
};

export default function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const key = severity ?? 'null';
  const c = config[key as keyof typeof config];

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium font-inter ${c.bg} ${c.text} ${c.border} ${sizeClasses}`}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} />
      Severidade {c.label}
    </span>
  );
}
