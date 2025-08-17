import { useEffect } from 'react'
import { useEventStore } from '../stores/event-store'

export function useEventStoreInitializer() {
  const { loadEvents, isLoaded } = useEventStore()

  useEffect(() => {
    if (!isLoaded) {
      // Initializing event store
      loadEvents()
    }
  }, [loadEvents, isLoaded])

  return { isLoaded }
}

export function EventStoreInitializer({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useEventStoreInitializer()
  return <>{children}</>
}
