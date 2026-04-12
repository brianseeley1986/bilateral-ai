'use client'
import { useEffect, useState } from 'react'

interface LocationState {
  detected: boolean
  city?: string
  zip?: string
  latitude?: number
  longitude?: number
  denied: boolean
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    detected: false,
    denied: false,
  })

  useEffect(() => {
    const stored = localStorage.getItem('bilateral_location')
    if (stored) {
      try {
        setLocation(JSON.parse(stored))
      } catch {}
      return
    }

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LocationState = {
          detected: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          denied: false,
        }
        setLocation(loc)
        localStorage.setItem('bilateral_location', JSON.stringify(loc))
      },
      () => {
        setLocation({ detected: false, denied: true })
      },
      { timeout: 5000 }
    )
  }, [])

  return location
}
