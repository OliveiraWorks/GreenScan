// ============================================================
// OpenRouter — Análise de imagens com visão computacional
// Modelo: meta-llama/llama-4-maverick:free (suporta visão + system prompt)
// ============================================================
import { AnalysisResult } from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';

const SYSTEM_PROMPT = `Você é um modelo especializado em análise de imagens ambientais para o sistema GreenScan, uma plataforma de monitoramento de descarte irregular de resíduos sólidos.

Seu papel é analisar imagens enviadas por usuários e determinar com precisão se há resíduos sólidos descartados de forma inadequada no ambiente visível na foto.

Entenda como descarte inadequado:
- Lixo jogado em vias públicas, calçadas, terrenos baldios ou áreas verdes
- Acúmulo de resíduos fora de lixeiras ou contêineres oficiais
- Entulho, móveis ou objetos volumosos descartados irregularmente
- Sacolas de lixo fora de locais apropriados de coleta

Não considere como descarte inadequado:
- Lixeiras, contêineres ou bags de entulho devidamente posicionados
- Áreas de triagem ou reciclagem sinalizadas
- Imagens sem evidência clara de resíduos

Responda SEMPRE e APENAS com um objeto JSON válido, sem texto antes ou depois:
{
  "has_waste": true,
  "confidence": 0.95,
  "waste_types": ["lixo doméstico", "entulho"],
  "severity": "high",
  "description": "Descrição objetiva em português do que foi identificado na imagem"
}

Campos obrigatórios:
- has_waste: boolean
- confidence: número entre 0.0 e 1.0
- waste_types: array de strings (vazio se não houver lixo)
- severity: "low", "medium", "high" ou null
- description: string em português`;

export async function analyzeImage(
  image_base64: string,
  mime_type: string
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY não configurada no ambiente.');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': appUrl,
      'X-Title': 'GreenScan',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mime_type};base64,${image_base64}`,
              },
            },
            {
              type: 'text',
              text: 'Analise esta imagem e retorne APENAS o JSON conforme instruído.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Resposta vazia da OpenRouter API.');
  }

  // Remove possíveis markdown fences (```json ... ```)
  const clean = content.replace(/```json\n?|\n?```/g, '').trim();

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(clean) as AnalysisResult;
  } catch {
    throw new Error(`JSON inválido retornado pela IA: ${clean.slice(0, 200)}`);
  }

  if (typeof parsed.has_waste !== 'boolean' || typeof parsed.confidence !== 'number') {
    throw new Error('Formato de resposta inválido da IA.');
  }

  return parsed;
}