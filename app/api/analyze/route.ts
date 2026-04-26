// ============================================================
// API Route: POST /api/analyze
// Recebe imagem em base64 → chama OpenRouter → retorna AnalysisResult
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_base64, mime_type } = body as {
      image_base64: string;
      mime_type: string;
    };

    if (!image_base64 || !mime_type) {
      return NextResponse.json(
        { error: 'Campos image_base64 e mime_type são obrigatórios.' },
        { status: 400 }
      );
    }

    // Valida tipo MIME aceito
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(mime_type)) {
      return NextResponse.json(
        { error: 'Tipo de imagem não suportado. Use JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Chama o modelo de visão via OpenRouter
    const result = await analyzeImage(image_base64, mime_type);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/analyze] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao analisar a imagem. Tente novamente.' },
      { status: 500 }
    );
  }
}
