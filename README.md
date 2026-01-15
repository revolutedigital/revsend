# RevSend

Sistema de prospecção ativa via WhatsApp para disparo de mensagens em massa de forma segura.

## Cores da Marca

- **Azul Marinho**: `#101820`
- **Laranja**: `#ff7336`

## Stack Tecnológica

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Banco de Dados**: PostgreSQL
- **Cache/Filas**: Redis + BullMQ
- **ORM**: Prisma
- **Autenticação**: NextAuth.js
- **IA**: Anthropic Claude API
- **WhatsApp**: Baileys (API não-oficial)

## Requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

## Instalação

1. Clone o repositório:
```bash
git clone <repo-url>
cd revsend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o banco de dados e Redis:
```bash
docker compose up -d
```

5. Execute as migrations do Prisma:
```bash
npm run db:push
```

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

7. Acesse [http://localhost:3000](http://localhost:3000)

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run db:generate` - Gera o Prisma Client
- `npm run db:push` - Sincroniza o schema com o banco
- `npm run db:migrate` - Executa migrations
- `npm run db:studio` - Abre o Prisma Studio

## Estrutura do Projeto

```
revsend/
├── src/
│   ├── app/              # Rotas e páginas (App Router)
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários e configurações
│   ├── hooks/            # Custom hooks
│   └── types/            # Tipos TypeScript
├── prisma/               # Schema do banco de dados
├── public/               # Arquivos estáticos
└── docker-compose.yml    # Configuração Docker
```

## Deploy no Railway

### Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. CLI do Railway instalado (opcional): `npm install -g @railway/cli`

### Passo a Passo

1. Crie um novo projeto no Railway

2. Adicione os serviços necessários:
   - **PostgreSQL** - Clique em "Add Service" > "Database" > "PostgreSQL"
   - **Redis** - Clique em "Add Service" > "Database" > "Redis"

3. Conecte seu repositório GitHub ou faça deploy via CLI:
   ```bash
   railway login
   railway link
   railway up
   ```

4. Configure as variáveis de ambiente no Railway:
   - `DATABASE_URL` - Será preenchida automaticamente pelo PostgreSQL
   - `REDIS_URL` - Será preenchida automaticamente pelo Redis
   - `NEXTAUTH_SECRET` - Gere com: `openssl rand -base64 32`
   - `NEXTAUTH_URL` - URL do seu app no Railway (ex: https://revsend.up.railway.app)
   - `ANTHROPIC_API_KEY` - Sua chave da API Anthropic
   - `NEXT_PUBLIC_APP_URL` - Mesma URL do NEXTAUTH_URL
   - `NODE_ENV` - `production`

5. O deploy será automático após configurar as variáveis

### Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `REDIS_URL` | URL de conexão Redis |
| `NEXTAUTH_SECRET` | Chave secreta para JWT |
| `NEXTAUTH_URL` | URL pública do app |
| `ANTHROPIC_API_KEY` | Chave da API Claude |
| `NEXT_PUBLIC_APP_URL` | URL pública do app |

### Healthcheck

O app expõe um endpoint `/api/health` para verificação de saúde.

## Licença

Proprietário - Todos os direitos reservados.
