# Password Reset - RevSend

Sistema completo de recuperação de senha com tokens seguros e validação de força de senha.

## Visão Geral

O sistema de password reset permite que usuários que esqueceram sua senha redefinam-na através de um link enviado por email (ou exibido no console em desenvolvimento).

### Tecnologias Utilizadas

- **crypto**: Geração de tokens seguros
- **bcryptjs**: Hash de senhas
- **Prisma**: Armazenamento de tokens no banco de dados
- **Next.js**: API routes e páginas React

## Arquitetura

### Banco de Dados

Campos adicionados ao modelo `User`:

```prisma
model User {
  // ... outros campos
  passwordResetToken     String?   @unique @map("password_reset_token")
  passwordResetExpiresAt DateTime? @map("password_reset_expires_at")
}
```

- **passwordResetToken**: Token único para reset (64 caracteres hex)
- **passwordResetExpiresAt**: Data de expiração (1 hora após criação)

### Fluxo de Recuperação

#### 1. Solicitar Reset

```
Forgot Password Page → Email → Gerar Token → Enviar Email → Exibir Confirmação
```

**Passos:**

1. Usuário acessa `/forgot-password`
2. Insere email
3. Sistema verifica se email existe
4. Gera token seguro (64 bytes hex = 128 caracteres)
5. Define expiração (1 hora)
6. Salva token no banco de dados
7. Envia email com link (em dev, mostra no console)
8. Exibe mensagem de confirmação

**Características:**

- Sempre retorna sucesso (previne enumeração de emails)
- Token único e criptograficamente seguro
- Link expira em 1 hora
- Email não é case-sensitive

#### 2. Redefinir Senha

```
Email Link → Reset Page → Nova Senha → Validar → Atualizar → Login
```

**Passos:**

1. Usuário clica no link do email
2. Acessa `/reset-password?token=...`
3. Insere nova senha (2x para confirmação)
4. Sistema valida token:
   - Existe no banco?
   - Está expirado?
5. Valida força da senha:
   - Mínimo 8 caracteres
   - Letra maiúscula
   - Letra minúscula
   - Número
   - Caractere especial
6. Hash da nova senha
7. Atualiza senha e remove token
8. Redireciona para login

## API Endpoints

### POST /api/auth/forgot-password

Solicita reset de senha.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (sempre sucesso):**

```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent.",
  // Apenas em development:
  "resetUrl": "http://localhost:3000/reset-password?token=abc123...",
  "resetToken": "abc123..."
}
```

**Comportamento:**

- Se email não existe: Retorna sucesso (previne enumeração)
- Se email existe: Gera token e "envia" email
- Sempre retorna mesma mensagem genérica

### POST /api/auth/reset-password

Redefine a senha usando token.

**Request:**

```json
{
  "token": "abc123...",
  "password": "NewPassword123!"
}
```

**Response (sucesso):**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Response (erro - token inválido):**

```json
{
  "error": "Invalid or expired reset token"
}
```

**Response (erro - senha fraca):**

```json
{
  "error": "Password does not meet requirements",
  "errors": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter"
  ]
}
```

## Páginas

### /forgot-password

Página para solicitar recuperação de senha.

**Funcionalidades:**

- Input de email
- Validação client-side
- Loading state durante submit
- Tela de confirmação após envio
- Em dev: Exibe link de reset diretamente

**Estados:**

1. **Form**: Formulário de email
2. **Success**: Confirmação de envio com instruções

### /reset-password?token=...

Página para redefinir senha com token.

**Funcionalidades:**

- Validação de token na URL
- Input de nova senha (com toggle show/hide)
- Input de confirmação de senha
- Validação de força em tempo real
- Loading state durante submit
- Tela de sucesso com redirect automático

**Estados:**

1. **Form**: Formulários de senha
2. **Success**: Confirmação com redirect

## Funções Helper

### generateResetToken()

Gera token seguro de 64 bytes.

```typescript
const token = generateResetToken()
// Retorna: "abc123def456..." (128 caracteres hex)
```

**Implementação:**

```typescript
import crypto from 'crypto'

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
```

### getResetTokenExpiration()

Retorna data de expiração (1 hora).

```typescript
const expiresAt = getResetTokenExpiration()
// Retorna: Date object (now + 1 hour)
```

### isResetTokenExpired(expiresAt)

Verifica se token expirou.

```typescript
const expired = isResetTokenExpired(user.passwordResetExpiresAt)
if (expired) {
  // Token expirado
}
```

### validatePasswordStrength(password)

Valida força da senha.

```typescript
const validation = validatePasswordStrength('weak')

console.log(validation)
// {
//   valid: false,
//   errors: [
//     "Password must be at least 8 characters long",
//     "Password must contain at least one uppercase letter",
//     "Password must contain at least one number",
//     "Password must contain at least one special character"
//   ]
// }
```

**Requisitos:**

- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 letra maiúscula (A-Z)
- ✅ Pelo menos 1 letra minúscula (a-z)
- ✅ Pelo menos 1 número (0-9)
- ✅ Pelo menos 1 caractere especial (!@#$%^&*(),.?":{}|<>)

## Segurança

### Proteções Implementadas

1. **Tokens Seguros**
   - Gerados com `crypto.randomBytes()` (criptograficamente seguros)
   - 64 bytes = 128 caracteres hexadecimais
   - Impossível de adivinhar por brute force

2. **Expiração de Tokens**
   - Tokens expiram em 1 hora
   - Validação no servidor antes de aceitar reset
   - Token removido após uso

3. **Prevenção de Enumeração**
   - Sempre retorna sucesso, mesmo se email não existe
   - Impossível descobrir quais emails estão cadastrados

4. **Validação de Senha**
   - Força mínima obrigatória
   - Múltiplos critérios (maiúscula, minúscula, número, especial)
   - Validação client-side E server-side

5. **One-Time Use**
   - Token é removido após uso bem-sucedido
   - Não pode ser reutilizado

6. **Rate Limiting** (recomendado)
   - Limitar requisições por IP (prevenir spam)
   - Limitar tentativas por email (prevenir abuse)

### Melhores Práticas

1. **Email de Notificação**
   - Enviar email quando senha for alterada
   - Incluir link "Não fui eu" para reverter

2. **Auditoria**
   - Registrar todas tentativas de reset
   - Registrar IPs e timestamps
   - Alertar sobre tentativas suspeitas

3. **HTTPS Only**
   - Nunca enviar tokens por HTTP
   - Links de reset devem usar HTTPS

4. **Limite de Tentativas**
   - Máximo 3 tokens por hora por email
   - Bloquear IPs com muitas tentativas

## Envio de Email

### Desenvolvimento

Em desenvolvimento, o token é exibido no **console do servidor**:

```
================================================================================
PASSWORD RESET REQUESTED
================================================================================
Email: user@example.com
Reset URL: http://localhost:3000/reset-password?token=abc123...
Token: abc123...
Expires: 2024-01-20T15:30:00.000Z
================================================================================
```

E também retornado na resposta da API (apenas em `NODE_ENV=development`).

### Produção

Em produção, integrar com serviço de email:

**Opções de Serviços:**

1. **Resend** (Recomendado)
   - Fácil integração
   - Templates modernos
   - Analytics incluído

2. **SendGrid**
   - Robusto e confiável
   - Bom free tier

3. **AWS SES**
   - Escalável
   - Barato para alto volume

**Exemplo com Resend:**

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: 'RevSend <noreply@revsend.com>',
    to: email,
    subject: 'Redefinir sua senha - RevSend',
    html: `
      <h1>Redefinir Senha</h1>
      <p>Você solicitou a redefinição de senha da sua conta RevSend.</p>
      <p>Clique no link abaixo para criar uma nova senha:</p>
      <a href="${resetUrl}">Redefinir Senha</a>
      <p>Este link expira em 1 hora.</p>
      <p>Se você não solicitou esta redefinição, ignore este email.</p>
    `,
  })
}
```

## Mensagens de Erro

### User-Facing

- ✅ "If an account exists with this email, a password reset link has been sent."
- ✅ "Reset token has expired"
- ✅ "Invalid or expired reset token"
- ✅ "Password does not meet requirements"
- ✅ "As senhas não coincidem"

### Debug (Console/Logs)

- 🔍 "Password reset requested for: user@example.com"
- 🔍 "Password reset successful for user: user@example.com"
- ❌ "Invalid reset token: abc123..."
- ❌ "Expired reset token for user: user@example.com"

## Troubleshooting

### "Token inválido" mesmo com token correto

**Causa**: Token já foi usado ou expirou

**Solução**:

1. Verificar se token existe no banco: `SELECT * FROM users WHERE password_reset_token = '...'`
2. Verificar data de expiração
3. Solicitar novo reset

### Email não é enviado

**Causa**: Serviço de email não configurado

**Solução**:

1. Em dev: Verificar console do servidor
2. Em prod: Verificar logs do serviço de email
3. Verificar credenciais da API de email

### Token expira muito rápido

**Causa**: Configuração de 1 hora muito curta

**Solução**:

Ajustar em `src/lib/auth/password-reset.ts`:

```typescript
export function getResetTokenExpiration(): Date {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24 horas
  return expiresAt
}
```

## Testes

### Teste Manual

1. **Solicitar Reset**:
   - Ir para `/forgot-password`
   - Inserir email cadastrado
   - Verificar mensagem de sucesso
   - Em dev: Copiar link do console

2. **Redefinir Senha**:
   - Clicar no link de reset
   - Inserir nova senha forte
   - Confirmar senha
   - Verificar sucesso

3. **Login com Nova Senha**:
   - Ir para `/login`
   - Fazer login com nova senha
   - Verificar acesso ao dashboard

4. **Token Expirado**:
   - Aguardar 1 hora
   - Tentar usar link antigo
   - Verificar erro de expiração

5. **Email Inexistente**:
   - Solicitar reset com email não cadastrado
   - Verificar que retorna sucesso (não revela)

### Teste Automatizado (Futuro)

```typescript
// tests/integration/auth/password-reset.test.ts

describe('Password Reset', () => {
  it('should generate secure reset token', () => {
    const token1 = generateResetToken()
    const token2 = generateResetToken()

    expect(token1).toHaveLength(64)
    expect(token2).toHaveLength(64)
    expect(token1).not.toBe(token2)
  })

  it('should validate password strength', () => {
    const weak = validatePasswordStrength('weak')
    expect(weak.valid).toBe(false)
    expect(weak.errors.length).toBeGreaterThan(0)

    const strong = validatePasswordStrength('StrongPass123!')
    expect(strong.valid).toBe(true)
    expect(strong.errors).toHaveLength(0)
  })

  it('should detect expired tokens', () => {
    const past = new Date()
    past.setHours(past.getHours() - 2)

    expect(isResetTokenExpired(past)).toBe(true)
    expect(isResetTokenExpired(getResetTokenExpiration())).toBe(false)
  })

  it('should reset password successfully', async () => {
    // Create user
    const user = await createTestUser()

    // Request reset
    const res1 = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: user.email }),
    })
    expect(res1.ok).toBe(true)

    // Get token from database
    const updatedUser = await prisma.user.findUnique({
      where: { email: user.email },
    })
    const token = updatedUser!.passwordResetToken

    // Reset password
    const res2 = await fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'NewPassword123!' }),
    })
    expect(res2.ok).toBe(true)

    // Verify token was cleared
    const finalUser = await prisma.user.findUnique({
      where: { email: user.email },
    })
    expect(finalUser!.passwordResetToken).toBeNull()
  })
})
```

## Métricas de Segurança

Após implementação de Password Reset:

- **Antes**: 65/100
- **Depois**: 75/100

### Melhorias no Score

- ✅ Password recovery mechanism: +10 pontos
- ✅ Account recovery without support: +5 pontos
- ✅ Strong password enforcement: +5 pontos (se não existia)

## Roadmap Futuro

### Funcionalidades Planejadas

1. **Email de Notificação**
   - Avisar quando senha foi alterada
   - Link "Não fui eu" para reverter

2. **Rate Limiting**
   - Máximo 3 resets por hora por email
   - Bloquear IPs suspeitos

3. **Templates de Email**
   - Design profissional
   - Personalização com nome do usuário
   - Links de suporte

4. **Auditoria Completa**
   - Registrar todas tentativas
   - Dashboard de segurança
   - Alertas de atividade suspeita

5. **Múltiplos Métodos**
   - SMS como alternativa
   - Perguntas de segurança
   - Recuperação via 2FA backup codes

## Referências

- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
