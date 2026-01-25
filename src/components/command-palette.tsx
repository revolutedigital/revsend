'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileSpreadsheet,
  Settings,
  Plus,
  Search,
  Smartphone,
  FileText,
  BarChart3,
  Image,
  Webhook,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Shield,
  HelpCircle,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
  keywords?: string[]
  group: 'navigation' | 'actions' | 'settings' | 'help'
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { setTheme, theme } = useTheme()

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'dashboard',
      label: 'Ir para Dashboard',
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      shortcut: 'G D',
      action: () => router.push('/dashboard'),
      keywords: ['home', 'início', 'painel'],
      group: 'navigation',
    },
    {
      id: 'campaigns',
      label: 'Ir para Campanhas',
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      shortcut: 'G C',
      action: () => router.push('/campaigns'),
      keywords: ['mensagens', 'envios', 'whatsapp'],
      group: 'navigation',
    },
    {
      id: 'lists',
      label: 'Ir para Listas',
      icon: <FileSpreadsheet className="mr-2 h-4 w-4" />,
      shortcut: 'G L',
      action: () => router.push('/lists'),
      keywords: ['contatos', 'planilha', 'csv'],
      group: 'navigation',
    },
    {
      id: 'contacts',
      label: 'Ir para Contatos',
      icon: <Users className="mr-2 h-4 w-4" />,
      action: () => router.push('/contacts'),
      keywords: ['pessoas', 'clientes', 'leads'],
      group: 'navigation',
    },
    {
      id: 'templates',
      label: 'Ir para Templates',
      icon: <FileText className="mr-2 h-4 w-4" />,
      shortcut: 'G T',
      action: () => router.push('/templates'),
      keywords: ['modelos', 'mensagens', 'textos'],
      group: 'navigation',
    },
    {
      id: 'media',
      label: 'Ir para Mídia',
      icon: <Image className="mr-2 h-4 w-4" />,
      action: () => router.push('/media'),
      keywords: ['imagens', 'fotos', 'arquivos', 'vídeos'],
      group: 'navigation',
    },
    {
      id: 'reports',
      label: 'Ir para Relatórios',
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
      shortcut: 'G R',
      action: () => router.push('/reports'),
      keywords: ['analytics', 'estatísticas', 'métricas'],
      group: 'navigation',
    },
    {
      id: 'settings',
      label: 'Ir para Configurações',
      icon: <Settings className="mr-2 h-4 w-4" />,
      shortcut: 'G S',
      action: () => router.push('/settings'),
      keywords: ['preferências', 'conta', 'perfil'],
      group: 'navigation',
    },

    // Actions
    {
      id: 'new-campaign',
      label: 'Nova Campanha',
      icon: <Plus className="mr-2 h-4 w-4" />,
      shortcut: 'N C',
      action: () => router.push('/campaigns/new'),
      keywords: ['criar', 'adicionar', 'campanha'],
      group: 'actions',
    },
    {
      id: 'new-list',
      label: 'Nova Lista',
      icon: <Plus className="mr-2 h-4 w-4" />,
      shortcut: 'N L',
      action: () => router.push('/lists/new'),
      keywords: ['criar', 'adicionar', 'lista', 'importar'],
      group: 'actions',
    },
    {
      id: 'new-template',
      label: 'Novo Template',
      icon: <Plus className="mr-2 h-4 w-4" />,
      shortcut: 'N T',
      action: () => router.push('/templates/new'),
      keywords: ['criar', 'adicionar', 'template', 'modelo'],
      group: 'actions',
    },
    {
      id: 'connect-whatsapp',
      label: 'Conectar WhatsApp',
      icon: <Smartphone className="mr-2 h-4 w-4" />,
      action: () => router.push('/settings'),
      keywords: ['número', 'celular', 'qr code'],
      group: 'actions',
    },

    // Settings
    {
      id: 'theme-light',
      label: 'Tema Claro',
      icon: <Sun className="mr-2 h-4 w-4" />,
      action: () => setTheme('light'),
      keywords: ['light', 'branco', 'dia'],
      group: 'settings',
    },
    {
      id: 'theme-dark',
      label: 'Tema Escuro',
      icon: <Moon className="mr-2 h-4 w-4" />,
      action: () => setTheme('dark'),
      keywords: ['dark', 'preto', 'noite'],
      group: 'settings',
    },
    {
      id: 'theme-system',
      label: 'Tema do Sistema',
      icon: <Monitor className="mr-2 h-4 w-4" />,
      action: () => setTheme('system'),
      keywords: ['auto', 'automático'],
      group: 'settings',
    },
    {
      id: 'security',
      label: 'Segurança (2FA)',
      icon: <Shield className="mr-2 h-4 w-4" />,
      action: () => router.push('/settings'),
      keywords: ['autenticação', 'dois fatores', 'senha'],
      group: 'settings',
    },
    {
      id: 'webhooks',
      label: 'Webhooks',
      icon: <Webhook className="mr-2 h-4 w-4" />,
      action: () => router.push('/settings'),
      keywords: ['integração', 'api', 'automação'],
      group: 'settings',
    },

    // Help
    {
      id: 'help',
      label: 'Ajuda',
      icon: <HelpCircle className="mr-2 h-4 w-4" />,
      shortcut: '?',
      action: () => window.open('https://github.com/anthropics/claude-code/issues', '_blank'),
      keywords: ['suporte', 'documentação', 'faq'],
      group: 'help',
    },
    {
      id: 'logout',
      label: 'Sair',
      icon: <LogOut className="mr-2 h-4 w-4" />,
      action: () => signOut({ callbackUrl: '/login' }),
      keywords: ['logout', 'desconectar', 'encerrar'],
      group: 'help',
    },
  ]

  const navigationCommands = commands.filter((c) => c.group === 'navigation')
  const actionCommands = commands.filter((c) => c.group === 'actions')
  const settingsCommands = commands.filter((c) => c.group === 'settings')
  const helpCommands = commands.filter((c) => c.group === 'help')

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Digite um comando ou pesquise..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          {navigationCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => runCommand(command.action)}
              keywords={command.keywords}
            >
              {command.icon}
              <span>{command.label}</span>
              {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações Rápidas">
          {actionCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => runCommand(command.action)}
              keywords={command.keywords}
            >
              {command.icon}
              <span>{command.label}</span>
              {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configurações">
          {settingsCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => runCommand(command.action)}
              keywords={command.keywords}
            >
              {command.icon}
              <span>{command.label}</span>
              {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ajuda">
          {helpCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => runCommand(command.action)}
              keywords={command.keywords}
            >
              {command.icon}
              <span>{command.label}</span>
              {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
