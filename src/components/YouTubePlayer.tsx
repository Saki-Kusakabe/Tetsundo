'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface YouTubePlayerProps {
  videoUrl: string
  onVideoComplete: (data: {
    videoUrl: string
    duration: number
    watchTime: number
    completionRate: number
  }) => void
}

interface YTPlayer {
  destroy(): void
  getDuration(): number
  getPlayerState(): number
  getCurrentTime(): number
}

interface YTEvent {
  target: YTPlayer
  data: number
}

declare global {
  interface Window {
    YT: {
      Player: new (element: HTMLElement, config: {
        height: string
        width: string
        videoId: string
        playerVars: Record<string, number>
        events: {
          onReady: (event: YTEvent) => void
          onStateChange: (event: YTEvent) => void
          onError?: (event: { data: number }) => void
        }
      }) => YTPlayer
      PlayerState: {
        PLAYING: number
        PAUSED: number
        ENDED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export default function YouTubePlayer({ videoUrl, onVideoComplete }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const [player, setPlayer] = useState<YTPlayer | null>(null)
  const [isApiReady, setIsApiReady] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completionRate, setCompletionRate] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)

  // YouTube動画IDを抽出
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const videoId = extractVideoId(videoUrl)


  // MutationObserverでサイズ変更を監視
  useEffect(() => {
    if (!playerRef.current) return

    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || 
             mutation.attributeName === 'width' || 
             mutation.attributeName === 'height')) {
          console.log('YouTube player size change detected, enforcing size...')
          // enforcePlayerSize の代わりにインライン制御
          if (playerRef.current) {
            const container = playerRef.current.parentElement
            const iframe = playerRef.current.querySelector('iframe')
            
            if (container) {
              container.style.cssText = `
                width: 100% !important;
                height: 400px !important;
                max-width: 100% !important;
                max-height: 400px !important;
                overflow: hidden !important;
                position: relative !important;
              `
            }
            
            if (iframe) {
              iframe.style.cssText = `
                width: 100% !important;
                height: 400px !important;
                max-width: 100% !important;
                max-height: 400px !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
              `
            }
          }
        }
      })
    })

    // 監視開始
    observerRef.current.observe(playerRef.current, {
      attributes: true,
      attributeFilter: ['style', 'width', 'height', 'class'],
      childList: true,
      subtree: true
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, []) // 依存関係を空配列に

  const startWatchTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      if (player && duration > 0) {
        try {
          const currentTime = player.getCurrentTime()
          const rate = currentTime / duration
          setWatchTime(Math.floor(currentTime))
          setCompletionRate(Math.min(rate, 1))
          
          // 80%達成時のチェック
          if (rate >= 0.8 && !hasCompleted) {
            console.log('🎉 80% completion achieved! Rate:', (rate * 100).toFixed(1) + '%')
            console.log('📞 Calling onVideoComplete callback...')
            setHasCompleted(true)
            // 80%達成時に即座にコールバックを実行
            onVideoComplete({
              videoUrl,
              duration,
              watchTime: Math.floor(currentTime),
              completionRate: rate
            })
          }
          
          // デバッグログ（5秒ごと）
          if (Math.floor(currentTime) % 5 === 0) {
            console.log('📊 Progress:', (rate * 100).toFixed(1) + '%', `(${Math.floor(currentTime)}/${Math.floor(duration)}s)`)
          }
        } catch (error) {
          console.error('❌ Error getting current time:', error)
        }
      } else {
        console.log('⚠️ Player not ready:', { player: !!player, duration })
      }
    }, 1000)
  }, [player, duration, hasCompleted, onVideoComplete, videoUrl])

  const stopWatchTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const handleVideoEnd = useCallback(() => {
    if (!player || duration === 0) return

    try {
      const currentTime = player.getCurrentTime()
      const finalCompletionRate = Math.min(currentTime / duration, 1)
      
      console.log('Video completed:', {
        duration,
        currentTime: Math.floor(currentTime),
        completionRate: finalCompletionRate
      })

      if (finalCompletionRate >= 0.8) {
        onVideoComplete({
          videoUrl,
          duration,
          watchTime: Math.floor(currentTime),
          completionRate: finalCompletionRate
        })
      }
    } catch (error) {
      console.error('Error in handleVideoEnd:', error)
    }
  }, [player, duration, onVideoComplete, videoUrl])

  useEffect(() => {
    // YouTube IFrame API を動的に読み込み
    if (!window.YT) {
      setIsApiLoading(true)
      setError(null)
      
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.onload = () => {
        console.log('YouTube API script loaded')
      }
      tag.onerror = () => {
        setError('YouTube APIの読み込みに失敗しました')
        setIsApiLoading(false)
      }
      
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true)
        setIsApiLoading(false)
        console.log('YouTube API ready')
      }
      
      // タイムアウト処理（10秒）
      const timeout = setTimeout(() => {
        if (!isApiReady) {
          setError('YouTube APIの読み込みがタイムアウトしました')
          setIsApiLoading(false)
        }
      }, 10000)
      
      return () => clearTimeout(timeout)
    } else {
      setIsApiReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isApiReady || !videoId || !playerRef.current) return

    // 既存のプレイヤーを破棄
    if (player) {
      player.destroy()
      setPlayer(null)
    }

    // 状態をリセット
    setWatchTime(0)
    setCompletionRate(0)
    setIsPlaying(false)
    setDuration(0)
    setHasCompleted(false)

    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        controls: 1,
        showinfo: 0,
        fs: 0, // フルスクリーンボタンを無効化
        disablekb: 1, // キーボード操作を無効化（フルスクリーン防止）
        iv_load_policy: 3, // アノテーションを無効化
        cc_load_policy: 0, // 字幕を無効化
        enablejsapi: 1, // JavaScript API有効
        autoplay: 0, // 自動再生無効
        start: 0, // 開始位置
        html5: 1 // HTML5強制
      },
      events: {
        onReady: (event: YTEvent) => {
          try {
            const videoDuration = event.target.getDuration()
            setDuration(videoDuration)
            setError(null)
            console.log('🎬 YouTube Player ready!')
            console.log('📊 Video duration:', videoDuration, 'seconds')
            console.log('🔗 Video URL:', videoUrl)
          } catch (err) {
            console.error('Error in onReady:', err)
            setError('プレイヤーの初期化に失敗しました')
          }
        },
        onError: (event: { data: number }) => {
          console.error('YouTube player error:', event.data)
          switch (event.data) {
            case 2:
              setError('動画IDが無効です')
              break
            case 5:
              setError('HTML5プレイヤーでエラーが発生しました')
              break
            case 100:
              setError('動画が見つかりません')
              break
            case 101:
            case 150:
              setError('この動画は埋め込み再生が許可されていません')
              break
            default:
              setError('動画の再生中にエラーが発生しました')
          }
        },
        onStateChange: (event: YTEvent) => {
          const playerState = event.data
          console.log('🎵 Player state changed:', playerState)
          
          if (playerState === window.YT.PlayerState.PLAYING) {
            console.log('▶️ Video is now playing')
            setIsPlaying(true)
            // 再生開始時に強制的にサイズを制御（段階的に実行）
            for (let i = 0; i < 10; i++) {
              setTimeout(() => {
                // enforcePlayerSize を直接呼び出さずに、より安全な方法で制御
                if (playerRef.current) {
                  const container = playerRef.current.parentElement
                  const iframe = playerRef.current.querySelector('iframe')
                  
                  if (container) {
                    container.style.cssText = `
                      width: 100% !important;
                      height: 400px !important;
                      max-width: 100% !important;
                      max-height: 400px !important;
                      overflow: hidden !important;
                      position: relative !important;
                    `
                  }
                  
                  if (iframe) {
                    iframe.style.cssText = `
                      width: 100% !important;
                      height: 400px !important;
                      max-width: 100% !important;
                      max-height: 400px !important;
                      position: absolute !important;
                      top: 0 !important;
                      left: 0 !important;
                    `
                  }
                }
              }, i * 200) // 200ms間隔で10回実行
            }
          } else if (
            playerState === window.YT.PlayerState.PAUSED ||
            playerState === window.YT.PlayerState.ENDED
          ) {
            console.log('⏸️ Video paused or ended')
            setIsPlaying(false)
            
            if (playerState === window.YT.PlayerState.ENDED) {
              console.log('🏁 Video ended, calling handleVideoEnd')
              handleVideoEnd()
            }
          }
        }
      }
    })

    setPlayer(newPlayer)

    // プレイヤー作成後にサイズを制御
    setTimeout(() => {
      if (playerRef.current) {
        const container = playerRef.current.parentElement
        const iframe = playerRef.current.querySelector('iframe')
        
        if (container) {
          container.style.cssText = `
            width: 100% !important;
            height: 400px !important;
            max-width: 100% !important;
            max-height: 400px !important;
            overflow: hidden !important;
            position: relative !important;
          `
        }
        
        if (iframe) {
          iframe.style.cssText = `
            width: 100% !important;
            height: 400px !important;
            max-width: 100% !important;
            max-height: 400px !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          `
        }
      }
    }, 500)

    // 非常に頻繁にサイズをチェック（8秒問題対策）
    const sizeCheckInterval = setInterval(() => {
      if (playerRef.current) {
        const container = playerRef.current.parentElement
        const iframe = playerRef.current.querySelector('iframe')
        
        if (container) {
          // より強力な制御でコンテナサイズを固定
          const containerStyle = `
            width: 100% !important;
            height: 400px !important;
            max-width: 100% !important;
            max-height: 400px !important;
            min-width: 100% !important;
            min-height: 400px !important;
            overflow: hidden !important;
            position: relative !important;
            transform: none !important;
            zoom: 1 !important;
            box-sizing: border-box !important;
            contain: size layout style !important;
            isolation: isolate !important;
          `
          container.style.cssText = containerStyle
          // 属性でも設定
          container.setAttribute('style', containerStyle)
          // 直接プロパティでも設定
          container.style.setProperty('width', '100%', 'important')
          container.style.setProperty('height', '400px', 'important')
          container.style.setProperty('max-width', '100%', 'important')
          container.style.setProperty('max-height', '400px', 'important')
        }
        
        if (iframe) {
          // より強力な制御でiframeサイズを固定
          const iframeStyle = `
            width: 100% !important;
            height: 400px !important;
            max-width: 100% !important;
            max-height: 400px !important;
            min-width: 100% !important;
            min-height: 400px !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            zoom: 1 !important;
            box-sizing: border-box !important;
            contain: size layout style !important;
            pointer-events: auto !important;
          `
          iframe.style.cssText = iframeStyle
          // 属性でも設定
          iframe.setAttribute('style', iframeStyle)
          iframe.setAttribute('width', '100%')
          iframe.setAttribute('height', '400')
          // sandboxでさらに制限
          iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation')
          // 直接プロパティでも設定
          iframe.style.setProperty('width', '100%', 'important')
          iframe.style.setProperty('height', '400px', 'important')
          iframe.style.setProperty('max-width', '100%', 'important')
          iframe.style.setProperty('max-height', '400px', 'important')
        }
        
        // プレイヤー内部の全要素も制御
        const allElements = playerRef.current.querySelectorAll('*')
        allElements.forEach((element: Element) => {
          const htmlElement = element as HTMLElement
          if (htmlElement.style) {
            htmlElement.style.setProperty('max-width', '100%', 'important')
            htmlElement.style.setProperty('max-height', '400px', 'important')
            htmlElement.style.setProperty('transform', 'none', 'important')
            htmlElement.style.setProperty('zoom', '1', 'important')
            htmlElement.style.setProperty('scale', 'none', 'important')
            
            // YouTube特有のクラスに対する強力な制御
            if (htmlElement.classList.contains('html5-video-player') || 
                htmlElement.classList.contains('ytp-player-content') ||
                htmlElement.classList.contains('video-stream') ||
                htmlElement.classList.contains('ytp-chrome-top') ||
                htmlElement.classList.contains('ytp-chrome-bottom') ||
                htmlElement.tagName === 'VIDEO') {
              htmlElement.style.setProperty('width', '100%', 'important')
              htmlElement.style.setProperty('height', '400px', 'important')
              htmlElement.style.setProperty('max-width', '100%', 'important')
              htmlElement.style.setProperty('max-height', '400px', 'important')
              htmlElement.style.setProperty('transform', 'none', 'important')
              htmlElement.style.setProperty('zoom', '1', 'important')
              htmlElement.style.setProperty('scale', 'none', 'important')
              htmlElement.style.setProperty('contain', 'size layout style', 'important')
            }
            
            // 広告やオーバーレイ関連のクラスを非表示に
            if (htmlElement.classList.contains('ytp-ad-overlay-container') ||
                htmlElement.classList.contains('ytp-ad-player-overlay') ||
                htmlElement.classList.contains('ytp-pause-overlay') ||
                htmlElement.classList.contains('iv-branding')) {
              htmlElement.style.setProperty('display', 'none', 'important')
              htmlElement.style.setProperty('visibility', 'hidden', 'important')
            }
          }
        })
      }
    }, 100) // 100msごとに実行（さらに頻繁に）

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      clearInterval(sizeCheckInterval)
      newPlayer?.destroy()
    }
  }, [isApiReady, videoId])

  // プレイヤーの状態に応じてタイマーを開始/停止
  useEffect(() => {
    if (isPlaying && player && duration > 0) {
      startWatchTimeTracking()
    } else {
      stopWatchTimeTracking()
    }
    
    // クリーンアップ
    return () => {
      stopWatchTimeTracking()
    }
  }, [isPlaying, player, duration, startWatchTimeTracking, stopWatchTimeTracking])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!videoId) {
    return (
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
        <p className="text-gray-600">無効なYouTube URLです</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="w-full h-64 bg-red-50 border border-red-200 flex items-center justify-center rounded-lg">
          <div className="text-center text-red-700">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="font-medium">{error}</p>
            <button 
              onClick={() => {
                setError(null)
                setIsApiReady(false)
                setIsApiLoading(false)
                window.location.reload()
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 動画プレイヤー容器 - 固定サイズ */}
      <div 
        className="youtube-player-container relative w-full bg-black rounded-lg shadow-md"
        style={{ 
          width: '100%',
          maxWidth: '100%',
          height: '400px',
          maxHeight: '400px',
          minHeight: '400px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          border: '2px solid #e5e7eb'
        }}
      >
        {isApiReady ? (
          <div
            ref={playerRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ 
              pointerEvents: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              overflow: 'hidden'
            }}
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">
                {isApiLoading ? '⏳' : '🎬'}
              </div>
              <p>
                {isApiLoading 
                  ? 'YouTube プレイヤーを読み込み中...' 
                  : 'YouTube プレイヤーを準備中...'
                }
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* 進捗情報 */}
      <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              視聴時間: {formatTime(watchTime)}
            </span>
            {duration > 0 && (
              <span className="text-sm text-gray-600">
                動画時間: {formatTime(duration)}
              </span>
            )}
            <span className={`text-sm font-medium ${isPlaying ? 'text-green-600' : 'text-gray-600'}`}>
              {isPlaying ? '再生中' : '停止中'}
            </span>
          </div>
          <span className="text-sm font-medium text-blue-600">
            {(completionRate * 100).toFixed(1)}% 完了
          </span>
        </div>
        
        {/* プログレスバー */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              completionRate >= 0.8 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(completionRate * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm">
          <p className="text-gray-600">
            ※ 80%以上視聴で駅を1つ進みます
          </p>
          {completionRate >= 0.8 && (
            <p className="text-green-600 font-medium">
              ✓ 達成条件クリア！
            </p>
          )}
        </div>
      </div>
    </div>
  )
}