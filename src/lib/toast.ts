import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

export const toasts = reactive<ToastItem[]>([])
let seq = 0

export function notify(message: string, type: ToastType = 'success', duration = 3400): number {
  const id = ++seq
  toasts.push({ id, message, type })
  if (type !== 'loading' && duration > 0) {
    window.setTimeout(() => dismiss(id), duration)
  }
  return id
}

export function dismiss(id: number): void {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}

export function updateToast(id: number, message: string, type: ToastType, duration = 3400): void {
  const item = toasts.find((t) => t.id === id)
  if (item) {
    item.message = message
    item.type = type
  } else {
    notify(message, type, duration)
    return
  }
  if (type !== 'loading' && duration > 0) window.setTimeout(() => dismiss(id), duration)
}
