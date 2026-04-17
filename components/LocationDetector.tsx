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

// IP-based geolocation — no browser permission prompt, city-level accuracy.
// Uses the same BigDataCloud service the old reverse-geocode call used.
async function detectViaIP(): Promise<LocationState> {
  try {
    const res = await fetch(
      'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en'
    )
    const data = await res.json()
    if (!data.principalSubdivision && !data.city && !data.locality) {
      return { detected: false, denied: false }
    }
    return {
      detected: true,
      city: data.city || data.locality || undefined,
      state: data.principalSubdivision || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      denied: false,
    }
  } catch {
    return { detected: false, denied: false }
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

    detectViaIP().then((loc) => {
      setLocation(loc)
      if (loc.detected) {
        localStorage.setItem('bilateral_location', JSON.stringify(loc))
      }
    })
  }, [])

  return location
}
