'use client'

import { useEffect, useRef } from 'react'

interface Station {
  id: string
  name: string
  latitude: number
  longitude: number
  order: number
}

interface RailwayLine {
  id: string
  name: string
  color: string
  company: string
  lineType: string
  stations: Station[]
}

interface LeafletMapProps {
  railwayLines: RailwayLine[]
  userProgress?: string[]
  center?: [number, number]
  zoom?: number
}

export default function LeafletMap({
  railwayLines,
  userProgress = [],
  center = [35.6812, 139.7671], // 東京駅 (lat, lng)
  zoom = 10
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    const loadMap = async () => {
      try {
        // 既存のマップインスタンスをクリーンアップ
        if (mapInstance.current) {
          mapInstance.current.remove()
          mapInstance.current = null
        }

        console.log('Loading Leaflet map...')

        // Dynamic import for Leaflet
        const L = await import('leaflet')

        // Import CSS (for client-side)
        if (typeof window !== 'undefined') {
          const leafletCSS = document.createElement('link')
          leafletCSS.rel = 'stylesheet'
          leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(leafletCSS)
        }

        // Fix for default markers
        delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        if (!mapContainer.current) return

        console.log('Creating Leaflet map...')

        // Create map
        mapInstance.current = L.map(mapContainer.current).setView(center, zoom)

        console.log('Map created, adding tile layer...')

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance.current)

        console.log('Tile layer added, drawing railway lines...')

        // 鉄道路線を描画
        railwayLines.forEach((line) => {
          if (line.stations && line.stations.length > 1) {
            // 路線を描画
            const lineCoordinates = line.stations
              .sort((a, b) => a.order - b.order)
              .map(station => [station.latitude, station.longitude] as [number, number])

            L.polyline(lineCoordinates, {
              color: line.color,
              weight: 4,
              opacity: 0.8
            }).addTo(mapInstance.current).bindPopup(`
              <strong>${line.name}</strong><br>
              ${line.company} / ${line.lineType}
            `)

            // 駅マーカーを追加
            line.stations.forEach((station) => {
              const isCompleted = userProgress.includes(station.id)

              const marker = L.circleMarker([station.latitude, station.longitude], {
                radius: 6,
                fillColor: isCompleted ? '#10B981' : '#6B7280',
                color: '#FFFFFF',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              }).addTo(mapInstance.current)

              marker.bindPopup(`
                <div style="font-family: sans-serif;">
                  <strong style="font-size: 16px;">${station.name}</strong><br>
                  <span style="color: #666; font-size: 12px;">${line.name}</span><br>
                  <span style="color: #999; font-size: 11px;">${line.company} / ${line.lineType}</span><br>
                  <span style="color: #999; font-size: 11px;">順序: ${station.order}</span><br>
                  <span style="
                    padding: 2px 6px; 
                    border-radius: 4px; 
                    font-size: 10px; 
                    ${isCompleted
                  ? 'background-color: #DEF7EC; color: #047857;'
                  : 'background-color: #F3F4F6; color: #374151;'
                }
                  ">
                    ${isCompleted ? '✓ 通過済み' : '未通過'}
                  </span>
                </div>
              `)
            })
          }
        })

        console.log('Map setup complete!')
      } catch (error) {
        console.error('Error loading Leaflet map:', error)
      }
    }

    loadMap()

    // クリーンアップ関数
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [railwayLines, userProgress, center, zoom])

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-md">
      <div
        ref={mapContainer}
        className="w-full h-full bg-gray-100"
        style={{ minHeight: '384px' }}
      />
    </div>
  )
}