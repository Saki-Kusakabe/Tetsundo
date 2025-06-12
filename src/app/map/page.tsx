'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getUserProgress, resetProgress, type UserProgress } from '@/lib/progressStore'

// LeafletMapをdynamic importで読み込み（SSRを無効化）
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-2">🚃</div>
        <p className="text-gray-600">マップを読み込み中...</p>
      </div>
    </div>
  )
})


// 鉄道路線データ（JR・私鉄を含む）
const sampleRailwayLines = [
  // JR山手線
  {
    id: 'yamanote',
    name: '山手線',
    color: '#9ACD32',
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'tokyo', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 1 },
      { id: 'yurakucho', name: '有楽町駅', latitude: 35.6751, longitude: 139.7640, order: 2 },
      { id: 'shimbashi', name: '新橋駅', latitude: 35.6658, longitude: 139.7583, order: 3 },
      { id: 'hamamatsucho', name: '浜松町駅', latitude: 35.6556, longitude: 139.7568, order: 4 },
      { id: 'tamachi', name: '田町駅', latitude: 35.6458, longitude: 139.7476, order: 5 },
      { id: 'shinagawa', name: '品川駅', latitude: 35.6284, longitude: 139.7387, order: 6 },
      { id: 'osaki', name: '大崎駅', latitude: 35.6197, longitude: 139.7286, order: 7 },
      { id: 'gotanda', name: '五反田駅', latitude: 35.6258, longitude: 139.7238, order: 8 },
      { id: 'meguro', name: '目黒駅', latitude: 35.6332, longitude: 139.7156, order: 9 },
      { id: 'ebisu', name: '恵比寿駅', latitude: 35.6467, longitude: 139.7100, order: 10 },
      { id: 'shibuya', name: '渋谷駅', latitude: 35.6580, longitude: 139.7016, order: 11 },
      { id: 'harajuku', name: '原宿駅', latitude: 35.6702, longitude: 139.7027, order: 12 },
      { id: 'yoyogi', name: '代々木駅', latitude: 35.6830, longitude: 139.7020, order: 13 },
      { id: 'shinjuku', name: '新宿駅', latitude: 35.6896, longitude: 139.7006, order: 14 },
      { id: 'shinjuku_new', name: '新大久保駅', latitude: 35.7010, longitude: 139.7005, order: 15 },
      { id: 'takadanobaba', name: '高田馬場駅', latitude: 35.7126, longitude: 139.7038, order: 16 },
      { id: 'mejiro', name: '目白駅', latitude: 35.7214, longitude: 139.7063, order: 17 },
      { id: 'ikebukuro', name: '池袋駅', latitude: 35.7295, longitude: 139.7109, order: 18 },
      { id: 'otsuka', name: '大塚駅', latitude: 35.7318, longitude: 139.7281, order: 19 },
      { id: 'sugamo', name: '巣鴨駅', latitude: 35.7339, longitude: 139.7393, order: 20 },
      { id: 'komagome', name: '駒込駅', latitude: 35.7369, longitude: 139.7468, order: 21 },
      { id: 'tabata', name: '田端駅', latitude: 35.7378, longitude: 139.7606, order: 22 },
      { id: 'nishippori', name: '西日暮里駅', latitude: 35.7320, longitude: 139.7667, order: 23 },
      { id: 'nippori', name: '日暮里駅', latitude: 35.7278, longitude: 139.7710, order: 24 },
      { id: 'uguisudani', name: '鶯谷駅', latitude: 35.7208, longitude: 139.7781, order: 25 },
      { id: 'ueno', name: '上野駅', latitude: 35.7138, longitude: 139.7773, order: 26 },
      { id: 'okachimachi', name: '御徒町駅', latitude: 35.7075, longitude: 139.7745, order: 27 },
      { id: 'akihabara', name: '秋葉原駅', latitude: 35.6989, longitude: 139.7740, order: 28 },
      { id: 'kanda', name: '神田駅', latitude: 35.6916, longitude: 139.7708, order: 29 }
    ]
  },
  // JR中央線（快速）
  {
    id: 'chuo_rapid',
    name: '中央線快速',
    color: '#F15A22',
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'tokyo_chuo', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 1 },
      { id: 'kanda_chuo', name: '神田駅', latitude: 35.6916, longitude: 139.7708, order: 2 },
      { id: 'ochanomizu', name: '御茶ノ水駅', latitude: 35.6993, longitude: 139.7657, order: 3 },
      { id: 'yotsuya', name: '四ツ谷駅', latitude: 35.6868, longitude: 139.7302, order: 4 },
      { id: 'ichigaya', name: '市ヶ谷駅', latitude: 35.6938, longitude: 139.7232, order: 5 },
      { id: 'iidabashi', name: '飯田橋駅', latitude: 35.7026, longitude: 139.7447, order: 6 },
      { id: 'suidobashi', name: '水道橋駅', latitude: 35.7023, longitude: 139.7526, order: 7 },
      { id: 'shinjuku_chuo', name: '新宿駅', latitude: 35.6896, longitude: 139.7006, order: 8 },
      { id: 'yoyogi_chuo', name: '代々木駅', latitude: 35.6830, longitude: 139.7020, order: 9 },
      { id: 'sendagaya', name: '千駄ヶ谷駅', latitude: 35.6833, longitude: 139.7083, order: 10 }
    ]
  },
  // JR東海道線
  {
    id: 'tokaido',
    name: '東海道線',
    color: '#F68B1E',
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'tokyo_tokaido', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 1 },
      { id: 'shimbashi_tokaido', name: '新橋駅', latitude: 35.6658, longitude: 139.7583, order: 2 },
      { id: 'shinagawa_tokaido', name: '品川駅', latitude: 35.6284, longitude: 139.7387, order: 3 },
      { id: 'kawasaki', name: '川崎駅', latitude: 35.5308, longitude: 139.6970, order: 4 },
      { id: 'yokohama', name: '横浜駅', latitude: 35.4658, longitude: 139.6223, order: 5 },
      { id: 'totsuka', name: '戸塚駅', latitude: 35.3983, longitude: 139.5337, order: 6 },
      { id: 'fujisawa', name: '藤沢駅', latitude: 35.3408, longitude: 139.4886, order: 7 },
      { id: 'chigasaki', name: '茅ヶ崎駅', latitude: 35.3351, longitude: 139.4043, order: 8 }
    ]
  },
  // 京急本線
  {
    id: 'keikyuhonsen',
    name: '京急本線',
    color: '#FF0000',
    company: '京浜急行電鉄',
    lineType: '私鉄',
    stations: [
      { id: 'shinagawa_keikyu', name: '品川駅', latitude: 35.6284, longitude: 139.7387, order: 1 },
      { id: 'kitashinagawa', name: '北品川駅', latitude: 35.6227, longitude: 139.7404, order: 2 },
      { id: 'shimbamba', name: '新馬場駅', latitude: 35.6094, longitude: 139.7392, order: 3 },
      { id: 'tateshiba', name: '立会川駅', latitude: 35.5994, longitude: 139.7379, order: 4 },
      { id: 'omorimachi', name: '大森町駅', latitude: 35.5881, longitude: 139.7365, order: 5 },
      { id: 'heiwajimakosu', name: '平和島駅', latitude: 35.5777, longitude: 139.7350, order: 6 },
      { id: 'omorikaigan', name: '大森海岸駅', latitude: 35.5694, longitude: 139.7337, order: 7 },
      { id: 'kamata_keikyu', name: '京急蒲田駅', latitude: 35.5622, longitude: 139.7161, order: 8 },
      { id: 'kojiya', name: '糀谷駅', latitude: 35.5497, longitude: 139.7039, order: 9 },
      { id: 'otorii', name: '大鳥居駅', latitude: 35.5492, longitude: 139.6956, order: 10 },
      { id: 'anamorihama', name: '穴守稲荷駅', latitude: 35.5483, longitude: 139.6875, order: 11 },
      { id: 'tenkubashi', name: '天空橋駅', latitude: 35.5488, longitude: 139.6745, order: 12 },
      { id: 'hanedakuko', name: '羽田空港国内線ターミナル駅', latitude: 35.5492, longitude: 139.6649, order: 13 }
    ]
  },
  // 東急東横線
  {
    id: 'tokyu_toyoko',
    name: '東急東横線',
    color: '#FF6600',
    company: '東急電鉄',
    lineType: '私鉄',
    stations: [
      { id: 'shibuya_tokyu', name: '渋谷駅', latitude: 35.6580, longitude: 139.7016, order: 1 },
      { id: 'daikanyama', name: '代官山駅', latitude: 35.6496, longitude: 139.6984, order: 2 },
      { id: 'naka_meguro', name: '中目黒駅', latitude: 35.6441, longitude: 139.6979, order: 3 },
      { id: 'gakugei_daigaku', name: '学芸大学駅', latitude: 35.6233, longitude: 139.6914, order: 4 },
      { id: 'toritsudaigaku', name: '都立大学駅', latitude: 35.6061, longitude: 139.6850, order: 5 },
      { id: 'jiyugaoka', name: '自由が丘駅', latitude: 35.6085, longitude: 139.6681, order: 6 },
      { id: 'den_en_chofu', name: '田園調布駅', latitude: 35.6030, longitude: 139.6688, order: 7 },
      { id: 'tamagawa', name: '多摩川駅', latitude: 35.5904, longitude: 139.6685, order: 8 },
      { id: 'shinmaruko', name: '新丸子駅', latitude: 35.5778, longitude: 139.6651, order: 9 },
      { id: 'musashi_kosugi', name: '武蔵小杉駅', latitude: 35.5784, longitude: 139.6566, order: 10 },
      { id: 'motosumiyoshi', name: '元住吉駅', latitude: 35.5653, longitude: 139.6515, order: 11 },
      { id: 'hiyoshi', name: '日吉駅', latitude: 35.5555, longitude: 139.6353, order: 12 },
      { id: 'kikuna', name: '菊名駅', latitude: 35.5130, longitude: 139.6340, order: 13 },
      { id: 'ookayama', name: '大倉山駅', latitude: 35.5092, longitude: 139.6258, order: 14 },
      { id: 'tsunashima', name: '綱島駅', latitude: 35.5351, longitude: 139.6314, order: 15 },
      { id: 'yokohama_tokyu', name: '横浜駅', latitude: 35.4658, longitude: 139.6223, order: 16 }
    ]
  },
  // 小田急小田原線
  {
    id: 'odakyu_odawara',
    name: '小田急小田原線',
    color: '#0066CC',
    company: '小田急電鉄',
    lineType: '私鉄',
    stations: [
      { id: 'shinjuku_odakyu', name: '新宿駅', latitude: 35.6896, longitude: 139.7006, order: 1 },
      { id: 'minami_shinjuku', name: '南新宿駅', latitude: 35.6833, longitude: 139.7000, order: 2 },
      { id: 'sangubashi', name: '参宮橋駅', latitude: 35.6747, longitude: 139.6939, order: 3 },
      { id: 'yoyogi_uehara', name: '代々木上原駅', latitude: 35.6692, longitude: 139.6831, order: 4 },
      { id: 'higashi_kitazawa', name: '東北沢駅', latitude: 35.6636, longitude: 139.6736, order: 5 },
      { id: 'shimo_kitazawa', name: '下北沢駅', latitude: 35.6614, longitude: 139.6681, order: 6 },
      { id: 'setagaya_daita', name: '世田谷代田駅', latitude: 35.6575, longitude: 139.6614, order: 7 },
      { id: 'umegaoka', name: '梅ヶ丘駅', latitude: 35.6525, longitude: 139.6547, order: 8 },
      { id: 'gotokuji', name: '豪徳寺駅', latitude: 35.6475, longitude: 139.6481, order: 9 },
      { id: 'kyodo', name: '経堂駅', latitude: 35.6422, longitude: 139.6414, order: 10 },
      { id: 'chitose_funabashi', name: '千歳船橋駅', latitude: 35.6364, longitude: 139.6347, order: 11 },
      { id: 'soshigaya_okura', name: '祖師ヶ谷大蔵駅', latitude: 35.6306, longitude: 139.6281, order: 12 }
    ]
  },
  // 東京メトロ銀座線
  {
    id: 'ginza_line',
    name: '銀座線',
    color: '#FF9900',
    company: '東京メトロ',
    lineType: '地下鉄',
    stations: [
      { id: 'asakusa_ginza', name: '浅草駅', latitude: 35.7117, longitude: 139.7966, order: 1 },
      { id: 'tawaramachi', name: '田原町駅', latitude: 35.7078, longitude: 139.7838, order: 2 },
      { id: 'inaricho', name: '稲荷町駅', latitude: 35.7056, longitude: 139.7808, order: 3 },
      { id: 'ueno_ginza', name: '上野駅', latitude: 35.7138, longitude: 139.7773, order: 4 },
      { id: 'ueno_hirokoji', name: '上野広小路駅', latitude: 35.7076, longitude: 139.7727, order: 5 },
      { id: 'suehirocho', name: '末広町駅', latitude: 35.7026, longitude: 139.7721, order: 6 },
      { id: 'kanda_ginza', name: '神田駅', latitude: 35.6916, longitude: 139.7708, order: 7 },
      { id: 'mitsukoshimae', name: '三越前駅', latitude: 35.6889, longitude: 139.7703, order: 8 },
      { id: 'nihombashi_ginza', name: '日本橋駅', latitude: 35.6810, longitude: 139.7738, order: 9 },
      { id: 'kyoboshi', name: '京橋駅', latitude: 35.6758, longitude: 139.7708, order: 10 },
      { id: 'ginza_ginza', name: '銀座駅', latitude: 35.6722, longitude: 139.7647, order: 11 },
      { id: 'shimbashi_ginza', name: '新橋駅', latitude: 35.6658, longitude: 139.7583, order: 12 },
      { id: 'toranomon', name: '虎ノ門駅', latitude: 35.6694, longitude: 139.7497, order: 13 },
      { id: 'tameike_sanno', name: '溜池山王駅', latitude: 35.6733, longitude: 139.7397, order: 14 },
      { id: 'akasaka_mitsuke', name: '赤坂見附駅', latitude: 35.6778, longitude: 139.7361, order: 15 },
      { id: 'aoyama_itchome', name: '青山一丁目駅', latitude: 35.6725, longitude: 139.7244, order: 16 },
      { id: 'gaienmae', name: '外苑前駅', latitude: 35.6750, longitude: 139.7194, order: 17 },
      { id: 'omotesando_ginza', name: '表参道駅', latitude: 35.6658, longitude: 139.7125, order: 18 },
      { id: 'shibuya_ginza', name: '渋谷駅', latitude: 35.6580, longitude: 139.7016, order: 19 }
    ]
  }
]

export default function MapPage() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // クライアントサイドでのみ進捗データを読み込み
    setUserProgress(getUserProgress())
    setIsLoaded(true)
  }, [])

  // 進捗リセット機能（開発用）
  const handleResetProgress = () => {
    resetProgress()
    setUserProgress(getUserProgress())
  }

  // 進捗が読み込まれていない場合はローディング表示
  if (!isLoaded || !userProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">🚃</div>
          <p className="text-gray-600">進捗データを読み込み中...</p>
        </div>
      </div>
    )
  }
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
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">ダッシュボード</Link>
              <Link href="/exercise" className="text-gray-600 hover:text-gray-900">エクササイズ</Link>
              <Link href="/map" className="text-blue-600 font-medium">地図</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🗺️ 全国鉄道マップ
          </h1>
          <p className="text-lg text-gray-600">
            あなたの進捗を地図上で確認しましょう
          </p>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🚉</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{userProgress.completedStations.length}</p>
                <p className="text-gray-600">通過済み駅数</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">🛤️</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{sampleRailwayLines.length}</p>
                <p className="text-gray-600">利用可能路線</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📍</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{sampleRailwayLines.reduce((total, line) => total + line.stations.length, 0)}</p>
                <p className="text-gray-600">総駅数</p>
              </div>
            </div>
          </div>
        </div>

        {/* 現在の進捗と開発用ツール */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">進捗状況</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">現在の状況</h3>
              <p className="text-sm text-gray-600">現在の路線: {userProgress.currentLine || '未設定'}</p>
              <p className="text-sm text-gray-600">現在の駅: {userProgress.currentStation || '未設定'}</p>
              <p className="text-sm text-gray-600">完了したエクササイズ: {userProgress.totalExercisesCompleted}回</p>
              <p className="text-sm text-gray-600">最終更新: {userProgress.lastUpdated ? new Date(userProgress.lastUpdated).toLocaleString('ja-JP') : '未更新'}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">開発用ツール</h3>
              <button
                onClick={handleResetProgress}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg"
              >
                進捗をリセット
              </button>
            </div>
          </div>
        </div>

        {/* 地図エリア */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🗺️ 鉄道路線マップ</h2>
          <LeafletMap
            railwayLines={sampleRailwayLines}
            userProgress={userProgress.completedStations}
            center={[35.6812, 139.7671]} // 東京駅
            zoom={11}
          />
          <div className="mt-4 text-sm text-gray-600">
            <p>• 駅をクリックすると詳細情報が表示されます</p>
            <p>• 緑色の駅は通過済み、灰色の駅は未通過を表します</p>
            <p>• ズームイン・アウトで路線の詳細を確認できます</p>
          </div>
        </div>

        {/* 路線一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">路線一覧</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleRailwayLines.map((line) => {
              const completedStations = line.stations.filter(station => userProgress.completedStations.includes(station.id)).length
              const totalStations = line.stations.length
              const completionRate = totalStations > 0 ? (completedStations / totalStations) * 100 : 0
              
              return (
                <div key={line.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{line.name}</h3>
                    <span
                      className="inline-block w-4 h-4 rounded-full"
                      style={{ backgroundColor: line.color }}
                    ></span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {line.company} / {line.lineType}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {completedStations} / {totalStations} 駅
                    </span>
                    <span className="font-medium text-blue-600">
                      {completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 凡例 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">凡例</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">通過済みの駅</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">未通過の駅</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-1 bg-blue-500 mr-3"></div>
              <span className="text-sm text-gray-700">鉄道路線</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">クリックで駅情報を表示</span>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-8 text-center">
          <Link
            href="/exercise"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mr-4"
          >
            エクササイズを始める
          </Link>
          <Link
            href="/dashboard"
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}