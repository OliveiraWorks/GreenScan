// ============================================================
// API Route: GET + POST /api/reports
// GET  → Lista reports confirmados (mapa público)
// POST → Cria nova denúncia: upload → análise → persistência
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeImage } from '@/lib/openrouter';
import { CreateReportPayload, WasteReport } from '@/lib/types';

// Limiar mínimo de confiança para aceitar uma denúncia
const CONFIDENCE_THRESHOLD = 0.65;

// ─────────────────────────────────────────────────────────────
// GET — Busca todos os reports públicos confirmados
// ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('id, created_at, latitude, longitude, address, severity, waste_types, description, status, image_url')
      .eq('has_waste', true)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error;

    return NextResponse.json(data as WasteReport[], {
      headers: {
        // Permite ISR de 60s no Next.js
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[GET /api/reports] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar denúncias.' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST — Fluxo completo: upload → análise → inserção
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateReportPayload & { user_id?: string };
    const { image_file, mime_type, latitude, longitude, address, user_id } = body;

    // Validação dos campos obrigatórios
    if (!image_file || !mime_type || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Campos image_file, mime_type, latitude e longitude são obrigatórios.' },
        { status: 400 }
      );
    }

    // ── 1. Upload da imagem para o Supabase Storage ──────────
    const imageBuffer = Buffer.from(image_file, 'base64');
    const extension = mime_type.split('/')[1] ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const storagePath = `public/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('report-images')
      .upload(storagePath, imageBuffer, {
        contentType: mime_type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[POST /api/reports] Erro no upload:', uploadError);
      return NextResponse.json(
        { error: 'Falha ao fazer upload da imagem.' },
        { status: 500 }
      );
    }

    // Gera URL pública da imagem
    const { data: urlData } = supabaseAdmin.storage
      .from('report-images')
      .getPublicUrl(storagePath);
    const image_url = urlData.publicUrl;

    // ── 2. Análise da imagem com o modelo de visão ───────────
    const analysis = await analyzeImage(image_file, mime_type);

    // ── 3. Validação do resultado: rejeita se sem descarte ───
    if (!analysis.has_waste || analysis.confidence < CONFIDENCE_THRESHOLD) {
      return NextResponse.json({
        accepted: false,
        reason:
          'Nenhum descarte irregular detectado na imagem. ' +
          `(Confiança: ${(analysis.confidence * 100).toFixed(0)}%)`,
      });
    }

    // ── 4. Inserção no banco de dados como confirmado ────────
    const insertPayload = {
      user_id: user_id ?? null,
      image_url,
      latitude,
      longitude,
      address: address ?? null,
      has_waste: analysis.has_waste,
      confidence: analysis.confidence,
      waste_types: analysis.waste_types,
      severity: analysis.severity,
      description: analysis.description,
      status: 'confirmed' as const,
    };

    const { data: report, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/reports] Erro na inserção:', insertError);
      return NextResponse.json(
        { error: 'Falha ao salvar a denúncia.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ accepted: true, report }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reports] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente.' },
      { status: 500 }
    );
  }
}
