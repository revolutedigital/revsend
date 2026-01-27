'use client'

import { Button } from '@/components/ui/button'
import { useFavorites, type FavoriteType } from '@/hooks/use-favorites'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  type: FavoriteType
  entityId: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function FavoriteButton({ type, entityId, className, size = 'default' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const isFav = isFavorite(type, entityId)

  const sizeClasses = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        sizeClasses[size],
        'transition-all duration-200',
        isFav && 'text-gold hover:text-gold/80',
        className
      )}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(type, entityId)
      }}
      aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={isFav}
    >
      <Star
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          isFav && 'fill-gold'
        )}
      />
    </Button>
  )
}
