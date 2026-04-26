// ============================================================
// Tipos TypeScript centrais do GreenScan
// ============================================================

/** Representa uma denúncia de descarte irregular no banco de dados */
export interface WasteReport {
  id: string;
  created_at: string;
  user_id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  address?: string;
  has_waste: boolean;
  confidence: number;
  waste_types: string[];
  severity: 'low' | 'medium' | 'high' | null;
  description: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

/** Resultado da análise de imagem pela IA */
export interface AnalysisResult {
  has_waste: boolean;
  confidence: number;
  waste_types: string[];
  severity: 'low' | 'medium' | 'high' | null;
  description: string;
}

/** Payload enviado ao endpoint de criação de denúncia */
export interface CreateReportPayload {
  image_file: string; // base64
  mime_type: string;
  latitude: number;
  longitude: number;
  address?: string;
}

/** Resposta da API ao criar uma denúncia */
export interface CreateReportResponse {
  accepted: boolean;
  reason?: string;
  report?: WasteReport;
}
