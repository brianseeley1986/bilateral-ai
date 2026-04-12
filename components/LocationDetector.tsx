'use client'
import { useEffect, useState } from 'react'

interface LocationState {
  detected: boolean
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number
  denied: boolean
}

async function resolveLocation(
  lat: number,
  lng: number
): Promise<{ city?: string; state?: string }> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    )
    const data = await res.json()
    return {
      city: data.city || data.locality || data.principalSubdivision || undefined,
      state: data.principalSubdivision || undefined,
    }
  } catch {
    return {}
  }
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
      async (pos) => {
        const { city, state } = await resolveLocation(
          pos.coords.latitude,
          pos.coords.longitude
        )
        const loc: LocationState = {
          detected: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          city,
          state,
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
