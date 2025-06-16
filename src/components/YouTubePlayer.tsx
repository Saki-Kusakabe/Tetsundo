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
        playerVars: Record<string, number | string> // 'width'と'height'をstringにできるよう修正
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

  // YouTube動画IDを抽出
  const extractVideoId = (url: string): string | null => {
    // googleusercontent.com ドメインの正規表現を追加
    const regExp = /^.*(?:(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))|youtu\.be\/|googleusercontent\.com\/(?:youtube\.com\/(?:1|2)\/))([^"&?\/\s]{11}).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  }

  const videoId = extractVideoId(videoUrl)

  // サイズ強制の関数とMutationObserverを削除します。
  // 必要に応じて `playerRef.current` に直接クラスを追加する形に変更します。

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

          if (rate >= 0.8 && !hasCompleted) {
            console.log('🎉 80% completion achieved! Rate:', (rate * 100).toFixed(1) + '%')
            console.log('📞 Calling onVideoComplete callback...')
            setHasCompleted(true)
            onVideoComplete({
              videoUrl,
              duration,
              watchTime: Math.floor(currentTime),
              completionRate: rate
            })
          }

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
      // スクリプトのURLを修正 (googleusercontent.com/youtube.com/2 は公式APIのURLではないようです)
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
  }, [isApiReady]) // isApiReady を依存配列に追加し、APIが準備できた後に再度実行されないようにする

  useEffect(() => {
    if (!isApiReady || !videoId || !playerRef.current) return

    if (player) {
      player.destroy()
      setPlayer(null)
    }

    setWatchTime(0)
    setCompletionRate(0)
    setIsPlaying(false)
    setDuration(0)
    setHasCompleted(false)

    const newPlayer = new window.YT.Player(playerRef.current, {
      // height と width は、CSSで制御するため、ここでは'100%'と'100%'を設定します。
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        controls: 1,
        showinfo: 0,
        fs: 0, // フルスクリーンボタンを非表示
        disablekb: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
        enablejsapi: 1,
        autoplay: 0,
        start: 0,
        html5: 1
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

    // クリーンアップ
    return () => {
      newPlayer?.destroy()
    }
  }, [isApiReady, videoId]) // enforcePlayerSize の依存を削除

  useEffect(() => {
    if (isPlaying && player && duration > 0) {
      startWatchTimeTracking()
    } else {
      stopWatchTimeTracking()
    }

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
      {/* 動画プレイヤー容器 - CSSクラスでアスペクト比を維持 */}
      <div className="youtube-player-wrapper">
        {isApiReady ? (
          <div
            ref={playerRef}
            // ここでは `absolute` クラスのみを適用し、残りのスタイルはCSSファイルで定義します。
            className="absolute top-0 left-0 w-full h-full"
            style={{ pointerEvents: 'auto' }} // 必要であれば
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
            className={`h-3 rounded-full transition-all duration-300 ${completionRate >= 0.8 ? 'bg-green-500' : 'bg-blue-500'
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