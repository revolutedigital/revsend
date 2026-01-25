# Railway Storage Setup

Este guia explica como configurar o armazenamento de mídia no Railway usando Volumes.

## Por que Railway Volumes?

Railway Volumes são volumes persistentes que:
- Sobrevivem a deploys e restarts
- São montados diretamente no sistema de arquivos
- Não requerem configuração de serviços externos
- São mais simples que S3/R2
- Mantém tudo dentro do Railway

## Configuração no Railway

### 1. Criar um Volume

No dashboard do Railway:

1. Vá para o seu projeto RevSend
2. Selecione o service (seu app Next.js)
3. Clique em **"Settings"** → **"Volumes"**
4. Clique em **"+ New Volume"**
5. Configure:
   - **Mount Path**: `/app/storage`
   - **Size**: 10GB (ou o necessário)
6. Clique em **"Add"**

### 2. Configurar Variável de Ambiente

Ainda no Railway, vá em **"Variables"** e adicione:

```
STORAGE_DIR=/app/storage
```

### 3. Deploy

O Railway irá automaticamente fazer redeploy após adicionar o volume.

## Como Funciona

### Estrutura de Diretórios

```
/app/storage/
├── image/
│   └── user-id/
│       └── timestamp-random-filename.webp
├── audio/
│   └── user-id/
│       └── timestamp-random-audio.mp3
└── video/
    └── user-id/
        └── timestamp-random-video.mp4
```

### URLs Públicas

Os arquivos são servidos através da API route `/api/storage/[...path]`:

```
https://seu-app.railway.app/storage/image/user-123/1234567890-abc123-photo.webp
```

### Otimizações Automáticas

- **Imagens**: Convertidas para WebP e redimensionadas (max 1920x1920)
- **Compressão**: Quality 85% para balance entre qualidade e tamanho
- **Cache**: Headers de cache imutáveis (1 ano)

## Limites e Considerações

### Tamanhos Máximos
- Imagens: 10MB
- Áudio: 20MB
- Vídeo: 100MB

### Formatos Suportados

**Imagens**:
- JPEG, PNG, WebP, GIF

**Áudio**:
- MP3, OGG, WAV, AAC, M4A

**Vídeo**:
- MP4, WebM, MOV

## Monitoramento

### Verificar Uso do Volume

No Railway dashboard:
1. Vá em **"Metrics"**
2. Veja **"Disk Usage"**

### Limpar Arquivos Antigos (Opcional)

Você pode criar um cron job para limpar arquivos não utilizados:

```typescript
// Exemplo: deletar mídias órfãs (sem referência no DB)
async function cleanupOrphanedMedia() {
  const allMediaInDB = await db.mediaFile.findMany()
  const keysInDB = new Set(allMediaInDB.map(m => m.storageKey))

  // Verificar storage e deletar arquivos não referenciados
  // ... implementação
}
```

## Backup (Recomendado)

Railway Volumes não têm backup automático. Considere:

1. **Backup manual**: Baixar arquivos periodicamente
2. **Replicação**: Sincronizar com S3/R2 em background
3. **Database**: Os metadados estão no PostgreSQL (que tem backup)

## Migration para R2/S3 (Futuro)

Se precisar migrar para Cloudflare R2 ou AWS S3 no futuro:

1. Os arquivos já têm `storageKey` no banco
2. Basta fazer upload dos arquivos do volume para R2/S3
3. Atualizar URLs no banco de dados
4. Trocar import de `./local-storage` por `./r2-client`

## Desenvolvimento Local

Em desenvolvimento local, os arquivos vão para `./storage/` na raiz do projeto:

```bash
# Criar diretório local
mkdir storage

# Adicionar ao .gitignore
echo "storage/" >> .gitignore
```

## Troubleshooting

### Arquivos não aparecem após deploy

- Verifique se o volume está montado: `ls -la /app/storage`
- Verifique permissões: `chmod 755 /app/storage`
- Verifique logs do Railway para erros

### Erro "ENOSPC: no space left on device"

- Volume cheio
- Aumente o tamanho do volume no Railway
- Implemente limpeza de arquivos antigos

### Performance lenta

- Considere migrar para CDN (Cloudflare, CloudFront)
- Adicione nginx como proxy reverso
- Use R2 com CDN embutido
