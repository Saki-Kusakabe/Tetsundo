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
      { id: 'shinokubo', name: '新大久保駅', latitude: 35.7010, longitude: 139.7005, order: 15 },
      { id: 'takadanobaba', name: '高田馬場駅', latitude: 35.7126, longitude: 139.7038, order: 16 },
      { id: 'mejiro', name: '目白駅', latitude: 35.7214, longitude: 139.7063, order: 17 },
      { id: 'ikebukuro', name: '池袋駅', latitude: 35.7295, longitude: 139.7109, order: 18 },
      { id: 'otsuka', name: '大塚駅', latitude: 35.7318, longitude: 139.7281, order: 19 },
      { id: 'sugamo', name: '巣鴨駅', latitude: 35.7339, longitude: 139.7393, order: 20 },
      { id: 'komagome', name: '駒込駅', latitude: 35.7369, longitude: 139.7468, order: 21 },
      { id: 'tabata', name: '田端駅', latitude: 35.7378, longitude: 139.7606, order: 22 },
      { id: 'nishinippori', name: '西日暮里駅', latitude: 35.7320, longitude: 139.7667, order: 23 },
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
      { id: 'sendagaya', name: '千駄ヶ谷駅', latitude: 35.6833, longitude: 139.7083, order: 10 },
      { id: 'shinanomachi', name: '信濃町駅', latitude: 35.6800, longitude: 139.7161, order: 11 },
      { id: 'kokuritsu_kyogijo', name: '国立競技場駅', latitude: 35.6766, longitude: 139.7180, order: 12 },
      { id: 'nakano_chuo', name: '中野駅', latitude: 35.7032, longitude: 139.6646, order: 13 },
      { id: 'koenji', name: '高円寺駅', latitude: 35.7061, longitude: 139.6496, order: 14 },
      { id: 'asagaya', name: '阿佐ヶ谷駅', latitude: 35.7058, longitude: 139.6366, order: 15 },
      { id: 'ogikubo', name: '荻窪駅', latitude: 35.7032, longitude: 139.6234, order: 16 },
      { id: 'nishi_ogikubo', name: '西荻窪駅', latitude: 35.7013, longitude: 139.6105, order: 17 },
      { id: 'kichijoji', name: '吉祥寺駅', latitude: 35.7036, longitude: 139.5794, order: 18 },
      { id: 'mitaka', name: '三鷹駅', latitude: 35.7033, longitude: 139.5601, order: 19 },
      { id: 'musashisakai', name: '武蔵境駅', latitude: 35.7051, longitude: 139.5447, order: 20 },
      { id: 'higashikoganei', name: '東小金井駅', latitude: 35.7061, longitude: 139.5298, order: 21 },
      { id: 'musashikoganei', name: '武蔵小金井駅', latitude: 35.7077, longitude: 139.5165, order: 22 },
      { id: 'kokubunji', name: '国分寺駅', latitude: 35.7011, longitude: 139.4897, order: 23 },
      { id: 'nishi_kokubunji', name: '西国分寺駅', latitude: 35.6980, longitude: 139.4754, order: 24 },
      { id: 'kunitachi', name: '国立駅', latitude: 35.6957, longitude: 139.4589, order: 25 },
      { id: 'tachikawa', name: '立川駅', latitude: 35.6997, longitude: 139.4167, order: 26 },
      { id: 'hino', name: '日野駅', latitude: 35.6888, longitude: 139.3879, order: 27 },
      { id: 'toyoda', name: '豊田駅', latitude: 35.6778, longitude: 139.3496, order: 28 },
      { id: 'hachioji', name: '八王子駅', latitude: 35.6575, longitude: 139.3392, order: 29 },
      { id: 'nishi_hachioji', name: '西八王子駅', latitude: 35.6565, longitude: 139.3094, order: 30 },
      { id: 'takao', name: '高尾駅', latitude: 35.6322, longitude: 139.2678, order: 31 }
    ]
  },
  // JR中央線（各駅停車）
  {
    id: 'chuo_local',
    name: '中央線各駅停車',
    color: '#FFD700', // 総武線各駅停車と同じ色
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'tokyo_chuo_l', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 1 },
      { id: 'kanda_chuo_l', name: '神田駅', latitude: 35.6916, longitude: 139.7708, order: 2 },
      { id: 'ochanomizu_l', name: '御茶ノ水駅', latitude: 35.6993, longitude: 139.7657, order: 3 },
      { id: 'suidobashi_l', name: '水道橋駅', latitude: 35.7023, longitude: 139.7526, order: 4 },
      { id: 'iidabashi_l', name: '飯田橋駅', latitude: 35.7026, longitude: 139.7447, order: 5 },
      { id: 'ichigaya_l', name: '市ヶ谷駅', latitude: 35.6938, longitude: 139.7232, order: 6 },
      { id: 'yotsuya_l', name: '四ツ谷駅', latitude: 35.6868, longitude: 139.7302, order: 7 },
      { id: 'shinanomachi_l', name: '信濃町駅', latitude: 35.6800, longitude: 139.7161, order: 8 },
      { id: 'sendagaya_l', name: '千駄ヶ谷駅', latitude: 35.6833, longitude: 139.7083, order: 9 },
      { id: 'yoyogi_l', name: '代々木駅', latitude: 35.6830, longitude: 139.7020, order: 10 },
      { id: 'shinjuku_l', name: '新宿駅', latitude: 35.6896, longitude: 139.7006, order: 11 },
      { id: 'okubo', name: '大久保駅', latitude: 35.7011, longitude: 139.6976, order: 12 },
      { id: 'higashi_nakano', name: '東中野駅', latitude: 35.7077, longitude: 139.6866, order: 13 },
      { id: 'nakano_l', name: '中野駅', latitude: 35.7032, longitude: 139.6646, order: 14 } // 以降、東西線直通区間は省略
    ]
  },
  // JR総武線（快速）
  {
    id: 'sobu_rapid',
    name: '総武線快速',
    color: '#800080', // 紫色
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'chiba_sobu_r', name: '千葉駅', latitude: 35.6194, longitude: 140.1118, order: 1 },
      { id: 'inage_r', name: '稲毛駅', latitude: 35.6310, longitude: 140.0703, order: 2 },
      { id: 'tsudanuma_r', name: '津田沼駅', latitude: 35.6881, longitude: 140.0152, order: 3 },
      { id: 'funabashi_r', name: '船橋駅', latitude: 35.7042, longitude: 139.9868, order: 4 },
      { id: 'ichikawa_r', name: '市川駅', latitude: 35.7299, longitude: 139.9070, order: 5 },
      { id: 'shin_koiwa_r', name: '新小岩駅', latitude: 35.7196, longitude: 139.8596, order: 6 },
      { id: 'kinshicho_r', name: '錦糸町駅', latitude: 35.6966, longitude: 139.8150, order: 7 },
      { id: 'bakurocho', name: '馬喰町駅', latitude: 35.6936, longitude: 139.7797, order: 8 },
      { id: 'shin_nihombashi', name: '新日本橋駅', latitude: 35.6896, longitude: 139.7719, order: 9 },
      { id: 'tokyo_sobu_r', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 10 }
    ]
  },
  // JR京浜東北線
  {
    id: 'keihintohoku',
    name: '京浜東北線',
    color: '#00BFFF',
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'omiya_keihin', name: '大宮駅', latitude: 35.9069, longitude: 139.6223, order: 1 },
      { id: 'saitama_shintoshin', name: 'さいたま新都心駅', latitude: 35.8943, longitude: 139.6300, order: 2 },
      { id: 'yono', name: '与野駅', latitude: 35.8821, longitude: 139.6341, order: 3 },
      { id: 'kita_urawa', name: '北浦和駅', latitude: 35.8703, longitude: 139.6343, order: 4 },
      { id: 'urawa', name: '浦和駅', latitude: 35.8601, longitude: 139.6342, order: 5 },
      { id: 'minami_urawa', name: '南浦和駅', latitude: 35.8360, longitude: 139.6540, order: 6 },
      { id: 'warabi', name: '蕨駅', latitude: 35.8208, longitude: 139.6738, order: 7 },
      { id: 'nishi_kawaguchi', name: '西川口駅', latitude: 35.8080, longitude: 139.6853, order: 8 },
      { id: 'kawaguchi', name: '川口駅', latitude: 35.7950, longitude: 139.7118, order: 9 },
      { id: 'akabane', name: '赤羽駅', latitude: 35.7788, longitude: 139.7212, order: 10 },
      { id: 'higashi_jujo', name: '東十条駅', latitude: 35.7663, longitude: 139.7303, order: 11 },
      { id: 'ooji', name: '王子駅', latitude: 35.7554, longitude: 139.7380, order: 12 },
      { id: 'kami_nakazato', name: '上中里駅', latitude: 35.7483, longitude: 139.7431, order: 13 },
      { id: 'tabata_keihin', name: '田端駅', latitude: 35.7378, longitude: 139.7606, order: 14 },
      { id: 'nishinippori_keihin', name: '西日暮里駅', latitude: 35.7320, longitude: 139.7667, order: 15 },
      { id: 'nippori_keihin', name: '日暮里駅', latitude: 35.7278, longitude: 139.7710, order: 16 },
      { id: 'uguisudani_keihin', name: '鶯谷駅', latitude: 35.7208, longitude: 139.7781, order: 17 },
      { id: 'ueno_keihin', name: '上野駅', latitude: 35.7138, longitude: 139.7773, order: 18 },
      { id: 'okachimachi_keihin', name: '御徒町駅', latitude: 35.7075, longitude: 139.7745, order: 19 },
      { id: 'kanda_keihin', name: '神田駅', latitude: 35.6916, longitude: 139.7708, order: 20 },
      { id: 'tokyo_keihin', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 21 },
      { id: 'yurakucho_keihin', name: '有楽町駅', latitude: 35.6751, longitude: 139.7640, order: 22 },
      { id: 'shimbashi_keihin', name: '新橋駅', latitude: 35.6658, longitude: 139.7583, order: 23 },
      { id: 'hamamatsucho_keihin', name: '浜松町駅', latitude: 35.6556, longitude: 139.7568, order: 24 },
      { id: 'tamachi_keihin', name: '田町駅', latitude: 35.6458, longitude: 139.7476, order: 25 },
      { id: 'shinagawa_keihin', name: '品川駅', latitude: 35.6284, longitude: 139.7387, order: 26 },
      { id: 'oimachi', name: '大井町駅', latitude: 35.6027, longitude: 139.7346, order: 27 },
      { id: 'oomori', name: '大森駅', latitude: 35.5902, longitude: 139.7288, order: 28 },
      { id: 'kamata', name: '蒲田駅', latitude: 35.5622, longitude: 139.7161, order: 29 },
      { id: 'kawasaki_keihin', name: '川崎駅', latitude: 35.5308, longitude: 139.6970, order: 30 }
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
      { id: 'chigasaki', name: '茅ヶ崎駅', latitude: 35.3351, longitude: 139.4043, order: 8 },
      { id: 'hiratsuka', name: '平塚駅', latitude: 35.3263, longitude: 139.3404, order: 9 },
      { id: 'o_iso', name: '大磯駅', latitude: 35.3121, longitude: 139.3101, order: 10 },
      { id: 'ninomiya', name: '二宮駅', latitude: 35.3082, longitude: 139.2785, order: 11 },
      { id: 'kozuki', name: '国府津駅', latitude: 35.2975, longitude: 139.2227, order: 12 },
      { id: 'odawara', name: '小田原駅', latitude: 35.2570, longitude: 139.1557, order: 13 }
    ]
  },
  // JR横須賀線
  {
    id: 'yokosuka',
    name: '横須賀線',
    color: '#0066CC',
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'tokyo_yokosuka', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 1 },
      { id: 'shimbashi_yokosuka', name: '新橋駅', latitude: 35.6658, longitude: 139.7583, order: 2 },
      { id: 'shinagawa_yokosuka', name: '品川駅', latitude: 35.6284, longitude: 139.7387, order: 3 },
      { id: 'nishi_ooi', name: '西大井駅', latitude: 35.5947, longitude: 139.7027, order: 4 },
      { id: 'musashi_kosugi_yokosuka', name: '武蔵小杉駅', latitude: 35.5784, longitude: 139.6566, order: 5 },
      { id: 'shin_kawasaki', name: '新川崎駅', latitude: 35.5688, longitude: 139.6640, order: 6 },
      { id: 'yokohama_yokosuka', name: '横浜駅', latitude: 35.4658, longitude: 139.6223, order: 7 },
      { id: 'hodogaya', name: '保土ケ谷駅', latitude: 35.4426, longitude: 139.5960, order: 8 },
      { id: 'higashi_totsuka', name: '東戸塚駅', latitude: 35.4057, longitude: 139.5447, order: 9 },
      { id: 'totsuka_yokosuka', name: '戸塚駅', latitude: 35.3983, longitude: 139.5337, order: 10 },
      { id: 'oofuna_yokosuka', name: '大船駅', latitude: 35.3524, longitude: 139.5303, order: 11 },
      { id: 'kitakamakura', name: '北鎌倉駅', latitude: 35.3377, longitude: 139.5459, order: 12 },
      { id: 'kamakura', name: '鎌倉駅', latitude: 35.3182, longitude: 139.5492, order: 13 },
      { id: 'zushi', name: '逗子駅', latitude: 35.2974, longitude: 139.5786, order: 14 },
      { id: 'higashi_zushi', name: '東逗子駅', latitude: 35.2903, longitude: 139.5900, order: 15 },
      { id: 'taura', name: '田浦駅', latitude: 35.2818, longitude: 139.6105, order: 16 },
      { id: 'yokosuka', name: '横須賀駅', latitude: 35.2811, longitude: 139.6508, order: 17 }
    ]
  },
  // JR埼京線
  {
    id: 'saikyo',
    name: '埼京線',
    color: '#008C45',
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'osaki_saikyo', name: '大崎駅', latitude: 35.6197, longitude: 139.7286, order: 1 },
      { id: 'ebisu_saikyo', name: '恵比寿駅', latitude: 35.6467, longitude: 139.7100, order: 2 },
      { id: 'shibuya_saikyo', name: '渋谷駅', latitude: 35.6580, longitude: 139.7016, order: 3 },
      { id: 'shinjuku_saikyo', name: '新宿駅', latitude: 35.6896, longitude: 139.7006, order: 4 },
      { id: 'ikebukuro_saikyo', name: '池袋駅', latitude: 35.7295, longitude: 139.7109, order: 5 },
      { id: 'itabashi', name: '板橋駅', latitude: 35.7483, longitude: 139.7145, order: 6 },
      { id: 'jujo', name: '十条駅', latitude: 35.7600, longitude: 139.7155, order: 7 },
      { id: 'akabane_saikyo', name: '赤羽駅', latitude: 35.7788, longitude: 139.7212, order: 8 },
      { id: 'kita_akabane', name: '北赤羽駅', latitude: 35.7894, longitude: 139.7093, order: 9 },
      { id: 'ukima_funado', name: '浮間舟渡駅', latitude: 35.8040, longitude: 139.6976, order: 10 },
      { id: 'toda_koen', name: '戸田公園駅', latitude: 35.8088, longitude: 139.6918, order: 11 },
      { id: 'toda', name: '戸田駅', latitude: 35.8194, longitude: 139.6797, order: 12 },
      { id: 'kitatoda', name: '北戸田駅', latitude: 35.8306, longitude: 139.6644, order: 13 },
      { id: 'musashi_urawa', name: '武蔵浦和駅', latitude: 35.8450, longitude: 139.6466, order: 14 },
      { id: 'nakaurawa', name: '中浦和駅', latitude: 35.8466, longitude: 139.6384, order: 15 },
      { id: 'minami_yono', name: '南与野駅', latitude: 35.8561, longitude: 139.6262, order: 16 },
      { id: 'yono_honmachi', name: '与野本町駅', latitude: 35.8647, longitude: 139.6174, order: 17 },
      { id: 'kita_yono', name: '北与野駅', latitude: 35.8754, longitude: 139.6190, order: 18 },
      { id: 'omiya_saikyo', name: '大宮駅', latitude: 35.9069, longitude: 139.6223, order: 19 }
    ]
  },
  // JR湘南新宿ライン
  {
    id: 'shonan_shinjuku',
    name: '湘南新宿ライン',
    color: '#EE82EE',
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      // 東京近郊区間のみ抜粋
      { id: 'osaki_shonan', name: '大崎駅', latitude: 35.6197, longitude: 139.7286, order: 1 },
      { id: 'ebisu_shonan', name: '恵比寿駅', latitude: 35.6467, longitude: 139.7100, order: 2 },
      { id: 'shibuya_shonan', name: '渋谷駅', latitude: 35.6580, longitude: 139.7016, order: 3 },
      { id: 'shinjuku_shonan', name: '新宿駅', latitude: 35.6896, longitude: 139.7006, order: 4 },
      { id: 'ikebukuro_shonan', name: '池袋駅', latitude: 35.7295, longitude: 139.7109, order: 5 },
      { id: 'akabane_shonan', name: '赤羽駅', latitude: 35.7788, longitude: 139.7212, order: 6 },
      { id: 'urawa_shonan', name: '浦和駅', latitude: 35.8601, longitude: 139.6342, order: 7 },
      { id: 'omiya_shonan', name: '大宮駅', latitude: 35.9069, longitude: 139.6223, order: 8 }
    ]
  },
  // JR上野東京ライン
  {
    id: 'ueno_tokyo',
    name: '上野東京ライン',
    color: '#228B22', // フォレストグリーン
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'ueno_ut', name: '上野駅', latitude: 35.7138, longitude: 139.7773, order: 1 },
      { id: 'tokyo_ut', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 2 },
      { id: 'shimbashi_ut', name: '新橋駅', latitude: 35.6658, longitude: 139.7583, order: 3 },
      { id: 'shinagawa_ut', name: '品川駅', latitude: 35.6284, longitude: 139.7387, order: 4 }
      // 東海道線・宇都宮線・高崎線へ直通するため、以降の駅は省略
    ]
  },
  // JR武蔵野線
  {
    id: 'musashino',
    name: '武蔵野線',
    color: '#FF4500', // オレンジレッド
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'fuchu_hommachi', name: '府中本町駅', latitude: 35.6706, longitude: 139.4794, order: 1 },
      { id: 'kita_fuchu', name: '北府中駅', latitude: 35.6842, longitude: 139.4892, order: 2 },
      { id: 'nishi_kokubunji_mu', name: '西国分寺駅', latitude: 35.6980, longitude: 139.4754, order: 3 },
      { id: 'shin_kodaira', name: '新小平駅', latitude: 35.7275, longitude: 139.4864, order: 4 },
      { id: 'shin_akitsu', name: '新秋津駅', latitude: 35.7600, longitude: 139.4858, order: 5 },
      { id: 'higashi_tokorozawa', name: '東所沢駅', latitude: 35.7925, longitude: 139.4936, order: 6 },
      { id: 'shin_koshigaya', name: '新越谷駅', latitude: 35.8860, longitude: 139.7940, order: 7 },
      { id: 'minami_urawa_mu', name: '南浦和駅', latitude: 35.8360, longitude: 139.6540, order: 8 },
      { id: 'minami_koshigaya', name: '南越谷駅', latitude: 35.8860, longitude: 139.7940, order: 9 }, // 新越谷と重複
      { id: 'koshigaya_laketown', name: '越谷レイクタウン駅', latitude: 35.8756, longitude: 139.8242, order: 10 },
      { id: 'yoshikawa', name: '吉川駅', latitude: 35.8833, longitude: 139.8394, order: 11 },
      { id: 'yoshikawaminami', name: '吉川美南駅', latitude: 35.8845, longitude: 139.8510, order: 12 },
      { id: 'shin_misato', name: '新三郷駅', latitude: 35.8889, longitude: 139.8667, order: 13 },
      { id: 'misato', name: '三郷駅', latitude: 35.8861, longitude: 139.8800, order: 14 },
      { id: 'minami_nagareyama', name: '南流山駅', latitude: 35.8678, longitude: 139.9072, order: 15 },
      { id: 'shin_matsudo', name: '新松戸駅', latitude: 35.8078, longitude: 139.9239, order: 16 },
      { id: 'higashi_matsudo', name: '東松戸駅', latitude: 35.7953, longitude: 139.9406, order: 17 },
      { id: 'ichikawa_oowada', name: '市川大野駅', latitude: 35.7608, longitude: 139.9814, order: 18 },
      { id: 'funa_bashi_hoten', name: '船橋法典駅', latitude: 35.7380, longitude: 139.9984, order: 19 },
      { id: 'nishi_funabashi_mu', name: '西船橋駅', latitude: 35.7058, longitude: 139.9575, order: 20 }
    ]
  },
  // JR京葉線
  {
    id: 'keiyo',
    name: '京葉線',
    color: '#FF6347', // オレンジレッド
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'tokyo_keiyo', name: '東京駅', latitude: 35.6812, longitude: 139.7671, order: 1 },
      { id: 'hatchobori_keiyo', name: '八丁堀駅', latitude: 35.6750, longitude: 139.7772, order: 2 },
      { id: 'etoujima', name: '越中島駅', latitude: 35.6692, longitude: 139.7903, order: 3 },
      { id: 'shiohama', name: '潮見駅', latitude: 35.6606, longitude: 139.8164, order: 4 },
      { id: 'shin_kiba_keiyo', name: '新木場駅', latitude: 35.6369, longitude: 139.8378, order: 5 },
      { id: 'kasairinkaikoen', name: '葛西臨海公園駅', latitude: 35.6364, longitude: 139.8667, order: 6 },
      { id: 'maihama', name: '舞浜駅', latitude: 35.6322, longitude: 139.8800, order: 7 },
      { id: 'shin_urayasu', name: '新浦安駅', latitude: 35.6514, longitude: 139.9042, order: 8 },
      { id: 'ichikawa_shiohama', name: '市川塩浜駅', latitude: 35.6625, longitude: 139.9233, order: 9 },
      { id: 'minami_gyotoku_keiyo', name: '南船橋駅', latitude: 35.6697, longitude: 139.9142, order: 10 }, // 南行徳と重複？京葉線は南船橋
      { id: 'shin_narashino', name: '新習志野駅', latitude: 35.6728, longitude: 140.0083, order: 11 },
      { id: 'kaihin_makuhari', name: '海浜幕張駅', latitude: 35.6542, longitude: 140.0389, order: 12 },
      { id: 'kemigawahama', name: '検見川浜駅', latitude: 35.6358, longitude: 140.0617, order: 13 },
      { id: 'inage_kaigan', name: '稲毛海岸駅', latitude: 35.6319, longitude: 140.0822, order: 14 },
      { id: 'chiba_minato', name: '千葉みなと駅', latitude: 35.6133, longitude: 140.1008, order: 15 },
      { id: 'soga', name: '蘇我駅', latitude: 35.5869, longitude: 140.1175, order: 16 }
    ]
  },
  // JR常磐線（快速）
  {
    id: 'joban_rapid',
    name: '常磐線快速',
    color: '#006400', // ダークグリーン
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      { id: 'ueno_joban', name: '上野駅', latitude: 35.7138, longitude: 139.7773, order: 1 },
      { id: 'nippori_joban', name: '日暮里駅', latitude: 35.7278, longitude: 139.7710, order: 2 },
      { id: 'mikawashima', name: '三河島駅', latitude: 35.7358, longitude: 139.7828, order: 3 },
      { id: 'minami_senju_joban', name: '南千住駅', latitude: 35.7336, longitude: 139.8000, order: 4 },
      { id: 'kita_senju_joban', name: '北千住駅', latitude: 35.7495, longitude: 139.8052, order: 5 },
      { id: 'matsudo', name: '松戸駅', latitude: 35.7836, longitude: 139.9014, order: 6 },
      { id: 'kashiwa', name: '柏駅', latitude: 35.8647, longitude: 139.9719, order: 7 },
      { id: 'toride', name: '取手駅', latitude: 35.8978, longitude: 140.0711, order: 8 }
    ]
  },
  // JR常磐線（各駅停車）
  {
    id: 'joban_local',
    name: '常磐線各駅停車',
    color: '#00BFFF', // スカイブルー（千代田線直通のため）
    company: 'JR東日本',
    lineType: 'JR',
    stations: [
      // 東京メトロ千代田線直通運転のため、綾瀬から記述
      { id: 'ayase_joban_l', name: '綾瀬駅', latitude: 35.7661, longitude: 139.8292, order: 1 },
      { id: 'kita_ayase_joban_l', name: '北綾瀬駅', latitude: 35.7972, longitude: 139.8458, order: 2 },
      { id: 'kameari', name: '亀有駅', latitude: 35.7681, longitude: 139.8489, order: 3 },
      { id: 'kaneamachi', name: '金町駅', latitude: 35.7761, longitude: 139.8717, order: 4 },
      { id: 'matsudo_joban_l', name: '松戸駅', latitude: 35.7836, longitude: 139.9014, order: 5 },
      { id: 'kita_kogane', name: '北小金駅', latitude: 35.8111, longitude: 139.9369, order: 6 },
      { id: 'minami_kashiwa', name: '南柏駅', latitude: 35.8336, longitude: 139.9547, order: 7 },
      { id: 'kashiwa_joban_l', name: '柏駅', latitude: 35.8647, longitude: 139.9719, order: 8 },
      { id: 'kita_kashiwa', name: '北柏駅', latitude: 35.8828, longitude: 139.9886, order: 9 },
      { id: 'abiko', name: '我孫子駅', latitude: 35.8872, longitude: 140.0219, order: 10 }
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