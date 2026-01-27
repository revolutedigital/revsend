'use client'

import { useCallback, useEffect, useState } from 'react'

export type FavoriteType = 'campaign' | 'list' | 'contact' | 'deal' | 'template'

export interface Favorite {
  id: string
  type: FavoriteType
  entityId: string
  createdAt: string
}

const STORAGE_KEY = 'revsend_favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch {
        setFavorites([])
      }
    }
    setIsLoading(false)
  }, [])

  // Save to localStorage whenever favorites change
  const saveFavorites = useCallback((newFavorites: Favorite[]) => {
    setFavorites(newFavorites)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites))
  }, [])

  // Add favorite
  const addFavorite = useCallback(
    (type: FavoriteType, entityId: string) => {
      const exists = favorites.some((f) => f.type === type && f.entityId === entityId)
      if (exists) return

      const newFavorite: Favorite = {
        id: `${type}-${entityId}`,
        type,
        entityId,
        createdAt: new Date().toISOString(),
      }

      saveFavorites([...favorites, newFavorite])
    },
    [favorites, saveFavorites]
  )

  // Remove favorite
  const removeFavorite = useCallback(
    (type: FavoriteType, entityId: string) => {
      saveFavorites(favorites.filter((f) => !(f.type === type && f.entityId === entityId)))
    },
    [favorites, saveFavorites]
  )

  // Toggle favorite
  const toggleFavorite = useCallback(
    (type: FavoriteType, entityId: string) => {
      const isFav = favorites.some((f) => f.type === type && f.entityId === entityId)
      if (isFav) {
        removeFavorite(type, entityId)
      } else {
        addFavorite(type, entityId)
      }
    },
    [favorites, addFavorite, removeFavorite]
  )

  // Check if entity is favorited
  const isFavorite = useCallback(
    (type: FavoriteType, entityId: string) => {
      return favorites.some((f) => f.type === type && f.entityId === entityId)
    },
    [favorites]
  )

  // Get favorites by type
  const getFavoritesByType = useCallback(
    (type: FavoriteType) => {
      return favorites.filter((f) => f.type === type)
    },
    [favorites]
  )

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
  }
}
