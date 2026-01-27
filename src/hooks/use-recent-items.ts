'use client'

import { useCallback, useEffect, useState } from 'react'

export type RecentItemType = 'campaign' | 'list' | 'contact' | 'deal' | 'template' | 'page'

export interface RecentItem {
  id: string
  type: RecentItemType
  entityId: string
  title: string
  description?: string
  href: string
  icon?: string
  accessedAt: string
}

const STORAGE_KEY = 'revsend_recent_items'
const MAX_RECENT_ITEMS = 10

export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load recent items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setRecentItems(JSON.parse(saved))
      } catch {
        setRecentItems([])
      }
    }
    setIsLoading(false)
  }, [])

  // Save to localStorage whenever recent items change
  const saveRecentItems = useCallback((items: RecentItem[]) => {
    // Keep only the most recent items
    const trimmed = items.slice(0, MAX_RECENT_ITEMS)
    setRecentItems(trimmed)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  }, [])

  // Add or update recent item (moves to top if exists)
  const addRecentItem = useCallback(
    (item: Omit<RecentItem, 'id' | 'accessedAt'>) => {
      const now = new Date().toISOString()
      const id = `${item.type}-${item.entityId}`

      // Remove existing entry if present
      const filtered = recentItems.filter(
        (r) => !(r.type === item.type && r.entityId === item.entityId)
      )

      const newItem: RecentItem = {
        ...item,
        id,
        accessedAt: now,
      }

      // Add to beginning
      saveRecentItems([newItem, ...filtered])
    },
    [recentItems, saveRecentItems]
  )

  // Remove recent item
  const removeRecentItem = useCallback(
    (type: RecentItemType, entityId: string) => {
      saveRecentItems(recentItems.filter((r) => !(r.type === type && r.entityId === entityId)))
    },
    [recentItems, saveRecentItems]
  )

  // Clear all recent items
  const clearRecentItems = useCallback(() => {
    saveRecentItems([])
  }, [saveRecentItems])

  // Get recent items by type
  const getRecentByType = useCallback(
    (type: RecentItemType, limit?: number) => {
      const filtered = recentItems.filter((r) => r.type === type)
      return limit ? filtered.slice(0, limit) : filtered
    },
    [recentItems]
  )

  // Get most recent items (mixed types)
  const getMostRecent = useCallback(
    (limit = 5) => {
      return recentItems.slice(0, limit)
    },
    [recentItems]
  )

  return {
    recentItems,
    isLoading,
    addRecentItem,
    removeRecentItem,
    clearRecentItems,
    getRecentByType,
    getMostRecent,
  }
}

// Helper hook to track page visits
export function useTrackPageVisit(
  type: RecentItemType,
  entityId: string,
  title: string,
  href: string,
  description?: string
) {
  const { addRecentItem } = useRecentItems()

  useEffect(() => {
    // Track the page visit after a short delay to avoid tracking quick back-navigation
    const timer = setTimeout(() => {
      addRecentItem({
        type,
        entityId,
        title,
        href,
        description,
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [type, entityId, title, href, description, addRecentItem])
}
