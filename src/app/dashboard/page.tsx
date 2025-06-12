'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getUserProgress, type UserProgress } from '@/lib/progressStore'

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

export default function DashboardPage() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // クライアントサイドでのみ進捗データを読み込み
    setUserProgress(getUserProgress())
    setIsLoaded(true)
  }, [])

  // 現在の駅情報を取得
  const getCurrentStation = () => {
    if (!userProgress?.currentStation) {
      return yamanoteStations[0] // デフォルトは東京駅
    }
    return yamanoteStations.find(station => station.id === userProgress.currentStation) || yamanoteStations[0]
  }

  const getNextStation = () => {
    const current = getCurrentStation()
    const currentIndex = yamanoteStations.findIndex(station => station.id === current.id)
    return yamanoteStations[currentIndex + 1] || null
  }

  // ローディング中の表示
  if (!isLoaded || !userProgress) {
    return (
      <div className="min-h-screen bg-gray-50">
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
                <Link href="/dashboard" className="text-blue-600 font-medium">ダッシュボード</Link>
                <Link href="/exercise" className="text-gray-600 hover:text-gray-900">エクササイズ</Link>
                <Link href="/map" className="text-gray-600 hover:text-gray-900">地図</Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-2">🚃</div>
            <p className="text-gray-600">進捗データを読み込み中...</p>
          </div>
        </main>
      </div>
    )
  }

  const currentStation = getCurrentStation()
  const nextStation = getNextStation()
  const completionRate = (userProgress.completedStations.length / 29) * 100
  return (
    <div className="min-h-screen bg-gray-50">
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
              <Link href="/dashboard" className="text-blue-600 font-medium">ダッシュボード</Link>
              <Link href="/exercise" className="text-gray-600 hover:text-gray-900">エクササイズ</Link>
              <Link href="/map" className="text-gray-600 hover:text-gray-900">地図</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            おかえりなさい！
          </h1>
          <p className="text-gray-600">今日も一緒に日本を旅しましょう 🚉</p>
        </div>

        {/* 現在位置情報 */}
        <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">現在位置</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg">
                <span className="font-medium">山手線</span>
              </p>
              <p className="text-2xl font-bold">{currentStation.name}</p>
              <p className="text-sm opacity-90">JR東日本 / JR</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{userProgress.completedStations.length}</p>
              <p className="text-sm">駅制覇</p>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{userProgress.totalExercisesCompleted}</p>
                <p className="text-gray-600">総エクササイズ数</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">💪</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{userProgress.completedStations.length}</p>
                <p className="text-gray-600">制覇済み駅数</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
                <p className="text-gray-600">山手線制覇率</p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最近の活動 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">最近の活動</h3>
            {userProgress.totalExercisesCompleted === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-gray-600 mb-4">まだ活動がありません</p>
                <Link
                  href="/exercise"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  最初のエクササイズを始める
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <span className="text-lg">🏃‍♂️</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">エクササイズ完了</p>
                    <p className="text-sm text-green-600">
                      {userProgress.totalExercisesCompleted}回完了 | {userProgress.completedStations.length}駅制覇
                    </p>
                  </div>
                </div>
                {userProgress.lastUpdated && (
                  <p className="text-xs text-gray-500">
                    最終更新: {new Date(userProgress.lastUpdated).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
            )}</div>

          {/* クイックアクション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">クイックアクション</h3>
            <div className="space-y-4">
              <Link
                href="/exercise"
                className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium"
              >
                🏃‍♂️ エクササイズを始める
              </Link>
              <Link
                href="/map"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium"
              >
                🗺️ 地図を見る
              </Link>
              <button className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-lg font-medium">
                📊 統計を詳しく見る
              </button>
            </div>
          </div>
        </div>

        {/* 進捗情報 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">ゲーム進行状況</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">現在の路線</h4>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">山手線</p>
                  <p className="text-sm text-gray-600">JR東日本</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">次の目標</h4>
              <div className="p-3 bg-blue-50 rounded-lg">
                {nextStation ? (
                  <>
                    <p className="font-medium text-blue-800">{nextStation.name}</p>
                    <p className="text-sm text-blue-600">エクササイズ1本で到達</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-green-800">🎉 山手線完全制覇！</p>
                    <p className="text-sm text-green-600">おめでとうございます！</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}