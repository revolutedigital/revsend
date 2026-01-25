"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-600",
    warning: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-600",
    info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-600",
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={variantStyles[variant]}
          >
            {isLoading ? "Processando..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Hook para facilitar uso de confirmações
 *
 * Exemplo:
 * const { confirm, ConfirmDialog } = useConfirm()
 *
 * <ConfirmDialog />
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: "Deletar campanha?",
 *     description: "Esta ação não pode ser desfeita."
 *   })
 *
 *   if (confirmed) {
 *     // delete...
 *   }
 * }
 */
export function useConfirm() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "danger" | "warning" | "info"
    resolve?: (value: boolean) => void
  }>({
    open: false,
    title: "",
    description: "",
  })

  const confirm = (options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "danger" | "warning" | "info"
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        ...options,
        resolve,
      })
    })
  }

  const handleConfirm = () => {
    dialogState.resolve?.(true)
    setDialogState({ ...dialogState, open: false })
  }

  const handleCancel = () => {
    dialogState.resolve?.(false)
    setDialogState({ ...dialogState, open: false })
  }

  const Dialog = () => (
    <AlertDialog open={dialogState.open} onOpenChange={handleCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogState.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {dialogState.cancelText || "Cancelar"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              dialogState.variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : dialogState.variant === "warning"
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-blue-600 hover:bg-blue-700"
            }
          >
            {dialogState.confirmText || "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { confirm, ConfirmDialog: Dialog }
}

// Fix React import
import * as React from "react"
