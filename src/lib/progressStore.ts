// ユーザーの進捗管理用のローカルストレージヘルパー

export interface UserProgress {
  completedStations: string[]
  currentStation: string | null
  currentLine: string | null
  totalExercisesCompleted: number
  lastUpdated: string
}

const STORAGE_KEY = 'tetsundo_user_progress'

// デフォルトの進捗状態
const defaultProgress: UserProgress = {
  completedStations: [],
  currentStation: null,
  currentLine: null,
  totalExercisesCompleted: 0,
  lastUpdated: new Date().toISOString()
}

// 進捗データを取得
export function getUserProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return defaultProgress
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // 初回の場合は山手線の東京駅から開始
      const initialProgress = {
        ...defaultProgress,
        currentStation: 'tokyo',
        currentLine: 'yamanote'
      }
      saveUserProgress(initialProgress)
      return initialProgress
    }
    
    const parsed = JSON.parse(stored)
    const progress = {
      ...defaultProgress,
      ...parsed
    }
    
    // 現在駅が設定されていない場合は東京駅から開始
    if (!progress.currentStation || !progress.currentLine) {
      progress.currentStation = 'tokyo'
      progress.currentLine = 'yamanote'
      saveUserProgress(progress)
    }
    
    return progress
  } catch (error) {
    console.error('Error loading user progress:', error)
    return defaultProgress
  }
}

// 進捗データを保存
export function saveUserProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    progress.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Error saving user progress:', error)
  }
}

// エクササイズ完了時の進捗更新
export function completeExercise(): string | null {
  const progress = getUserProgress()
  
  // 現在の路線と駅を取得（最初は山手線の東京駅から開始）
  if (!progress.currentLine || !progress.currentStation) {
    progress.currentLine = 'yamanote'
    progress.currentStation = 'tokyo'
  }

  // 現在の駅を完了駅に追加
  if (!progress.completedStations.includes(progress.currentStation)) {
    progress.completedStations.push(progress.currentStation)
  }

  // 次の駅に進む
  const nextStation = getNextStation(progress.currentLine, progress.currentStation)
  if (nextStation) {
    progress.currentStation = nextStation.id
    // 必要に応じて路線変更のロジックを追加
  }

  progress.totalExercisesCompleted += 1
  saveUserProgress(progress)

  return nextStation?.name || null
}

// 次の駅を取得する関数
function getNextStation(lineId: string, currentStationId: string): { id: string, name: string } | null {
  // この部分は実際の路線データから次の駅を検索する必要があります
  // 今は簡単な例として山手線の順序で返します
  
  const yamanoteStations = [
    { id: 'tokyo', name: '東京駅' },
    { id: 'yurakucho', name: '有楽町駅' },
    { id: 'shimbashi', name: '新橋駅' },
    { id: 'hamamatsucho', name: '浜松町駅' },
    { id: 'tamachi', name: '田町駅' },
    { id: 'shinagawa', name: '品川駅' },
    { id: 'osaki', name: '大崎駅' },
    { id: 'gotanda', name: '五反田駅' },
    { id: 'meguro', name: '目黒駅' },
    { id: 'ebisu', name: '恵比寿駅' },
    { id: 'shibuya', name: '渋谷駅' },
    { id: 'harajuku', name: '原宿駅' },
    { id: 'yoyogi', name: '代々木駅' },
    { id: 'shinjuku', name: '新宿駅' },
    { id: 'shinjuku_new', name: '新大久保駅' },
    { id: 'takadanobaba', name: '高田馬場駅' },
    { id: 'mejiro', name: '目白駅' },
    { id: 'ikebukuro', name: '池袋駅' },
    { id: 'otsuka', name: '大塚駅' },
    { id: 'sugamo', name: '巣鴨駅' },
    { id: 'komagome', name: '駒込駅' },
    { id: 'tabata', name: '田端駅' },
    { id: 'nishippori', name: '西日暮里駅' },
    { id: 'nippori', name: '日暮里駅' },
    { id: 'uguisudani', name: '鶯谷駅' },
    { id: 'ueno', name: '上野駅' },
    { id: 'okachimachi', name: '御徒町駅' },
    { id: 'akihabara', name: '秋葉原駅' },
    { id: 'kanda', name: '神田駅' }
  ]

  if (lineId === 'yamanote') {
    const currentIndex = yamanoteStations.findIndex(station => station.id === currentStationId)
    if (currentIndex >= 0 && currentIndex < yamanoteStations.length - 1) {
      return yamanoteStations[currentIndex + 1]
    }
  }

  return null
}

// 進捗をリセット
export function resetProgress(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  localStorage.removeItem(STORAGE_KEY)
}

// 現在の駅情報を取得
export function getCurrentStationInfo(): { line: string | null, station: string | null } {
  const progress = getUserProgress()
  return {
    line: progress.currentLine,
    station: progress.currentStation
  }
}