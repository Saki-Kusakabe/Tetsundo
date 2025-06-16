'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import YouTubePlayer from '@/components/YouTubePlayer'
import { getUserProgress, completeExercise, type UserProgress } from '@/lib/progressStore'

// YouTubeプレイヤーのスタイル修正 - 最大限強力
const youtubePlayerStyles = `
  /* メインコンテナ制御 - CSS containment使用 */
  .youtube-player-container {
    max-width: 100% !important;
    max-height: 400px !important;
    min-height: 400px !important;
    height: 400px !important;
    width: 100% !important;
    overflow: hidden !important;
    position: relative !important;
    border-radius: 8px !important;
    transform: none !important;
    scale: none !important;
    contain: size layout style !important;
    isolation: isolate !important;
    resize: none !important;
    box-sizing: border-box !important;
    will-change: transform !important;
  }
  
  /* iframe制御 - sandboxと制約 */
  .youtube-player-container iframe {
    max-width: 100% !important;
    max-height: 400px !important;
    width: 100% !important;
    height: 400px !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    border: none !important;
    border-radius: 8px !important;
    transform: none !important;
    scale: none !important;
    zoom: 1 !important;
    contain: size layout style !important;
    resize: none !important;
    pointer-events: auto !important;
    box-sizing: border-box !important;
    will-change: transform !important;
  }
  
  /* 全ての子要素制御 - より厳格 */
  .youtube-player-container *,
  .youtube-player-container *::before,
  .youtube-player-container *::after {
    max-width: 100% !important;
    max-height: 400px !important;
    transform: none !important;
    scale: none !important;
    zoom: 1 !important;
    resize: none !important;
    contain: size !important;
    will-change: transform !important;
  }
  
  /* YouTube特有のクラス制御 - 全YouTube要素 */
  .youtube-player-container .html5-video-player,
  .youtube-player-container .ytp-player-content,
  .youtube-player-container .video-stream,
  .youtube-player-container .ytp-chrome-top,
  .youtube-player-container .ytp-chrome-bottom,
  .youtube-player-container .ytp-chrome-controls,
  .youtube-player-container video {
    max-width: 100% !important;
    max-height: 400px !important;
    width: 100% !important;
    height: 400px !important;
    transform: none !important;
    scale: none !important;
    zoom: 1 !important;
    contain: size layout style !important;
    resize: none !important;
    will-change: transform !important;
  }
  
  /* 広告とオーバーレイを完全無効化 */
  .youtube-player-container .ytp-ad-overlay-container,
  .youtube-player-container .ytp-ad-player-overlay,
  .youtube-player-container .ytp-pause-overlay,
  .youtube-player-container .iv-branding,
  .youtube-player-container .ytp-ad-module,
  .youtube-player-container .ytp-ad-overlay-close-button {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
  }
  
  /* 動的に追加される要素も制御 - より広範囲 */
  .youtube-player-container [style*="transform"],
  .youtube-player-container [style*="scale"],
  .youtube-player-container [style*="zoom"],
  .youtube-player-container [style*="width"],
  .youtube-player-container [style*="height"] {
    transform: none !important;
    scale: none !important;
    zoom: 1 !important;
    max-width: 100% !important;
    max-height: 400px !important;
    will-change: transform !important;
  }
  
  /* フルスクリーン制御 */
  .youtube-player-container :-webkit-full-screen,
  .youtube-player-container :-moz-full-screen,
  .youtube-player-container :fullscreen {
    max-width: 100% !important;
    max-height: 400px !important;
    width: 100% !important;
    height: 400px !important;
    transform: none !important;
    will-change: transform !important;
  }
  
  /* CSS Grid/Flexbox内での制御 */
  .youtube-player-container {
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    grid-template-rows: none !important;
    grid-template-columns: none !important;
  }
  
  /* サイズ変更を監視して即座にリセット */
  @keyframes resetSize {
    0% { 
      width: 100% !important; 
      height: 400px !important; 
      max-width: 100% !important; 
      max-height: 400px !important; 
    }
    100% { 
      width: 100% !important; 
      height: 400px !important; 
      max-width: 100% !important; 
      max-height: 400px !important; 
    }
  }
  
  .youtube-player-container,
  .youtube-player-container iframe,
  .youtube-player-container * {
    animation: resetSize 0.1s infinite !important;
  }
`

// 山手線の駅データ
const yamanoteStations = [
  { id: 'tokyo', name: '東京駅', order: 1 },
  { id: 'yurakucho', name: '有楽町駅', order: 2 },
  { id: 'shimbashi', name: '新橋駅', order: 3 },
  { id: 'hamamatsucho', name: '浜松町駅', order: 4 },
  { id: 'tamachi', name: '田町駅', order: 5 },
  { id: 'shinagawa', name: '品川駅', order: 6 },
  { id: 'osaki', name: '大崎駅', order: 7 },
  { id: 'gotanda', name: '五反田駅', order: 8 },
  { id: 'meguro', name: '目黒駅', order: 9 },
  { id: 'ebisu', name: '恵比寿駅', order: 10 },
  { id: 'shibuya', name: '渋谷駅', order: 11 },
  { id: 'harajuku', name: '原宿駅', order: 12 },
  { id: 'yoyogi', name: '代々木駅', order: 13 },
  { id: 'shinjuku', name: '新宿駅', order: 14 },
  { id: 'shinjuku_new', name: '新大久保駅', order: 15 },
  { id: 'takadanobaba', name: '高田馬場駅', order: 16 },
  { id: 'mejiro', name: '目白駅', order: 17 },
  { id: 'ikebukuro', name: '池袋駅', order: 18 },
  { id: 'otsuka', name: '大塚駅', order: 19 },
  { id: 'sugamo', name: '巣鴨駅', order: 20 },
  { id: 'komagome', name: '駒込駅', order: 21 },
  { id: 'tabata', name: '田端駅', order: 22 },
  { id: 'nishippori', name: '西日暮里駅', order: 23 },
  { id: 'nippori', name: '日暮里駅', order: 24 },
  { id: 'uguisudani', name: '鶯谷駅', order: 25 },
  { id: 'ueno', name: '上野駅', order: 26 },
  { id: 'okachimachi', name: '御徒町駅', order: 27 },
  { id: 'akihabara', name: '秋葉原駅', order: 28 },
  { id: 'kanda', name: '神田駅', order: 29 }
]

// YouTube Data APIの型定義
interface YouTubeVideoInfo {
  id: string
  title: string
  thumbnailUrl: string
  duration: string
}

// チャンネル名
const CHANNEL_NAME = 'MarinaTakewaki'

export default function ExercisePage() {
  const [videoUrl, setVideoUrl] = useState('')
  const [isVideoValid, setIsVideoValid] = useState(false)
  const [showSlackShare, setShowSlackShare] = useState(false)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [videoInfoList, setVideoInfoList] = useState<YouTubeVideoInfo[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)
  const [lastCompletedData, setLastCompletedData] = useState<{
    stationProgressed: {
      name: string
      line: { name: string }
    }
    user: { totalStationsCompleted: number }
  } | null>(null)

  // コンポーネント初期化時に進捗を読み込み（クライアントサイドのみ）
  useEffect(() => {
    setUserProgress(getUserProgress())
    setIsLoaded(true)
  }, [])

  // 動画URLが変更されたときにバリデーションを更新
  useEffect(() => {
    const validateYouTubeUrl = (url: string): boolean => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
      const match = url.match(regExp)
      return !!(match && match[2].length === 11)
    }
    setIsVideoValid(validateYouTubeUrl(videoUrl))
  }, [videoUrl])

  // useMemoを使って現在の駅情報を取得
  const currentStation = useMemo(() => {
    if (!userProgress?.currentStation) {
      return yamanoteStations[0] // デフォルトは東京駅
    }
    return yamanoteStations.find(station => station.id === userProgress.currentStation) || yamanoteStations[0]
  }, [userProgress?.currentStation])

  const nextStation = useMemo(() => {
    const currentIndex = yamanoteStations.findIndex(station => station.id === currentStation.id)
    return yamanoteStations[currentIndex + 1] || null
  }, [currentStation.id])

  const handleVideoComplete = useCallback(async (data: {
    videoUrl: string
    duration: number
    watchTime: number
    completionRate: number
  }) => {
    try {
      console.log('🎉 エクササイズ完了コールバック呼び出し:', data)
      console.log('現在の駅:', currentStation)
      console.log('次の駅:', nextStation)

      // 次の駅があるかチェック
      if (!nextStation) {
        alert('🎉 山手線を完全制覇しました！おめでとうございます！')
        return
      }

      // 進捗管理システムを使って駅を進める
      const nextStationName = completeExercise()

      // 進捗を再読み込み
      const updatedProgress = getUserProgress()
      setUserProgress(updatedProgress)

      if (nextStationName) {
        // 完了データを設定
        const completionResult = {
          stationProgressed: {
            name: nextStationName,
            line: { name: '山手線' }
          },
          user: { totalStationsCompleted: updatedProgress.completedStations.length }
        }

        setLastCompletedData(completionResult)
        setShowSlackShare(true)

        // 成功メッセージ表示
        alert(`🎉 おめでとうございます！\n${nextStationName}に到着しました！\n\n累計制覇駅数: ${updatedProgress.completedStations.length}駅`)
      }

    } catch (error) {
      console.error('Error handling video completion:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    }
  }, [currentStation, nextStation])

  // YouTube URLの検証
  const validateYouTubeUrl = (url: string): boolean => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return !!(match && match[2].length === 11)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setVideoUrl(url)
    setIsVideoValid(validateYouTubeUrl(url))
  }

  const handleSlackShare = async () => {
    if (!lastCompletedData?.stationProgressed) return

    try {
      const webhookUrl = prompt('Slack Webhook URLを入力してください（任意）:')
      if (!webhookUrl) return

      const previousStation = yamanoteStations.find(station =>
        userProgress?.completedStations.includes(station.id) &&
        station.order === currentStation.order - 1
      )

      const slackMessage = {
        line: lastCompletedData.stationProgressed.line?.name || '不明な路線',
        fromStation: previousStation?.name || currentStation.name,
        toStation: lastCompletedData.stationProgressed.name,
        totalStations: lastCompletedData.user?.totalStationsCompleted || 0,
        videoUrl: videoUrl
      }

      // 実際のSlack API呼び出し（実装予定）
      // const response = await fetch('/api/slack', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ webhookUrl, message: slackMessage })
      // })

      console.log('Slack共有データ:', slackMessage)
      alert('Slackに投稿しました！（モック）')
      setShowSlackShare(false)

    } catch (error) {
      console.error('Slack share error:', error)
      alert('Slackへの投稿中にエラーが発生しました。')
    }
  }

  // YouTube Data APIから動画情報を取得
  const fetchVideoInfo = useCallback(async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
      if (!apiKey) {
        console.error('YouTube API key is not set')
        return
      }

      // チャンネルの動画を検索
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${CHANNEL_NAME}&type=video&maxResults=50&key=${apiKey}`
      )
      const data = await response.json()

      if (data.items) {
        // 動画IDのリストを作成
        const videoIds = data.items.map((item: any) => item.id.videoId)

        // 動画の詳細情報を取得
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`
        )
        const detailsData = await detailsResponse.json()

        if (detailsData.items) {
          // 動画情報を整形
          const videos = detailsData.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            thumbnailUrl: item.snippet.thumbnails.medium.url,
            duration: item.contentDetails.duration
          }))

          // 動画をランダムにシャッフル
          const shuffledVideos = videos.sort(() => Math.random() - 0.5)
          // 最初の6つの動画を選択
          setVideoInfoList(shuffledVideos.slice(0, 6))
        }
      }
    } catch (error) {
      console.error('Error fetching video info:', error)
    } finally {
      setIsLoadingVideos(false)
    }
  }, [])

  // 初回読み込み時に動画を取得
  useEffect(() => {
    fetchVideoInfo()
  }, [fetchVideoInfo])

  // 動画を再読み込みする関数
  const reloadVideos = useCallback(() => {
    setIsLoadingVideos(true)
    setVideoInfoList([])
    fetchVideoInfo()
  }, [fetchVideoInfo])

  // ローディング中はサーバーと同じ初期状態を表示
  if (!isLoaded || !userProgress) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* インラインスタイル追加 */}
        <style dangerouslySetInnerHTML={{ __html: youtubePlayerStyles }} />

        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">🚉 Tetsundo</h1>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className="text-gray-600 hover:text-gray-900">ホーム</Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">ダッシュボード</Link>
                <Link href="/exercise" className="text-blue-600 font-medium">エクササイズ</Link>
                <Link href="/map" className="text-gray-600 hover:text-gray-900">地図</Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-2">🚃</div>
            <p className="text-gray-600">進捗データを読み込み中...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* インラインスタイル追加 */}
      <style dangerouslySetInnerHTML={{ __html: youtubePlayerStyles }} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🚉 Tetsundo</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">ホーム</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">ダッシュボード</Link>
              <Link href="/exercise" className="text-blue-600 font-medium">エクササイズ</Link>
              <Link href="/map" className="text-gray-600 hover:text-gray-900">地図</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🏃‍♂️ エクササイズ
          </h1>
          <p className="text-lg text-gray-600">
            YouTubeのエクササイズ動画を80%以上視聴して、駅を進めましょう！
          </p>
        </div>

        {/* 現在の位置情報 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">現在位置</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700">山手線 - {currentStation.name}</p>
              {nextStation ? (
                <p className="text-sm text-blue-600">次の駅: {nextStation.name}</p>
              ) : (
                <p className="text-sm text-green-600">🎉 山手線完全制覇！</p>
              )}
            </div>
            <div className="text-blue-700">
              <span className="text-xl font-bold">{userProgress.completedStations.length}</span> / 29駅
            </div>
          </div>

          {/* 進捗バー */}
          <div className="mt-4">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(userProgress.completedStations.length / 29) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              制覇率: {((userProgress.completedStations.length / 29) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 動画URL入力 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">動画URLを入力</h2>
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube動画URL
              </label>
              <input
                type="url"
                id="video-url"
                value={videoUrl}
                onChange={handleUrlChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {videoUrl && !isVideoValid && (
                <p className="mt-2 text-sm text-red-600">
                  有効なYouTube URLを入力してください
                </p>
              )}
              {isVideoValid && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ 有効なYouTube URLです
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 動画プレイヤーエリア */}
        {isVideoValid ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">エクササイズ動画</h2>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <YouTubePlayer
                videoUrl={videoUrl}
                onVideoComplete={handleVideoComplete}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                YouTube動画URLを入力してください
              </h3>
              <p className="text-gray-600">
                お好みのエクササイズ動画のURLを上記フォームに入力するか、下記のおすすめ動画から選択してください
              </p>
            </div>
          </div>
        )}

        {/* Slack共有ボタン */}
        {showSlackShare && lastCompletedData?.stationProgressed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎉 おめでとうございます！
                </h3>
                <p className="text-green-700">
                  {lastCompletedData.stationProgressed.line.name} - {lastCompletedData.stationProgressed.name}に到着しました！
                </p>
                <p className="text-sm text-green-600 mt-1">
                  累積駅数: {lastCompletedData.user.totalStationsCompleted}駅
                </p>
              </div>
              <button
                onClick={handleSlackShare}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Slackに共有する
              </button>
            </div>
          </div>
        )}

        {/* エクササイズのヒント */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">💡 エクササイズのコツ</h3>
          <ul className="text-green-700 space-y-2">
            <li>• 動画を80%以上視聴すると駅が1つ進みます</li>
            <li>• 水分補給を忘れずに行いましょう</li>
            <li>• 無理をせず、自分のペースで続けることが大切です</li>
            <li>• 毎日少しずつでも継続することを心がけましょう</li>
          </ul>
        </div>

        {/* おすすめ動画 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">おすすめエクササイズ動画</h3>
            <button
              onClick={reloadVideos}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              動画を更新
            </button>
          </div>
          {isLoadingVideos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">動画情報を読み込み中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoInfoList.map((video) => (
                <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video relative">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium mb-2 line-clamp-2">{video.title}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setVideoUrl(`https://www.youtube.com/watch?v=${video.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded"
                      >
                        この動画を使用
                      </button>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded"
                      >
                        YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}