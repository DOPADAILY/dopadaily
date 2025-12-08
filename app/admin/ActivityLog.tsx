'use client'

import { useState, useEffect } from 'react'
import { History, Filter, User, Calendar, Database, RefreshCw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface AuditLog {
  id: number
  admin_id: string
  action: string
  target_table: string | null
  target_id: string | null
  created_at: string
  profiles: {
    username: string | null
  } | null
}

interface ActivityLogProps {
  initialLogs: AuditLog[]
}

export default function ActivityLog({ initialLogs }: ActivityLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [limit, setLimit] = useState(10)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh logs
  const refreshLogs = async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching audit logs:', error)
    } else if (data) {
      setLogs(data)
    }
    setIsRefreshing(false)
  }

  // Action type options
  const actionFilters = [
    { value: 'all', label: 'All Activity', color: 'text-on-surface' },
    { value: 'create', label: 'Created', color: 'text-success' },
    { value: 'update', label: 'Updated', color: 'text-warning' },
    { value: 'delete', label: 'Deleted', color: 'text-error' },
    { value: 'ban', label: 'Banned', color: 'text-error' },
    { value: 'promote', label: 'Role Changes', color: 'text-primary' },
  ]

  // Filter logs
  let filteredLogs = logs

  if (filterAction !== 'all') {
    filteredLogs = filteredLogs.filter(log =>
      log.action.toLowerCase().includes(filterAction.toLowerCase())
    )
  }

  const displayedLogs = filteredLogs.slice(0, limit)
  const activeFilter = actionFilters.find(f => f.value === filterAction) || actionFilters[0]

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('ban')) {
      return 'text-error bg-error/10 border-error/20'
    }
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('insert')) {
      return 'text-success bg-success/10 border-success/20'
    }
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit') || action.toLowerCase().includes('change')) {
      return 'text-warning bg-warning/10 border-warning/20'
    }
    return 'text-primary bg-primary/10 border-primary/20'
  }

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('user') || action.toLowerCase().includes('profile')) {
      return <User size={14} />
    }
    if (action.toLowerCase().includes('table')) {
      return <Database size={14} />
    }
    return <History size={14} />
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="card min-h-[600px] flex flex-col">
      <div className="flex flex-col gap-4 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
            <History size={24} className="text-primary" />
            <span className="hidden sm:inline">Recent Admin Activity</span>
            <span className="sm:hidden">Activity</span>
            {logs.length > 0 && (
              <span className="text-sm font-normal text-on-surface-secondary">
                ({filteredLogs.length})
              </span>
            )}
          </h2>

          <button
            onClick={refreshLogs}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-backplate transition-colors disabled:opacity-50"
            title="Refresh activity"
          >
            <RefreshCw size={16} className={`text-on-surface-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Pills - Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 min-w-max sm:min-w-0">
            {actionFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setFilterAction(filter.value)
                  setLimit(10)
                }}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filterAction === filter.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-backplate text-on-surface-secondary hover:text-on-surface hover:bg-surface border border-border'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <History size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
            <p className="text-on-surface-secondary mb-4">
              No admin activity recorded yet
            </p>
            <p className="text-xs text-on-surface-secondary">
              Admin actions like banning users, editing posts, and creating reminders will appear here
            </p>
          </div>
        </div>
      ) : displayedLogs.length > 0 ? (
        <div className="space-y-3 flex-1 max-h-[500px] overflow-y-auto pr-2">
          {displayedLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-backplate rounded-lg border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                    {log.target_table && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-neutral-medium/10 text-neutral-medium border border-neutral-medium/20">
                        <Database size={12} />
                        {log.target_table}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-secondary">
                    <User size={12} />
                    <span>By: {log.profiles?.username || 'Admin'}</span>
                    {log.target_id && (
                      <>
                        <span>•</span>
                        <span>ID: {log.target_id}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-on-surface-secondary whitespace-nowrap">
                  <Calendar size={12} />
                  <span title={new Date(log.created_at).toLocaleString()}>
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length > limit && (
            <button
              onClick={() => setLimit(prev => prev + 10)}
              className="w-full py-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
            >
              Load More ({filteredLogs.length - limit} remaining)
            </button>
          )}

          {limit > 10 && (
            <button
              onClick={() => setLimit(10)}
              className="w-full py-2 text-sm text-on-surface-secondary hover:bg-backplate rounded-lg transition-colors"
            >
              Show Less
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <Filter size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
            <p className="text-on-surface-secondary mb-2">
              No activity found for "{activeFilter.label}"
            </p>
            <button
              onClick={() => {
                setFilterAction('all')
                setLimit(10)
              }}
              className="text-sm text-primary hover:underline"
            >
              Show All Activity
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

