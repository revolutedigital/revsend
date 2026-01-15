# Changelog - RevSend

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0] - 2026-01-14

### Adicionado

#### Deploy em Railway
- Arquivo `railway.toml` para configuração do deploy
- Endpoint `/api/health` para healthcheck
- Documentação de deploy no README.md
- Atualização do `.env.example` com variáveis de produção

---

## [0.4.0] - 2026-01-14

### Adicionado

#### Templates de Mensagens
- Nova tabela `message_templates` no banco de dados
- CRUD completo de templates (`/api/templates`)
- Página de gerenciamento de templates (`/dashboard/templates`)
- Categorização de templates (Prospecção, Follow-up, Nutrição, Reativação)
- Suporte a mídia nos templates (imagem, áudio, vídeo)
- Contador de uso de cada template
- Integração com wizard de campanhas (importar template como mensagem)
- Link de Templates na sidebar

#### Webhooks para Integração
- Nova tabela `webhooks` no banco de dados
- CRUD completo de webhooks (`/api/webhooks`)
- Dispatcher de webhooks com assinatura HMAC-SHA256
- Eventos suportados:
  - `campaign.started` - Campanha iniciada
  - `campaign.completed` - Campanha concluída
  - `campaign.paused` - Campanha pausada
  - `message.sent` - Mensagem enviada
  - `message.failed` - Mensagem falhou
  - `reply.received` - Resposta recebida
- Endpoint de teste de webhook (`/api/webhooks/[id]/test`)
- Componente `WebhookManager` na página de configurações
- Limite de 10 webhooks por usuário
- Visualização de secret com opção de copiar
- Toggle de ativação/desativação de webhooks
- Registro de último erro e última chamada

---

## [0.3.0] - 2026-01-14

### Adicionado

#### Envio de Mídia (Imagem, Áudio e Vídeo)
- Upload de arquivos de mídia via API (`/api/media/upload`)
- Suporte a imagens (JPEG, PNG, GIF, WebP)
- Suporte a áudios (MP3, OGG, WAV, AAC, M4A)
- Suporte a vídeos (MP4, WebM, MOV)
- Limite de 16MB por arquivo
- Armazenamento local em `/public/uploads`
- Componente `MediaUpload` para seleção de mídia
- Preview de mídia no editor de mensagens
- Cada mensagem pode ter um tipo de mídia diferente
- Áudios enviados como mensagem de voz (PTT)

#### Agendamento de Campanhas
- Novo campo `scheduledAt` nas campanhas
- Opção de agendar campanha para data/hora específica
- Seletor de data/hora no wizard de criação
- Status "scheduled" para campanhas agendadas
- Worker de agendamento com BullMQ
- Cancelamento de campanhas agendadas
- Verificação de campanhas pendentes ao iniciar servidor

#### Melhorias no Editor de Mensagens
- Interface renovada com cards por mensagem
- Indicadores visuais de tipo de mídia anexada
- Dicas de uso de variáveis e mídia
- Preview de imagens no editor
- Contador de mensagens com mídia na revisão

#### Atualizações no Schema
- Novos campos em `campaign_messages`: `media_type`, `media_url`, `media_name`
- Nova tabela `media_files` para gerenciamento de uploads
- Campo `scheduled_at` em `campaigns`

#### APIs Atualizadas
- `/api/campaigns` - Suporte a agendamento e mídia nas mensagens
- `/api/media/upload` - Nova API para upload de arquivos

---

## [0.2.0] - 2026-01-14

### Adicionado

#### Upload de Listas com IA
- Upload de planilhas CSV e XLSX via drag-and-drop
- Normalização automática de campos com Claude AI
- Identificação inteligente de campos de telefone, nome, email
- Normalização de números de telefone para formato brasileiro (+55)
- Componente `UploadDropzone` com feedback visual

#### Gestão de WhatsApp
- CRUD completo de números de WhatsApp
- Limite de 4 números por usuário
- Integração com Baileys (API não-oficial)
- Conexão via QR Code
- Status em tempo real (conectado/desconectado)
- Componente `WhatsAppManager` para gerenciamento

#### Sistema de Campanhas
- Criação de campanhas com wizard de 5 passos
- Seleção de lista de contatos
- Editor de mensagens com até 10 variações
- Geração de variações com IA (Claude)
- Configuração de intervalos (min/max segundos)
- Seleção de números de WhatsApp
- Status de campanha (rascunho, enviando, pausada, concluída, cancelada)

#### Motor de Disparo
- Sistema de filas com BullMQ
- Processamento assíncrono de mensagens
- Rotação inteligente de mensagens e números
- Intervalos aleatórios para evitar bloqueio
- Substituição de variáveis ({nome}, etc)
- Controle de pausar/retomar campanhas

#### Respostas
- Captura de respostas via Baileys
- Listagem de respostas com paginação
- Link direto para responder via WhatsApp

#### Relatórios
- Dashboard de estatísticas gerais
- Taxa de resposta por campanha
- Desempenho por número de WhatsApp
- Contadores de enviadas, falhas e respostas

#### APIs Criadas
- `/api/lists` - CRUD de listas
- `/api/lists/upload` - Upload de planilhas
- `/api/lists/[id]/contacts` - Contatos da lista
- `/api/whatsapp` - CRUD de números
- `/api/whatsapp/[id]/connect` - Conexão via QR
- `/api/whatsapp/[id]/status` - Status de conexão
- `/api/whatsapp/[id]/disconnect` - Desconexão
- `/api/campaigns` - CRUD de campanhas
- `/api/campaigns/[id]/start` - Iniciar disparo
- `/api/campaigns/[id]/pause` - Pausar disparo
- `/api/ai/variations` - Geração de variações
- `/api/replies` - Listagem de respostas
- `/api/reports` - Relatórios

---

## [0.1.0] - 2026-01-14

### Adicionado

#### Estrutura do Projeto
- Criado projeto Next.js 14 com TypeScript e App Router
- Configurado Tailwind CSS com as cores da marca RevSend
  - Azul Marinho: `#101820`
  - Laranja: `#ff7336`
- Instalado e configurado shadcn/ui para componentes de interface
- Criado mascote/logo SVG do RevSend (foguete com balão de mensagem)

#### Banco de Dados
- Configurado Prisma ORM com PostgreSQL
- Criado schema completo com as seguintes tabelas:
  - `users` - Usuários do sistema
  - `whatsapp_numbers` - Números de WhatsApp cadastrados
  - `contact_lists` - Listas de contatos
  - `contacts` - Contatos individuais
  - `campaigns` - Campanhas de disparo
  - `campaign_messages` - Variações de mensagens (até 10)
  - `campaign_numbers` - WhatsApps selecionados por campanha
  - `sent_messages` - Log de mensagens enviadas
  - `replies` - Respostas recebidas

#### Infraestrutura
- Criado Docker Compose com PostgreSQL 16 e Redis 7
- Configurado Redis para cache e filas (BullMQ)
- Criado arquivo `.env.example` com variáveis de ambiente

#### Autenticação
- Implementado NextAuth.js v5 com credenciais (email/senha)
- Criada página de login (`/login`)
- Criada página de registro (`/register`)
- Criada API de registro de usuários (`/api/auth/register`)
- Hash de senhas com bcryptjs

#### Dashboard
- Criado layout base do dashboard com sidebar
- Implementada página principal com estatísticas
- Criadas páginas de navegação

#### Componentes UI
- Criados componentes base: Button, Input, Label, Card, Dialog, DropdownMenu
- Criado componente de logo `RevSendLogo` e `RevSendLogoCompact`
- Criado componente `Sidebar` com navegação
- Criado componente `Header` do dashboard

---

## Roadmap Concluído

### Versão 1.0.0 - Completa!
- [x] Envio de áudio
- [x] Envio de imagem
- [x] Envio de vídeo
- [x] Agendamento de campanhas
- [x] Templates de mensagens
- [x] Webhooks para integração
- [x] Deploy em Railway
