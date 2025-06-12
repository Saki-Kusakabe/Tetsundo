'use client'

import { useEffect, useRef } from 'react'

export default function SimpleMapTest() {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMap = async () => {
      try {
        // Dynamic import for Leaflet
        const L = await import('leaflet')
        
        // Import CSS
        await import('leaflet/dist/leaflet.css')
        
        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        if (!mapContainer.current) return

        console.log('Creating Leaflet map...')
        
        // Create map
        const map = L.map(mapContainer.current).setView([35.6812, 139.7671], 13)
        
        console.log('Map created, adding tile layer...')
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)
        
        console.log('Tile layer added, adding marker...')
        
        // Add a marker
        L.marker([35.6812, 139.7671])
          .addTo(map)
          .bindPopup('東京駅')
          .openPopup()
          
        console.log('Map setup complete!')
        
        return () => {
          map.remove()
        }
      } catch (error) {
        console.error('Error loading map:', error)
      }
    }

    loadMap()
  }, [])

  return (
    <div className="w-full h-96 border-2 border-red-500">
      <div 
        ref={mapContainer} 
        className="w-full h-full bg-blue-100"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}