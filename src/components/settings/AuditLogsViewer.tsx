'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  Shield,
  Key,
  LogIn,
  LogOut,
  UserPlus,
  FileText,
  MessageSquare,
  Settings,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditLog {
  id: string
  action: string
  resource: string | null
  resourceId: string | null
  details: any
  ipAddress: string | null
  createdAt: string
}

interface AuditStats {
  total: number
  last24h: number
  lastWeek: number
}

const actionConfig: Record<
  string,
  { icon: any; label: string; color: string; variant: any }
> = {
  'user.login': { icon: LogIn, label: 'Login', color: 'text-green-500', variant: 'default' },
  'user.logout': { icon: LogOut, label: 'Logout', color: 'text-gray-500', variant: 'secondary' },
  'user.register': {
    icon: UserPlus,
    label: 'Registro',
    color: 'text-blue-500',
    variant: 'default',
  },
  'user.password_change': {
    icon: Key,
    label: 'Senha Alterada',
    color: 'text-orange-500',
    variant: 'default',
  },
  'user.password_reset_request': {
    icon: Key,
    label: 'Reset Solicitado',
    color: 'text-yellow-500',
    variant: 'outline',
  },
  'user.password_reset_complete': {
    icon: Key,
    label: 'Senha Redefinida',
    color: 'text-orange-500',
    variant: 'default',
  },
  'user.2fa_enable': {
    icon: Shield,
    label: '2FA Ativado',
    color: 'text-green-500',
    variant: 'default',
  },
  'user.2fa_disable': {
    icon: Shield,
    label: '2FA Desativado',
    color: 'text-red-500',
    variant: 'destructive',
  },
  'campaign.create': {
    icon: MessageSquare,
    label: 'Campanha Criada',
    color: 'text-blue-500',
    variant: 'default',
  },
  'campaign.start': {
    icon: Activity,
    label: 'Campanha Iniciada',
    color: 'text-green-500',
    variant: 'default',
  },
  'list.upload': {
    icon: FileText,
    label: 'Lista Importada',
    color: 'text-purple-500',
    variant: 'default',
  },
  'settings.update': {
    icon: Settings,
    label: 'Configurações',
    color: 'text-gray-500',
    variant: 'secondary',
  },
}

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch('/api/audit-logs?limit=20')
      if (!response.ok) throw new Error('Failed to fetch logs')

      const data = await response.json()
      setLogs(data.logs)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getActionConfig = (action: string) => {
    return (
      actionConfig[action] || {
        icon: Activity,
        label: action,
        color: 'text-gray-500',
        variant: 'secondary',
      }
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total de Eventos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.last24h}</div>
              <p className="text-xs text-muted-foreground">Últimas 24h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.lastWeek}</div>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Atividade Recente</CardTitle>
              <CardDescription>Últimas 20 ações na sua conta</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const config = getActionConfig(log.action)
                  const Icon = config.icon

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className={`mt-0.5 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={config.variant} className="text-xs">
                            {config.label}
                          </Badge>
                          {log.resource && (
                            <span className="text-xs text-muted-foreground">
                              {log.resource}
                              {log.resourceId && ` #${log.resourceId.slice(-8)}`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                          {log.ipAddress && ` • ${log.ipAddress}`}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
