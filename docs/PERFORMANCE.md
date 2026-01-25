# Performance Optimization - RevSend

Estratégias e implementações para otimizar o desempenho da aplicação.

## Dynamic Imports (Lazy Loading)

### Visão Geral

Dynamic imports reduzem o tamanho do bundle inicial carregando componentes apenas quando necessário, melhorando significativamente o tempo de carregamento inicial da página.

### Implementação com Next.js

Next.js oferece `next/dynamic` para lazy loading de componentes:

```typescript
import dynamic from 'next/dynamic'

// Componente lazy-loaded
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>Carregando...</div>,
  ssr: false, // Desabilita SSR se necessário
})

export default function Page() {
  return (
    <div>
      <HeavyComponent />
    </div>
  )
}
```

### Componentes que Devem Ser Lazy-Loaded

#### 1. Modais e Dialogs

Modais só são renderizados quando abertos, perfeitos para lazy loading:

```typescript
// src/components/campaigns/VariationsModal.tsx
import dynamic from 'next/dynamic'

const VariationsModal = dynamic(() => import('./VariationsModalContent'), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
})

export { VariationsModal }
```

**Componentes a otimizar:**
- ✅ TwoFactorSetup dialog
- ✅ VariationsModal (geração de variações com IA)
- ✅ MediaUpload modal
- ✅ TemplateSelector modal
- ✅ ContactListUpload

#### 2. Rich Text Editors

Editores de texto são pesados e devem ser lazy-loaded:

```typescript
const RichTextEditor = dynamic(() => import('@tiptap/react'), {
  ssr: false, // Editores geralmente precisam de window
  loading: () => <Skeleton className="h-64 w-full" />,
})
```

#### 3. Charts e Visualizações

Bibliotecas de gráficos são grandes:

```typescript
const CampaignChart = dynamic(() => import('@/components/reports/CampaignChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})
```

#### 4. Biblioteca de Mídia

Upload e preview de mídia:

```typescript
const MediaLibrary = dynamic(() => import('@/components/media/MediaLibrary'), {
  loading: () => <MediaLibrarySkeleton />,
})
```

### Exemplo Completo: Campaign Creation Wizard

```typescript
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Componentes leves (sempre carregados)
import { Header } from '@/components/dashboard/Header'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

// Componentes pesados (lazy-loaded)
const ListSelector = dynamic(() => import('@/components/campaigns/ListSelector'), {
  loading: () => <Skeleton className="h-64" />,
})

const MessageEditor = dynamic(() => import('@/components/campaigns/MessageEditor'), {
  loading: () => <Skeleton className="h-96" />,
})

const VariationsGenerator = dynamic(
  () => import('@/components/campaigns/VariationsGenerator'),
  {
    loading: () => <Loader2 className="h-8 w-8 animate-spin" />,
    ssr: false, // Desabilita SSR para componentes com IA
  }
)

const WhatsAppSelector = dynamic(
  () => import('@/components/campaigns/WhatsAppSelector'),
  {
    loading: () => <Skeleton className="h-48" />,
  }
)

const CampaignReview = dynamic(() => import('@/components/campaigns/CampaignReview'), {
  loading: () => <Skeleton className="h-96" />,
})

export default function NewCampaignPage() {
  const [step, setStep] = useState(1)

  return (
    <>
      <Header title="Nova Campanha" />

      <div className="p-6">
        {/* Step 1: Apenas carrega ListSelector */}
        {step === 1 && <ListSelector onNext={() => setStep(2)} />}

        {/* Step 2: Carrega MessageEditor quando necessário */}
        {step === 2 && <MessageEditor onNext={() => setStep(3)} />}

        {/* Step 3: Carrega VariationsGenerator quando necessário */}
        {step === 3 && <VariationsGenerator onNext={() => setStep(4)} />}

        {/* Step 4: Carrega WhatsAppSelector quando necessário */}
        {step === 4 && <WhatsAppSelector onNext={() => setStep(5)} />}

        {/* Step 5: Carrega CampaignReview quando necessário */}
        {step === 5 && <CampaignReview />}
      </div>
    </>
  )
}
```

**Benefícios:**
- ✅ Bundle inicial reduzido em ~60%
- ✅ Carrega componentes conforme necessário
- ✅ Loading states suaves
- ✅ Melhor UX para conexões lentas

### Importação Dinâmica de Bibliotecas

Para bibliotecas pesadas de terceiros:

```typescript
// Exemplo: QR Code generation
async function generateQRCode(data: string) {
  // Importa biblioteca apenas quando necessário
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(data)
}

// Exemplo: PDF generation
async function exportToPDF(data: any) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  // ...
  return doc.save('report.pdf')
}

// Exemplo: Excel export
async function exportToExcel(data: any[]) {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(data)
  // ...
}
```

## Code Splitting por Rota

Next.js automaticamente faz code splitting por rota:

```
pages/
├── dashboard/           → bundle-1.js
├── campaigns/          → bundle-2.js
│   ├── [id]/          → bundle-3.js (carrega sob demanda)
│   └── new/           → bundle-4.js (carrega sob demanda)
├── lists/             → bundle-5.js
└── settings/          → bundle-6.js
```

**Boas Práticas:**
- Manter páginas leves
- Lazy-load componentes pesados dentro de cada página
- Usar suspense boundaries para melhor UX

## Image Optimization

### Next.js Image Component

Sempre usar `next/image` para otimização automática:

```typescript
import Image from 'next/image'

export function MediaPreview({ url }: { url: string }) {
  return (
    <Image
      src={url}
      alt="Media preview"
      width={800}
      height={600}
      quality={85}
      loading="lazy" // Lazy loading nativo
      placeholder="blur" // Blur-up enquanto carrega
      blurDataURL="data:image/..." // Base64 blur
    />
  )
}
```

**Benefícios:**
- ✅ Lazy loading automático
- ✅ Compressão WebP/AVIF
- ✅ Responsive images
- ✅ Blur-up placeholder
- ✅ Previne layout shift

### Sharp para Processamento

Já implementado em `src/lib/storage/media-upload.ts`:

```typescript
import sharp from 'sharp'

export async function optimizeImage(buffer: Buffer) {
  const optimized = await sharp(buffer)
    .webp({ quality: 85 })
    .resize(1920, 1920, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer()

  return optimized
}
```

**Otimizações:**
- ✅ Conversão para WebP (reduz 30-50% do tamanho)
- ✅ Resize para tamanho máximo (1920x1920)
- ✅ Qualidade otimizada (85%)

## Font Optimization

### Next.js Font Optimization

```typescript
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Evita FOIT (Flash of Invisible Text)
  variable: '--font-inter',
})

const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**Benefícios:**
- ✅ Fontes auto-hospedadas (mais rápido)
- ✅ Subset loading (apenas latin)
- ✅ Font display swap (sem FOIT)
- ✅ Preload automático

## Database Query Optimization

### Prisma Query Optimization

```typescript
// ❌ Evitar N+1 queries
const campaigns = await prisma.campaign.findMany()
for (const campaign of campaigns) {
  const list = await prisma.contactList.findUnique({
    where: { id: campaign.listId },
  })
}

// ✅ Use includes para evitar N+1
const campaigns = await prisma.campaign.findMany({
  include: {
    list: true,
    messages: true,
    campaignNumbers: {
      include: {
        whatsappNumber: true,
      },
    },
  },
})

// ✅ Selecione apenas campos necessários
const campaigns = await prisma.campaign.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    totalSent: true,
    // Omite campos não necessários
  },
})

// ✅ Use pagination
const campaigns = await prisma.campaign.findMany({
  take: 20, // Limite
  skip: page * 20, // Offset
  orderBy: { createdAt: 'desc' },
})
```

### Database Indexes

Já implementados no schema:

```prisma
model Contact {
  // ...
  @@index([listId])
  @@index([phoneNumber])
}

model SentMessage {
  // ...
  @@index([campaignId])
  @@index([status])
}

model AuditLog {
  // ...
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

## API Response Optimization

### Compression

Enable gzip/brotli compression in production:

```javascript
// next.config.js
module.exports = {
  compress: true, // Enable gzip compression
}
```

### Response Caching

```typescript
// Cache para dados estáticos
export async function GET() {
  const data = await fetchStaticData()

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

// Sem cache para dados dinâmicos
export async function GET() {
  const data = await fetchUserData()

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
```

### Payload Size Reduction

```typescript
// ❌ Retornar tudo
return NextResponse.json({
  user: {
    id,
    email,
    name,
    passwordHash, // NUNCA!
    createdAt,
    updatedAt,
    twoFactorSecret, // NUNCA!
    // ... muitos campos
  },
})

// ✅ Retornar apenas necessário
return NextResponse.json({
  user: {
    id,
    email,
    name,
  },
})
```

## Client-Side Performance

### React Hooks Optimization

```typescript
// ❌ Recria função toda renderização
function Component() {
  const handleClick = () => {
    console.log('clicked')
  }

  return <Button onClick={handleClick} />
}

// ✅ useCallback para memoizar função
function Component() {
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])

  return <Button onClick={handleClick} />
}

// ❌ Recalcula todo render
function Component({ items }: { items: Item[] }) {
  const total = items.reduce((sum, item) => sum + item.price, 0)

  return <div>Total: {total}</div>
}

// ✅ useMemo para memoizar cálculo
function Component({ items }: { items: Item[] }) {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  )

  return <div>Total: {total}</div>
}
```

### Debounce para Inputs

```typescript
import { useState, useEffect } from 'react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function SearchComponent() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 500)

  useEffect(() => {
    if (debouncedSearch) {
      // Faz busca apenas após 500ms sem digitar
      performSearch(debouncedSearch)
    }
  }, [debouncedSearch])

  return <Input value={search} onChange={(e) => setSearch(e.target.value)} />
}
```

## Métricas de Performance

### Core Web Vitals

Objetivos para RevSend:

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Bundle Analysis

Analisar tamanho do bundle:

```bash
# Instalar analyzer
npm install -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ...config
})

# Rodar análise
ANALYZE=true npm run build
```

### Lighthouse

Rodar Lighthouse para avaliar performance:

```bash
# Chrome DevTools > Lighthouse
# Ou CLI:
npm install -g lighthouse
lighthouse https://revsend.com --view
```

**Targets:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

## Production Optimizations

### Environment Variables

```env
# .env.production
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Enable production optimizations
NEXT_PUBLIC_APP_URL=https://revsend.com
```

### Build Configuration

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true, // SWC minifier (mais rápido que Terser)
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'], // Formatos modernos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Breakpoints
  },

  // Remove console.logs em produção
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },
}
```

## Checklist de Otimizações

### Implementadas ✅

- [x] Image optimization com sharp (WebP conversion)
- [x] Database indexes (contacts, campaigns, audit logs)
- [x] Prisma query optimization (includes, select)
- [x] Railway Volumes para storage (local, rápido)
- [x] Next.js automatic code splitting
- [x] API response optimization

### A Implementar 📋

- [ ] Dynamic imports para componentes pesados
- [ ] Font optimization com next/font
- [ ] Bundle analysis e tree shaking
- [ ] Redis caching para queries frequentes
- [ ] CDN para assets estáticos
- [ ] Service Worker para offline support
- [ ] Preloading de rotas críticas

## Referências

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Core Web Vitals](https://web.dev/vitals/)
