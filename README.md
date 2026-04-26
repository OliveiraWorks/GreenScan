# GreenScan 🌿

**Plataforma colaborativa de monitoramento de descarte irregular de resíduos sólidos.**

Cidadãos fotografam lixo descartado incorretamente, enviam pelo sistema, um modelo de visão (Google Gemini via OpenRouter) analisa a imagem e, se confirmado, o registro aparece num **mapa público em tempo real**.

---

## ✨ Funcionalidades

- 📸 **Upload de imagem** com drag & drop e preview inline
- 🤖 **Análise por IA** via OpenRouter (Google Gemini 2.0 Flash Lite)
- 🗺️ **Mapa interativo** com marcadores coloridos por severidade (Leaflet)
- 📍 **Geolocalização automática** + reverse geocoding via OpenStreetMap Nominatim
- 🔐 **Autenticação** via Supabase (magic link por email)
- 📊 **Dashboard pessoal** com estatísticas e histórico de denúncias
- ⚡ **Tempo real** — mapa atualiza a cada 60 segundos

---

## 🖼️ Interface

```
┌─────────────────────────────────────────────────────────────┐
│  🌿 GreenScan         [42 denúncias]    [Reportar] [Entrar] │  ← Navbar
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           🗺️  MAPA INTERATIVO FULLSCREEN                   │
│         (marcadores 🔴 Alta  🟡 Média  🟢 Baixa)           │
│                                                             │
│  ┌────────────┐                          ┌──────────────┐  │
│  │ Legenda    │                          │  + Reportar  │  │  ← FAB
│  └────────────┘                          └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuito)
- Conta no [OpenRouter](https://openrouter.ai) (gratuito)

### 1. Instalar dependências

```bash
cd GreenScan
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local` com suas chaves:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
OPENROUTER_API_KEY=sua_openrouter_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar o Supabase

#### 3.1 — Criar a tabela `reports`

Acesse o **SQL Editor** no painel do Supabase e execute:

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id),
  image_url text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  has_waste boolean not null,
  confidence float,
  waste_types text[],
  severity text check (severity in ('low', 'medium', 'high')),
  description text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'rejected'))
);

-- Políticas de Row Level Security
alter table reports enable row level security;

create policy "Public read confirmed reports"
  on reports for select
  using (has_waste = true and status = 'confirmed');

create policy "Authenticated users can insert"
  on reports for insert
  with check (auth.uid() = user_id);
```

#### 3.2 — Criar o bucket de armazenamento

1. Vá em **Storage** → **New Bucket**
2. Nome: `report-images`
3. Marque **Public bucket** ✅
4. Em **Policies**, adicione:
   - **SELECT**: `true` (leitura pública)
   - **INSERT**: `auth.role() = 'authenticated'` (upload autenticado)

#### 3.3 — Habilitar autenticação por Magic Link

1. Vá em **Authentication** → **Providers**
2. Habilite **Email** com **Magic Link** ✅

### 4. Obter as chaves

#### Supabase
- Acesse: [app.supabase.com](https://app.supabase.com)
- Selecione seu projeto → **Settings** → **API**
- Copie: **Project URL**, **anon public key**, **service_role key**

#### OpenRouter
- Acesse: [openrouter.ai/keys](https://openrouter.ai/keys)
- Crie uma nova API key
- O modelo `google/gemini-2.0-flash-lite` tem camada gratuita generosa

### 5. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Estrutura de Pastas

```
GreenScan/
├── app/
│   ├── layout.tsx              # Layout global (fonts, metadata)
│   ├── page.tsx                # Página inicial — mapa fullscreen
│   ├── globals.css             # Estilos globais + Leaflet overrides
│   ├── report/
│   │   └── page.tsx            # Página dedicada de denúncia
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard do usuário (protegido)
│   └── api/
│       ├── analyze/
│       │   └── route.ts        # POST — Análise de imagem via IA
│       └── reports/
│           └── route.ts        # GET/POST — CRUD de denúncias
├── components/
│   ├── Map.tsx                 # Mapa Leaflet com marcadores
│   ├── Navbar.tsx              # Barra de navegação
│   ├── ReportCard.tsx          # Card de denúncia individual
│   ├── ReportForm.tsx          # Formulário de envio
│   └── SeverityBadge.tsx       # Badge de severidade
├── lib/
│   ├── supabase.ts             # Clientes Supabase (browser + admin)
│   ├── openrouter.ts           # Integração com OpenRouter API
│   └── types.ts                # Tipos TypeScript centrais
├── .env.local                  # Variáveis de ambiente (NÃO faça commit!)
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🤖 Como funciona a análise por IA

```
Usuário envia foto
       │
       ▼
POST /api/reports
       │
       ├── 1. Upload → Supabase Storage (report-images/)
       │
       ├── 2. Análise → OpenRouter API
       │       └── Modelo: google/gemini-2.0-flash-lite
       │       └── Retorna: { has_waste, confidence, waste_types, severity, description }
       │
       ├── 3. Validação
       │       ├── has_waste = false  →  { accepted: false, reason: "..." }
       │       └── confidence < 0.65  →  { accepted: false, reason: "..." }
       │
       └── 4. Persistência → Supabase PostgreSQL (status: 'confirmed')
                └── Aparece no mapa público imediatamente
```

### Limiar de aceitação

O sistema aceita uma denúncia apenas se:
- `has_waste === true` E
- `confidence >= 0.65` (65% de certeza mínima)

Isso evita falsos positivos e garante qualidade dos dados no mapa.

---

## 🎨 Design

- **Paleta**: Verde escuro `#3B6D11` (primário) + Verde claro `#97C459` (acento)
- **Tipografia**: [Syne](https://fonts.google.com/specimen/Syne) (títulos) + [Inter](https://fonts.google.com/specimen/Inter) (corpo)
- **Severidade no mapa**:
  - 🟢 Baixa → `#639922`
  - 🟡 Média → `#BA7517`
  - 🔴 Alta → `#A32D2D`

---

## 🌐 Deploy no Vercel

```bash
# Instale o CLI do Vercel
npm i -g vercel

# Deploy
vercel --prod
```

Configure as variáveis de ambiente no painel do Vercel em **Settings → Environment Variables**.

---

## 📝 Licença

MIT — livre para uso, modificação e distribuição.

---

> Feito com 💚 para um Brasil mais limpo.
