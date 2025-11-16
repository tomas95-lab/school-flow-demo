import { Timestamp } from 'firebase/firestore'

export type DateValue = string | number | Date | Timestamp | { seconds: number; toDate?: () => Date } | undefined | null

export function parseFirestoreDate(value: DateValue): Date | null {
  if (!value) return null

  try {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value
    }

    if (typeof value === 'object') {
      if ('toDate' in value && typeof value.toDate === 'function') {
        const date = value.toDate()
        return isNaN(date.getTime()) ? null : date
      }
      if ('seconds' in value && typeof value.seconds === 'number') {
        const date = new Date(value.seconds * 1000)
        return isNaN(date.getTime()) ? null : date
      }
    }

    if (typeof value === 'string') {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      }
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    }

    if (typeof value === 'number') {
      const date = new Date(value > 1e12 ? value : value * 1000)
      return isNaN(date.getTime()) ? null : date
    }
  } catch {
    return null
  }

  return null
}

export function formatDate(value: DateValue, options?: Intl.DateTimeFormatOptions): string {
  const date = parseFirestoreDate(value)
  if (!date) return '-'

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  }

  return date.toLocaleDateString('es-AR', defaultOptions)
}

export function formatDateTime(value: DateValue): string {
  const date = parseFirestoreDate(value)
  if (!date) return '-'

  return date.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelativeTime(value: DateValue): string {
  const date = parseFirestoreDate(value)
  if (!date) return '-'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
  return `Hace ${Math.floor(diffDays / 365)} años`
}

export function isDateInRange(value: DateValue, startDate: Date, endDate?: Date): boolean {
  const date = parseFirestoreDate(value)
  if (!date) return false

  if (date < startDate) return false
  if (endDate && date > endDate) return false

  return true
}

export function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function startOfDay(date: Date): Date {
  const newDate = new Date(date)
  newDate.setHours(0, 0, 0, 0)
  return newDate
}

export function endOfDay(date: Date): Date {
  const newDate = new Date(date)
  newDate.setHours(23, 59, 59, 999)
  return newDate
}

export function isSameDay(date1: DateValue, date2: DateValue): boolean {
  const d1 = parseFirestoreDate(date1)
  const d2 = parseFirestoreDate(date2)
  
  if (!d1 || !d2) return false

  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

export function getDateRangeForFilter(filter: '7d' | '30d' | '90d' | 'all'): Date {
  const now = new Date()
  
  switch (filter) {
    case '7d':
      return subtractDays(now, 7)
    case '30d':
      return subtractDays(now, 30)
    case '90d':
      return subtractDays(now, 90)
    case 'all':
    default:
      return new Date(0)
  }
}

export function toFirestoreTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date)
}

export function getCurrentAcademicPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const trimester = Math.ceil(month / 3)
  return `${year}-T${trimester}`
}

export function getPreviousAcademicPeriod(currentPeriod: string): string | undefined {
  const match = currentPeriod.match(/^(\d{4})-T(\d)$/)
  if (!match) return undefined

  const year = parseInt(match[1])
  const trimester = parseInt(match[2])

  if (trimester === 1) {
    return `${year - 1}-T4`
  }
  return `${year}-T${trimester - 1}`
}

export function sortByDateDesc<T>(items: T[], getDate: (item: T) => DateValue): T[] {
  return [...items].sort((a, b) => {
    const dateA = parseFirestoreDate(getDate(a))
    const dateB = parseFirestoreDate(getDate(b))
    
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    
    return dateB.getTime() - dateA.getTime()
  })
}

export function sortByDateAsc<T>(items: T[], getDate: (item: T) => DateValue): T[] {
  return [...items].sort((a, b) => {
    const dateA = parseFirestoreDate(getDate(a))
    const dateB = parseFirestoreDate(getDate(b))
    
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    
    return dateA.getTime() - dateB.getTime()
  })
}

