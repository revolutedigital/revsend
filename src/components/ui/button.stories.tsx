import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { ArrowRight, Download, Plus, Send, Trash2 } from 'lucide-react'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'O componente Button é usado para ações e navegação.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Estilo visual do botão',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'icon', 'icon-sm', 'icon-xs'],
      description: 'Tamanho do botão',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado desabilitado',
    },
    children: {
      control: 'text',
      description: 'Conteúdo do botão',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Variantes principais
export const Default: Story = {
  args: {
    children: 'Botão Padrão',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Excluir',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Cancelar',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secundário',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
}

// Tamanhos
export const ExtraSmall: Story = {
  args: {
    size: 'xs',
    children: 'Extra Pequeno',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Pequeno',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Grande',
  },
}

// Com ícones
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Send className="mr-2 h-4 w-4" />
        Enviar
      </>
    ),
  },
}

export const IconRight: Story = {
  args: {
    children: (
      <>
        Continuar
        <ArrowRight className="ml-2 h-4 w-4" />
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    size: 'icon',
    'aria-label': 'Adicionar',
    children: <Plus className="h-4 w-4" />,
  },
}

export const IconOnlySmall: Story = {
  args: {
    size: 'icon-sm',
    'aria-label': 'Download',
    children: <Download className="h-4 w-4" />,
  },
}

export const IconOnlyExtraSmall: Story = {
  args: {
    size: 'icon-xs',
    variant: 'ghost',
    'aria-label': 'Excluir',
    children: <Trash2 className="h-3 w-3" />,
  },
}

// Estados
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Desabilitado',
  },
}

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <span className="animate-spin mr-2">⏳</span>
        Carregando...
      </>
    ),
  },
}

// Showcase de todas as variantes
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

// Showcase de todos os tamanhos
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Ícone">
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon-sm" aria-label="Ícone pequeno">
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon-xs" aria-label="Ícone extra pequeno">
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  ),
}
