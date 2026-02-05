/**
 * Template Variables Resolution
 *
 * Resolves variables like {{nome}}, {{empresa}}, {{data}} in message templates
 * using contact data and system values.
 */

interface ContactData {
  name: string | null;
  phoneNumber: string;
  email?: string | null;
  customFields?: Record<string, unknown> | null;
}

interface VariableContext {
  contact: ContactData;
  organization?: {
    name: string;
  };
  campaign?: {
    name: string;
  };
  user?: {
    name: string | null;
  };
}

// Default fallback values for empty variables
const DEFAULT_FALLBACKS: Record<string, string> = {
  nome: 'Cliente',
  name: 'Cliente',
  empresa: '',
  company: '',
  email: '',
  telefone: '',
  phone: '',
};

/**
 * Format a date in Brazilian format
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format time in Brazilian format
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get greeting based on time of day
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Get first name from full name
 */
function getFirstName(fullName: string | null): string {
  if (!fullName) return DEFAULT_FALLBACKS.nome;
  return fullName.split(' ')[0];
}

/**
 * Build the variables map from context
 */
function buildVariablesMap(context: VariableContext): Record<string, string> {
  const { contact, organization, campaign, user } = context;
  const now = new Date();

  // Parse custom fields if they exist
  const customFields = contact.customFields
    ? (typeof contact.customFields === 'string'
        ? JSON.parse(contact.customFields)
        : contact.customFields)
    : {};

  const variables: Record<string, string> = {
    // Contact variables
    nome: contact.name || DEFAULT_FALLBACKS.nome,
    name: contact.name || DEFAULT_FALLBACKS.name,
    primeiro_nome: getFirstName(contact.name),
    first_name: getFirstName(contact.name),
    telefone: contact.phoneNumber,
    phone: contact.phoneNumber,
    email: contact.email || DEFAULT_FALLBACKS.email,

    // Date/Time variables
    data: formatDate(now),
    date: formatDate(now),
    hora: formatTime(now),
    time: formatTime(now),
    dia_semana: now.toLocaleDateString('pt-BR', { weekday: 'long' }),
    weekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
    mes: now.toLocaleDateString('pt-BR', { month: 'long' }),
    month: now.toLocaleDateString('en-US', { month: 'long' }),
    ano: now.getFullYear().toString(),
    year: now.getFullYear().toString(),

    // Greeting
    saudacao: getGreeting(),
    greeting: getGreeting(),

    // Organization variables
    empresa: organization?.name || DEFAULT_FALLBACKS.empresa,
    company: organization?.name || DEFAULT_FALLBACKS.company,
    organizacao: organization?.name || '',
    organization: organization?.name || '',

    // Campaign variables
    campanha: campaign?.name || '',
    campaign: campaign?.name || '',

    // User/Sender variables
    remetente: user?.name || '',
    sender: user?.name || '',
    vendedor: user?.name || '',
    salesperson: user?.name || '',
  };

  // Add custom fields to variables map
  if (customFields && typeof customFields === 'object') {
    for (const [key, value] of Object.entries(customFields)) {
      if (typeof value === 'string' || typeof value === 'number') {
        variables[key.toLowerCase()] = String(value);
        // Also add snake_case version
        variables[key.toLowerCase().replace(/\s+/g, '_')] = String(value);
      }
    }
  }

  return variables;
}

/**
 * Resolve template variables in a message
 *
 * Supports formats:
 * - {{variable}}
 * - {{variable|fallback}}
 * - {{ variable }} (with spaces)
 *
 * @param message The message template with variables
 * @param context The context containing contact data and other variables
 * @returns The message with variables resolved
 */
export function resolveTemplateVariables(
  message: string,
  context: VariableContext
): string {
  const variables = buildVariablesMap(context);

  // Match {{variable}} or {{variable|fallback}} patterns
  // Supports optional spaces: {{ variable }}, {{variable}}, {{ variable | fallback }}
  const variablePattern = /\{\{\s*([a-zA-Z0-9_]+)\s*(?:\|\s*([^}]*))?\s*\}\}/g;

  return message.replace(variablePattern, (match, variableName, fallback) => {
    const key = variableName.toLowerCase();
    const value = variables[key];

    // If variable exists and is not empty, use it
    if (value !== undefined && value !== '') {
      return value;
    }

    // If fallback is provided, use it
    if (fallback !== undefined) {
      return fallback.trim();
    }

    // If variable is in default fallbacks, use that
    if (DEFAULT_FALLBACKS[key] !== undefined) {
      return DEFAULT_FALLBACKS[key];
    }

    // Return empty string for unknown variables (don't keep the {{variable}})
    return '';
  });
}

/**
 * Extract all variable names from a template
 * Useful for validation and showing available variables
 */
export function extractVariables(message: string): string[] {
  const variablePattern = /\{\{\s*([a-zA-Z0-9_]+)\s*(?:\|[^}]*)?\s*\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variablePattern.exec(message)) !== null) {
    const varName = match[1].toLowerCase();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Get list of available system variables
 */
export function getAvailableVariables(): { name: string; description: string; example: string }[] {
  return [
    { name: 'nome', description: 'Nome completo do contato', example: 'João Silva' },
    { name: 'primeiro_nome', description: 'Primeiro nome do contato', example: 'João' },
    { name: 'telefone', description: 'Número de telefone', example: '+5511999999999' },
    { name: 'email', description: 'E-mail do contato', example: 'joao@email.com' },
    { name: 'empresa', description: 'Nome da sua organização', example: 'Minha Empresa' },
    { name: 'saudacao', description: 'Saudação baseada na hora', example: 'Bom dia' },
    { name: 'data', description: 'Data atual', example: '03/02/2026' },
    { name: 'hora', description: 'Hora atual', example: '14:30' },
    { name: 'dia_semana', description: 'Dia da semana', example: 'segunda-feira' },
    { name: 'mes', description: 'Mês atual', example: 'fevereiro' },
    { name: 'vendedor', description: 'Nome do vendedor/remetente', example: 'Maria' },
    { name: 'campanha', description: 'Nome da campanha', example: 'Promoção Janeiro' },
  ];
}

/**
 * Validate a template and return any issues
 */
export function validateTemplate(message: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const variables = extractVariables(message);
  const knownVariables = getAvailableVariables().map((v) => v.name);

  // Check for unknown variables
  for (const variable of variables) {
    if (!knownVariables.includes(variable)) {
      warnings.push(`Variável desconhecida: {{${variable}}}. Será substituída por valor vazio se não existir nos campos personalizados.`);
    }
  }

  // Check for common issues
  if (message.includes('{') && !message.includes('{{')) {
    warnings.push('Possível erro de sintaxe: use {{ e }} para variáveis.');
  }

  return {
    valid: true, // Always valid, just with warnings
    warnings,
  };
}
