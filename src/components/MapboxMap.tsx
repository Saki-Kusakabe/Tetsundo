'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Station {
  id: string
  name: string
  latitude: number
  longitude: number
  order: number
  isCompleted?: boolean
}

interface RailwayLine {
  id: string
  name: string
  color: string
  company: string
  lineType: string
  stations: Station[]
}

interface MapboxMapProps {
  accessToken: string
  railwayLines: RailwayLine[]
  userProgress?: string[] // 完了済み駅のIDリスト
  center?: [number, number]
  zoom?: number
}

export default function MapboxMap({ 
  accessToken, 
  railwayLines, 
  userProgress = [],
  center = [139.7671, 35.6812], // 東京駅
  zoom = 10
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (map.current) return // 既にマップが初期化されている場合は何もしない

    if (!accessToken) {
      console.warn('Mapbox access token not provided')
      setMapError('Mapbox access token not provided')
      setIsLoading(false)
      return
    }

    console.log('Initializing Mapbox with token:', accessToken.substring(0, 20) + '...')
    
    mapboxgl.accessToken = accessToken

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: center,
        zoom: zoom,
        antialias: true
      })

      console.log('Mapbox map created successfully')
    } catch (error) {
      console.error('Error creating Mapbox map:', error)
      setMapError(`Failed to create map: ${error}`)
      setIsLoading(false)
      return
    }

    map.current.on('load', () => {
      if (!map.current) return
      
      console.log('Mapbox map loaded, adding railway lines:', railwayLines.length)
      setIsLoading(false)

      // 鉄道路線データを追加
      railwayLines.forEach((line, lineIndex) => {
        if (line.stations && line.stations.length > 1) {
          // 路線のGeoJSONデータを作成
          const lineCoordinates = line.stations
            .sort((a, b) => a.order - b.order)
            .map(station => [station.longitude, station.latitude])

          const lineSourceId = `railway-line-${lineIndex}`
          const lineLayerId = `railway-line-layer-${lineIndex}`

          // 路線データソースを追加
          map.current!.addSource(lineSourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {
                name: line.name,
                color: line.color,
                company: line.company,
                lineType: line.lineType
              },
              geometry: {
                type: 'LineString',
                coordinates: lineCoordinates
              }
            }
          })

          // 路線レイヤーを追加
          map.current!.addLayer({
            id: lineLayerId,
            type: 'line',
            source: lineSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': line.color,
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 2,
                12, 4,
                16, 8
              ],
              'line-opacity': 0.8
            }
          })

          // 駅ポイントのGeoJSONデータを作成
          const stationsFeatures = line.stations.map(station => ({
            type: 'Feature' as const,
            properties: {
              id: station.id,
              name: station.name,
              line: line.name,
              company: line.company,
              lineType: line.lineType,
              order: station.order,
              isCompleted: userProgress.includes(station.id)
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [station.longitude, station.latitude]
            }
          }))

          const stationsSourceId = `railway-stations-${lineIndex}`

          // 駅データソースを追加
          map.current!.addSource(stationsSourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: stationsFeatures
            }
          })

          // 未完了駅のレイヤー
          map.current!.addLayer({
            id: `stations-uncompleted-${lineIndex}`,
            type: 'circle',
            source: stationsSourceId,
            filter: ['!', ['get', 'isCompleted']],
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 3,
                12, 5,
                16, 8
              ],
              'circle-color': '#6B7280',
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 1
            }
          })

          // 完了済み駅のレイヤー
          map.current!.addLayer({
            id: `stations-completed-${lineIndex}`,
            type: 'circle',
            source: stationsSourceId,
            filter: ['get', 'isCompleted'],
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 4,
                12, 6,
                16, 10
              ],
              'circle-color': '#10B981',
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 2
            }
          })

          // 駅名ラベル（高ズームレベルでのみ表示）
          map.current!.addLayer({
            id: `stations-labels-${lineIndex}`,
            type: 'symbol',
            source: stationsSourceId,
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Regular'],
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 10,
                16, 14
              ]
            },
            paint: {
              'text-color': '#374151',
              'text-halo-color': '#FFFFFF',
              'text-halo-width': 1
            },
            minzoom: 12
          })

          // 駅クリックイベントを追加
          map.current!.on('click', `stations-uncompleted-${lineIndex}`, (e) => {
            if (e.features && e.features[0]) {
              const feature = e.features[0]
              const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
              const properties = feature.properties

              // ポップアップを表示
              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-3">
                    <h3 class="font-bold text-lg">${properties!.name}</h3>
                    <p class="text-sm text-gray-600">${properties!.line}</p>
                    <p class="text-sm text-gray-500">${properties!.company} / ${properties!.lineType}</p>
                    <p class="text-sm text-gray-500">順序: ${properties!.order}</p>
                    <div class="mt-2 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      未通過
                    </div>
                  </div>
                `)
                .addTo(map.current!)
            }
          })

          map.current!.on('click', `stations-completed-${lineIndex}`, (e) => {
            if (e.features && e.features[0]) {
              const feature = e.features[0]
              const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
              const properties = feature.properties

              // ポップアップを表示
              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-3">
                    <h3 class="font-bold text-lg">${properties!.name}</h3>
                    <p class="text-sm text-gray-600">${properties!.line}</p>
                    <p class="text-sm text-gray-500">${properties!.company} / ${properties!.lineType}</p>
                    <p class="text-sm text-gray-500">順序: ${properties!.order}</p>
                    <div class="mt-2 px-2 py-1 bg-green-100 rounded text-xs text-green-700">
                      ✓ 通過済み
                    </div>
                  </div>
                `)
                .addTo(map.current!)
            }
          })

          // マウスカーソルの変更
          map.current!.on('mouseenter', `stations-uncompleted-${lineIndex}`, () => {
            map.current!.getCanvas().style.cursor = 'pointer'
          })

          map.current!.on('mouseleave', `stations-uncompleted-${lineIndex}`, () => {
            map.current!.getCanvas().style.cursor = ''
          })

          map.current!.on('mouseenter', `stations-completed-${lineIndex}`, () => {
            map.current!.getCanvas().style.cursor = 'pointer'
          })

          map.current!.on('mouseleave', `stations-completed-${lineIndex}`, () => {
            map.current!.getCanvas().style.cursor = ''
          })
        }
      })

      // ナビゲーションコントロールを追加
      map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // スケールコントロールを追加
      map.current!.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }), 'bottom-left')

      // フルスクリーンコントロールを追加
      map.current!.addControl(new mapboxgl.FullscreenControl(), 'top-right')
    })

    // エラーイベントを追加
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e.error)
      setMapError(`Map error: ${e.error.message}`)
      setIsLoading(false)
    })

    return () => {
      map.current?.remove()
    }
  }, [accessToken, railwayLines, userProgress, center, zoom])

  if (mapError) {
    return (
      <div className="w-full h-96 bg-red-50 flex items-center justify-center rounded-lg border-2 border-red-200">
        <div className="text-center">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-red-600 font-semibold">Map Error</p>
          <p className="text-sm text-red-500 mt-2">
            {mapError}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ブラウザのコンソールで詳細エラーを確認してください
          </p>
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-600">Mapbox access token not configured</p>
          <p className="text-sm text-gray-500 mt-2">
            .env.localファイルに NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN を設定してください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-md relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-2">🚃</div>
            <p className="text-gray-600">マップを読み込み中...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
      />
    </div>
  )
}