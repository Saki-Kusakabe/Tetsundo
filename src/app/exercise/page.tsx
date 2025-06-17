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

// YouTube APIのレスポンス型定義
interface YouTubeVideoInfo {
  id: string
  title: string
  thumbnailUrl: string
  duration: string
}

// チャンネル名
const CHANNEL_NAME = 'MarinaTakewaki'
const CHANNEL_ID = 'UCw7HTQv0F4CB9zGRhqosYsg'
const MAX_RESULTS = 30

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
  const [errorMsg, setErrorMsg] = useState('')

  // コンポーネント初期化時に進捗を読み込み（クライアントサイドのみ）
  useEffect(() => {
    setUserProgress(getUserProgress())
    setIsLoaded(true)
  }, [])

  // 動画完了時の処理
  const handleVideoEnd = useCallback(async () => {
    if (!userProgress) return

    try {
      // 現在の駅を取得
      const currentStation = yamanoteStations.find(
        station => station.id === userProgress.currentStation
      )

      if (!currentStation) {
        console.error('Current station not found')
        return
      }

      // 次の駅を取得
      const nextStationIndex = currentStation.order
      const nextStation = yamanoteStations.find(
        station => station.order === nextStationIndex + 1
      )

      if (!nextStation) {
        console.error('Next station not found')
        return
      }

      // 進捗を更新
      const nextStationName = completeExercise()
      if (nextStationName) {
        const updatedProgress = getUserProgress()
        setUserProgress(updatedProgress)
      }
    } catch (error) {
      console.error('Error handling video completion:', error)
    }
  }, [userProgress])

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

  const fetchVideos = useCallback(async () => {
    setIsLoadingVideos(true)
    setErrorMsg('')
    try {
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
      if (!apiKey) {
        setErrorMsg('YouTube APIキーが設定されていません')
        setIsLoadingVideos(false)
        return
      }
      // 1. 動画リスト取得
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=${MAX_RESULTS}&type=video&key=${apiKey}`
      )
      const searchData = await searchRes.json()
      if (!searchData.items || searchData.items.length === 0) {
        setErrorMsg('動画が見つかりませんでした')
        setIsLoadingVideos(false)
        return
      }
      // 2. 動画IDリスト
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
      // 3. 詳細情報取得
      const detailsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`
      )
      const detailsData = await detailsRes.json()
      if (!detailsData.items || detailsData.items.length === 0) {
        setErrorMsg('動画詳細が取得できませんでした')
        setIsLoadingVideos(false)
        return
      }
      // 4. 必要な情報を整形
      const videos: YouTubeVideoInfo[] = detailsData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        duration: item.contentDetails.duration,
      }))
      // 5. ランダムで6件選択
      const shuffled = videos.sort(() => 0.5 - Math.random())
      setVideoInfoList(shuffled.slice(0, 6))
      setIsLoadingVideos(false)
    } catch (e) {
      setErrorMsg('動画の取得中にエラーが発生しました')
      setIsLoadingVideos(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // 完了メッセージを閉じる処理
  const handleClosePopup = useCallback(() => {
    setShowSlackShare(false)
    setLastCompletedData(null)
    // 動画URLをリセット
    setVideoUrl('')
    setIsVideoValid(false)
  }, [])

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
                onVideoComplete={handleVideoEnd}
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

        {/* 動画リスト */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">おすすめ動画</h2>
          {errorMsg && (
            <div className="text-red-500 mb-4">{errorMsg}</div>
          )}
          {isLoadingVideos ? (
            <div className="text-center py-4">動画を読み込み中...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoInfoList.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setVideoUrl(`https://www.youtube.com/watch?v=${video.id}`)
                    setIsVideoValid(true)
                  }}
                >
                  <div className="relative pb-[56.25%]">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={fetchVideos}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            動画を更新
          </button>
        </div>

        {/* 完了メッセージ */}
        {showSlackShare && lastCompletedData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">お疲れ様でした！</h3>
              <p className="mb-4">
                {lastCompletedData.stationProgressed.line.name}の
                {lastCompletedData.stationProgressed.name}まで進みました！
              </p>
              <p className="mb-4">
                累計{lastCompletedData.user.totalStationsCompleted}駅制覇！
              </p>
              <div className="flex justify-end">
                <button
                  onClick={handleClosePopup}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// 動画の長さをフォーマットする関数
function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return '不明'

  const hours = (match[1] || '').replace('H', '')
  const minutes = (match[2] || '').replace('M', '')
  const seconds = (match[3] || '').replace('S', '')

  let result = ''
  if (hours) result += `${hours}:`
  result += `${minutes.padStart(2, '0')}:`
  result += seconds.padStart(2, '0')

  return result
}