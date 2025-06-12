import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">🚉 Tetsundo</h1>
              <p className="ml-4 text-gray-600">エクササイズ × 全国鉄道制覇ゲーム</p>
            </div>
            <nav className="flex space-x-4">
              <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                ダッシュボード
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            運動しながら日本全国を旅しよう！
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            YouTubeのエクササイズ動画を完了するごとに、日本全国の鉄道路線を1駅ずつ進んでいく新感覚のフィットネスゲーム。
            全路線制覇を目指して、楽しく運動習慣を続けましょう！
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">全国鉄道マップ</h3>
            <p className="text-gray-600">
              JR・私鉄・第三セクターを含む全国の鉄道路線を地図上で表示。進捗に応じて色分けされます。
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">🏃‍♂️</div>
            <h3 className="text-xl font-semibold mb-2">エクササイズ記録</h3>
            <p className="text-gray-600">
              YouTube動画を80%以上視聴で完了判定。1本完了するごとに1駅進みます。
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">進捗ダッシュボード</h3>
            <p className="text-gray-600">
              現在位置、累積駅数、運動履歴をカレンダー形式で確認できます。
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h3 className="text-2xl font-bold mb-6 text-center">ゲームの流れ</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">路線を選択</h4>
              <p className="text-sm text-gray-600">お好みの鉄道路線を選んでスタート</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">動画を再生</h4>
              <p className="text-sm text-gray-600">YouTubeエクササイズ動画を視聴</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-yellow-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">駅を進行</h4>
              <p className="text-sm text-gray-600">80%以上視聴で1駅進みます</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">進捗共有</h4>
              <p className="text-sm text-gray-600">Slackで運動記録をシェア</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            今すぐ始める
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <h2 className="text-lg font-semibold text-gray-900">🚉 Tetsundo</h2>
              <p className="ml-2 text-gray-600">エクササイズ × 全国鉄道制覇ゲーム</p>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link href="/about" className="hover:text-gray-900">
                アプリについて
              </Link>
              <Link href="/privacy" className="hover:text-gray-900">
                プライバシーポリシー
              </Link>
              <Link href="/contact" className="hover:text-gray-900">
                お問い合わせ
              </Link>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
            <p>&copy; 2024 Tetsundo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}