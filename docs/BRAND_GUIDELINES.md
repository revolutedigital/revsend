# RevSend Brand Guidelines

## Visão Geral

RevSend é uma plataforma de prospecção ativa via WhatsApp. Nossa marca transmite velocidade, confiabilidade e modernidade.

---

## Logo

### Logo Principal

O logo RevSend combina um foguete estilizado com tipografia moderna, representando velocidade e envio de mensagens.

### Variantes

- **Logo Completo**: Usado em headers e materiais de marketing
- **Ícone**: Usado em favicons, apps e espaços reduzidos
- **Mascote**: Usado em empty states, onboarding e momentos de celebração

### Espaçamento

Mantenha uma área de respiro mínima equivalente à altura do "R" em todas as direções ao redor do logo.

### Usos Incorretos

❌ Não distorça ou rotacione o logo
❌ Não altere as cores do logo
❌ Não adicione efeitos como sombras ou gradientes não aprovados
❌ Não coloque o logo sobre fundos de baixo contraste

---

## Paleta de Cores

### Cores Primárias

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Coral** | `#FF6B35` | `255, 107, 53` | CTAs, destaques, links ativos |
| **Mint** | `#00D9A5` | `0, 217, 165` | Sucesso, confirmações, badges positivos |
| **Navy** | `#0A1628` | `10, 22, 40` | Background principal, textos importantes |

### Cores Secundárias

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Gold** | `#FFD93D` | `255, 217, 61` | Avisos, favoritos, destaques especiais |
| **Coral Light** | `#FF8F5C` | `255, 143, 92` | Hovers, estados intermediários |
| **Mint Light** | `#4FFFCB` | `79, 255, 203` | Gráficos, ilustrações |

### Cores de Background

| Nome | Hex | Uso |
|------|-----|-----|
| **Navy 950** | `#0A1628` | Background principal |
| **Navy 900** | `#102A43` | Cards, containers |
| **Navy 800** | `#1A2D4A` | Hovers, bordas |
| **Navy 700** | `#2E4A6E` | Bordas, separadores |

### Cores Semânticas

| Nome | Hex | Uso |
|------|-----|-----|
| **Success** | `#00D9A5` | Mensagens de sucesso |
| **Warning** | `#FFD93D` | Alertas, avisos |
| **Error** | `#EF4444` | Erros, ações destrutivas |
| **Info** | `#3B82F6` | Informações neutras |

---

## Tipografia

### Fonte Display

**Space Grotesk** - Usada em títulos e headings

```css
font-family: 'Space Grotesk', sans-serif;
```

Weights: 500 (Medium), 600 (SemiBold), 700 (Bold)

### Fonte Body

**Inter** - Usada em textos e parágrafos

```css
font-family: 'Inter', sans-serif;
```

Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)

### Fonte Mono

**JetBrains Mono** - Usada em códigos e dados técnicos

```css
font-family: 'JetBrains Mono', monospace;
```

### Hierarquia de Tamanhos

| Nome | Tamanho | Line Height | Uso |
|------|---------|-------------|-----|
| **Display** | 48px | 1.1 | Hero, landing page |
| **H1** | 36px | 1.2 | Títulos de página |
| **H2** | 24px | 1.3 | Títulos de seção |
| **H3** | 20px | 1.4 | Subtítulos |
| **Body** | 16px | 1.5 | Texto principal |
| **Small** | 14px | 1.5 | Texto secundário |
| **XS** | 12px | 1.4 | Labels, captions |

---

## Iconografia

### Biblioteca

Utilizamos **Lucide React** como biblioteca de ícones principal.

### Tamanhos

- **Extra Small**: 12px (informações densas)
- **Small**: 16px (botões, listas)
- **Default**: 20px (navegação, cards)
- **Large**: 24px (destaque)

### Estilo

- Stroke width: 2px (padrão)
- Cantos: Arredondados
- Estilo: Outlined (não filled)

---

## Espaçamento

### Sistema de Grid

Baseado em múltiplos de 4px:

| Token | Valor | Uso |
|-------|-------|-----|
| **xs** | 4px | Micro-espaçamentos |
| **sm** | 8px | Entre elementos pequenos |
| **md** | 16px | Padding de componentes |
| **lg** | 24px | Entre seções |
| **xl** | 32px | Entre blocos maiores |
| **2xl** | 48px | Espaçamento de página |

### Padding de Componentes

- **Botões**: 12px vertical, 24px horizontal
- **Cards**: 16px ou 24px
- **Inputs**: 12px vertical, 16px horizontal
- **Modais**: 24px

---

## Componentes

### Botões

#### Variantes

1. **Primary** (Coral): Ações principais
2. **Secondary** (Navy 800): Ações secundárias
3. **Outline**: Ações terciárias
4. **Ghost**: Ações sutis
5. **Destructive** (Red): Ações de exclusão

#### Tamanhos

- **xs**: 28px altura
- **sm**: 32px altura
- **default**: 40px altura
- **lg**: 48px altura

### Cards

- Border radius: 12px
- Background: Navy 900
- Border: 1px Navy 700
- Hover: Elevação com sombra

### Inputs

- Border radius: 8px
- Background: Navy 900
- Border: 1px Navy 700
- Focus: Border Coral

---

## Motion

### Durações

| Token | Valor | Uso |
|-------|-------|-----|
| **fast** | 150ms | Hovers, pequenas mudanças |
| **normal** | 200ms | Transições padrão |
| **slow** | 300ms | Modais, overlays |
| **slower** | 500ms | Animações complexas |

### Easing

```css
/* Padrão */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Entrada */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);

/* Saída */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
```

### Acessibilidade

Respeitar `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Tom de Voz

### Características

- **Profissional**: Confiável e competente
- **Acessível**: Fácil de entender
- **Direto**: Sem rodeios
- **Amigável**: Humano, não robótico

### Exemplos

✅ "Sua campanha foi enviada com sucesso!"
❌ "O processo de envio da campanha foi concluído com êxito."

✅ "Conecte seu WhatsApp para começar"
❌ "Realize a vinculação do seu dispositivo WhatsApp"

### Microcopy

- Use verbos de ação
- Seja específico sobre o que vai acontecer
- Ofereça contexto quando necessário
- Confirme ações destrutivas

---

## Mascote

### RevRocket

Nosso mascote é um foguete amigável que aparece em momentos-chave:

#### Variantes

1. **Static**: Parado, para empty states
2. **Animated**: Com movimento, para loading
3. **Mini**: Versão compacta para ícones

#### Moods

1. **Happy**: Sorrindo, olhos normais
2. **Thinking**: Olhando para cima, bolha de pensamento
3. **Celebrating**: Olhos fechados felizes, confetti

#### Uso

- Empty states (thinking)
- Onboarding (happy)
- Conclusão de ações (celebrating)
- Loading states (animated)

---

## Aplicações

### Web

- Background: Navy 950
- Sidebar: Navy 900
- Cards: Navy 800
- Hovers: Navy 700

### Mobile

- Mesmas cores e tipografia
- Espaçamentos maiores para touch
- Ícones 24px mínimo

### Email

- Fundo claro quando necessário
- Fallback para fontes do sistema
- Cores com alto contraste

---

## Downloads

- [Logo SVG](/public/icon.svg)
- [Mascote SVG](/public/mascot.svg)
- [Design Tokens](/src/design-tokens.json)
- [Tailwind Config](/tailwind.config.ts)
