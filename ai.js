// =====================================================================
//  AI種目提案（ルールベース）
//  LLMは使わず、入力（目的・レベル・部位・時間）から
//  今日のメニュー候補を組み立てる。サーバー／APIキー不要。
// =====================================================================


// =====================================================================
//  種目データベース
//  ↓↓↓ 種目を追加したいときは、該当する部位の配列に1行足すだけ ↓↓↓
//
//  各種目のプロパティ:
//    name       : 種目名
//    mets       : 消費カロリー計算用のMETs
//    level      : 目安レベル 1=初心者 / 2=中級者 / 3=上級者（並べ替え用）
//    equipment  : "自重" / "マシン" / "パワーラック" / "ダンベル" / "バーベル" / "ケーブル"
//    target     : 主に効く筋肉（理由文に使う）
//    type       : "コンパウンド"（多関節） / "アイソレーション"（単関節）
//    goal       : 向いている目的の配列 ["ダイエット","筋力向上","見た目改善","健康維持"]
//    famous     : 有名度 1〜5（初心者ほど重視）
//    difficulty : 難易度 1〜5（初心者は 2 以下を優先）
//
//  ※選定ルールは下の aiScore() を参照（目的×レベルでスコアづけ）
// =====================================================================
const aiExerciseDB = {

  // ----------------------------- 胸 -----------------------------
  胸: [
    // --- 初心者(level1) ---
    { name: "ベンチプレス", mets: 5, level: 1, equipment: "パワーラック", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 5, difficulty: 2 },
    { name: "スミスマシンベンチプレス", mets: 5, level: 1, equipment: "マシン", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "チェストプレス", mets: 5, level: 1, equipment: "マシン", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "インクラインチェストプレス", mets: 5, level: 1, equipment: "マシン", target: "大胸筋上部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "ペックフライ", mets: 4, level: 1, equipment: "マシン", target: "大胸筋(内側・中部)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "プッシュアップ", mets: 4, level: 1, equipment: "自重", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "ワイドプッシュアップ", mets: 4, level: 1, equipment: "自重", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "プレートロードチェストプレス", mets: 5, level: 1, equipment: "マシン", target: "大胸筋下部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "アイソラテラルチェストプレス", mets: 5, level: 1, equipment: "マシン", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    // --- 中級者(level2) ---
    { name: "インクラインベンチプレス", mets: 5, level: 2, equipment: "バーベル", target: "大胸筋上部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 4 },
    { name: "スミスマシンインクラインプレス", mets: 5, level: 2, equipment: "マシン", target: "大胸筋上部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ダンベルベンチプレス", mets: 5, level: 2, equipment: "ダンベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 3 },
    { name: "インクラインダンベルプレス", mets: 5, level: 2, equipment: "ダンベル", target: "大胸筋上部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ダンベルフライ", mets: 4, level: 2, equipment: "ダンベル", target: "大胸筋(内側・中部)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "インクラインダンベルフライ", mets: 4, level: 2, equipment: "ダンベル", target: "大胸筋上部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ケーブルフライ", mets: 4, level: 2, equipment: "ケーブル", target: "大胸筋(内側・中部)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルクロスオーバー", mets: 4, level: 2, equipment: "ケーブル", target: "大胸筋(内側・中部)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルプレス", mets: 4, level: 2, equipment: "ケーブル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "デクラインチェストプレス", mets: 5, level: 2, equipment: "マシン", target: "大胸筋下部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "デクラインプッシュアップ", mets: 4, level: 2, equipment: "自重", target: "大胸筋下部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ダイヤモンドプッシュアップ", mets: 4, level: 2, equipment: "自重", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "フロアプレス", mets: 5, level: 2, equipment: "バーベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "クローズグリップベンチプレス", mets: 5, level: 2, equipment: "バーベル", target: "大胸筋下部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 4 },
    { name: "ニュートラルグリップダンベルプレス", mets: 5, level: 2, equipment: "ダンベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ダンベルヘックスプレス", mets: 4, level: 2, equipment: "ダンベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ダンベルフロアプレス", mets: 4, level: 2, equipment: "ダンベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ケーブルスクイーズプレス", mets: 4, level: 2, equipment: "ケーブル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルチェストプレス", mets: 4, level: 2, equipment: "ケーブル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "スミスマシンデクラインプレス", mets: 5, level: 2, equipment: "マシン", target: "大胸筋下部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    // --- 上級者(level3) ---
    { name: "デクラインベンチプレス", mets: 5, level: 3, equipment: "バーベル", target: "大胸筋下部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "デクラインダンベルプレス", mets: 5, level: 3, equipment: "ダンベル", target: "大胸筋下部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ダンベルスクイーズプレス", mets: 4, level: 3, equipment: "ダンベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ダンベルプルオーバー", mets: 4, level: 3, equipment: "ダンベル", target: "大胸筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ローケーブルフライ", mets: 4, level: 3, equipment: "ケーブル", target: "大胸筋下部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ハイケーブルフライ", mets: 4, level: 3, equipment: "ケーブル", target: "大胸筋(内側・中部)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "シングルケーブルフライ", mets: 4, level: 3, equipment: "ケーブル", target: "大胸筋(内側・中部)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ディップス", mets: 6, level: 3, equipment: "自重", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "スポトプレス", mets: 5, level: 3, equipment: "バーベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ラーズンプレス", mets: 5, level: 3, equipment: "バーベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ピンベンチプレス", mets: 5, level: 3, equipment: "パワーラック", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "リバースグリップベンチプレス", mets: 5, level: 3, equipment: "バーベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ギロチンプレス", mets: 5, level: 3, equipment: "バーベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "シングルアームダンベルプレス", mets: 5, level: 3, equipment: "ダンベル", target: "大胸筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "シングルアームケーブルクロス", mets: 4, level: 3, equipment: "ケーブル", target: "大胸筋(内側・中部)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルインクラインフライ", mets: 4, level: 3, equipment: "ケーブル", target: "大胸筋上部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルデクラインフライ", mets: 4, level: 3, equipment: "ケーブル", target: "大胸筋下部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルプルオーバー（胸狙い）", mets: 4, level: 3, equipment: "ケーブル", target: "大胸筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 }
  ],

  // ----------------------------- 背中 -----------------------------
  背中: [
    // --- 初心者(level1) ---
    { name: "ラットプルダウン", mets: 5, level: 1, equipment: "マシン", target: "広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 5, difficulty: 1 },
    { name: "シーテッドロー", mets: 5, level: 1, equipment: "マシン", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "ローイングマシン", mets: 5, level: 1, equipment: "マシン", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "アシスト懸垂", mets: 5, level: 1, equipment: "マシン", target: "広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "デッドリフト", mets: 6, level: 1, equipment: "パワーラック", target: "脊柱起立筋・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 5, difficulty: 4 },
    { name: "アイソラテラルロー", mets: 5, level: 1, equipment: "マシン", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "ハイローローイング", mets: 5, level: 1, equipment: "マシン", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    // --- 中級者(level2) ---
    { name: "ワイドラットプルダウン", mets: 5, level: 2, equipment: "マシン", target: "広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "リバースグリップラットプルダウン", mets: 5, level: 2, equipment: "マシン", target: "広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "クローズグリップラットプルダウン", mets: 5, level: 2, equipment: "マシン", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "バーベルロー", mets: 5, level: 2, equipment: "バーベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 4 },
    { name: "Tバーロー", mets: 5, level: 2, equipment: "バーベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ワンハンドロー", mets: 5, level: 2, equipment: "ダンベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "ダンベルロー", mets: 5, level: 2, equipment: "ダンベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 3 },
    { name: "チェストサポートロー", mets: 5, level: 2, equipment: "ダンベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルロー", mets: 5, level: 2, equipment: "ケーブル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "ワンハンドケーブルロー", mets: 5, level: 2, equipment: "ケーブル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "フェイスプル", mets: 4, level: 2, equipment: "ケーブル", target: "三角筋後部・僧帽筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ストレートアームプルダウン", mets: 4, level: 2, equipment: "ケーブル", target: "広背筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "チンニング", mets: 6, level: 2, equipment: "自重", target: "広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "シールロー", mets: 5, level: 2, equipment: "バーベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "インクラインダンベルロー", mets: 5, level: 2, equipment: "ダンベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ダンベルプルオーバー（広背筋狙い）", mets: 4, level: 2, equipment: "ダンベル", target: "広背筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ハイロー", mets: 5, level: 2, equipment: "ケーブル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルローロー", mets: 5, level: 2, equipment: "ケーブル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "シングルアームラットプルダウン", mets: 5, level: 2, equipment: "ケーブル", target: "広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルリアデルトロー", mets: 4, level: 2, equipment: "ケーブル", target: "三角筋後部・僧帽筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ケーブルハイロー", mets: 5, level: 2, equipment: "ケーブル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "プレートロードロー", mets: 5, level: 2, equipment: "マシン", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    // --- 上級者(level3) ---
    { name: "ペンドレイロー", mets: 5, level: 3, equipment: "バーベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ケーブルプルオーバー", mets: 4, level: 3, equipment: "ケーブル", target: "広背筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ラックプル", mets: 6, level: 3, equipment: "パワーラック", target: "脊柱起立筋・広背筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "懸垂", mets: 6, level: 3, equipment: "自重", target: "広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 3 },
    { name: "イェーツロー", mets: 5, level: 3, equipment: "バーベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ミドウズロー", mets: 5, level: 3, equipment: "バーベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "スナッチグリップデッドリフト", mets: 6, level: 3, equipment: "バーベル", target: "脊柱起立筋・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "スナッチグリップロー", mets: 5, level: 3, equipment: "バーベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "リネゲードロー", mets: 5, level: 3, equipment: "ダンベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "Krocロー", mets: 5, level: 3, equipment: "ダンベル", target: "僧帽筋中部・広背筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルローププルオーバー", mets: 4, level: 3, equipment: "ケーブル", target: "広背筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 }
  ],

  // ----------------------------- 肩 -----------------------------
  肩: [
    // --- 初心者(level1) ---
    { name: "ショルダープレス", mets: 5, level: 1, equipment: "マシン", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 5, difficulty: 1 },
    { name: "スミスマシンショルダープレス", mets: 5, level: 1, equipment: "マシン", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "サイドレイズ", mets: 4, level: 1, equipment: "ダンベル", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "マシンサイドレイズ", mets: 4, level: 1, equipment: "マシン", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "リアデルトマシン", mets: 4, level: 1, equipment: "マシン", target: "三角筋後部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "シュラッグ", mets: 4, level: 1, equipment: "ダンベル", target: "僧帽筋上部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    // --- 中級者(level2) ---
    { name: "ダンベルショルダープレス", mets: 5, level: 2, equipment: "ダンベル", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 3 },
    { name: "アーノルドプレス", mets: 5, level: 2, equipment: "ダンベル", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ダンベルサイドレイズ", mets: 4, level: 2, equipment: "ダンベル", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "ケーブルサイドレイズ", mets: 4, level: 2, equipment: "ケーブル", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "フロントレイズ", mets: 4, level: 2, equipment: "ダンベル", target: "三角筋前部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ダンベルフロントレイズ", mets: 4, level: 2, equipment: "ダンベル", target: "三角筋前部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "プレートフロントレイズ", mets: 4, level: 2, equipment: "その他", target: "三角筋前部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "リアレイズ", mets: 4, level: 2, equipment: "ダンベル", target: "三角筋後部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ベントオーバーリアレイズ", mets: 4, level: 2, equipment: "ダンベル", target: "三角筋後部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "アップライトロー", mets: 4, level: 2, equipment: "バーベル", target: "三角筋中部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ダンベルシュラッグ", mets: 4, level: 2, equipment: "ダンベル", target: "僧帽筋上部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "シーテッドダンベルプレス", mets: 5, level: 2, equipment: "ダンベル", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "パーシャルサイドレイズ", mets: 4, level: 2, equipment: "ダンベル", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "シングルケーブルサイドレイズ", mets: 4, level: 2, equipment: "ケーブル", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルリアデルトフライ", mets: 4, level: 2, equipment: "ケーブル", target: "三角筋後部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルフェイスプル", mets: 4, level: 2, equipment: "ケーブル", target: "三角筋後部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルシュラッグ", mets: 4, level: 2, equipment: "ケーブル", target: "僧帽筋上部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "バーベルショルダープレス", mets: 5, level: 2, equipment: "バーベル", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 4 },
    { name: "ダンベルアップライトロー", mets: 4, level: 2, equipment: "ダンベル", target: "三角筋中部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    // --- 上級者(level3) ---
    { name: "インクラインサイドレイズ", mets: 4, level: 3, equipment: "ダンベル", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルフロントレイズ", mets: 4, level: 3, equipment: "ケーブル", target: "三角筋前部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルリアレイズ", mets: 4, level: 3, equipment: "ケーブル", target: "三角筋後部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルアップライトロー", mets: 4, level: 3, equipment: "ケーブル", target: "三角筋中部", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "Zプレス", mets: 5, level: 3, equipment: "ダンベル", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "リーンアウェイサイドレイズ", mets: 4, level: 3, equipment: "ダンベル", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "スコットサイドレイズ", mets: 4, level: 3, equipment: "ダンベル", target: "三角筋中部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルYレイズ", mets: 4, level: 3, equipment: "ケーブル", target: "三角筋前部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルLレイズ", mets: 4, level: 3, equipment: "ケーブル", target: "三角筋後部", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "プッシュプレス", mets: 5, level: 3, equipment: "バーベル", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ハイプル", mets: 5, level: 3, equipment: "バーベル", target: "三角筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 }
  ],

  // ----------------------------- 腕 -----------------------------
  腕: [
    // --- 初心者(level1) ---
    { name: "ダンベルカール", mets: 4, level: 1, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "ハンマーカール", mets: 4, level: 1, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "ケーブルプレスダウン", mets: 4, level: 1, equipment: "ケーブル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "ディップスマシン", mets: 4, level: 1, equipment: "マシン", target: "上腕三頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "マシンカール", mets: 4, level: 1, equipment: "マシン", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "ベンチディップス", mets: 4, level: 1, equipment: "自重", target: "上腕三頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    // --- 中級者(level2) ---
    { name: "オルタネイトカール", mets: 4, level: 2, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "インクラインダンベルカール", mets: 4, level: 2, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "コンセントレーションカール", mets: 4, level: 2, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "バーベルカール", mets: 4, level: 2, equipment: "バーベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "EZバーカール", mets: 4, level: 2, equipment: "バーベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "リバースカール", mets: 4, level: 2, equipment: "バーベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "プリーチャーカール", mets: 4, level: 2, equipment: "マシン", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルカール", mets: 4, level: 2, equipment: "ケーブル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "フレンチプレス", mets: 4, level: 2, equipment: "ダンベル", target: "上腕三頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ライイングトライセプスエクステンション", mets: 4, level: 2, equipment: "ダンベル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "キックバック", mets: 4, level: 2, equipment: "ダンベル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ローププレスダウン", mets: 4, level: 2, equipment: "ケーブル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "オーバーヘッドケーブルエクステンション", mets: 4, level: 2, equipment: "ケーブル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "スパイダーカール", mets: 4, level: 2, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ゾットマンカール", mets: 4, level: 2, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "シーテッドダンベルカール", mets: 4, level: 2, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ドラッグカール", mets: 4, level: 2, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ハイケーブルカール", mets: 4, level: 2, equipment: "ケーブル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ダブルバイセップスカール", mets: 4, level: 2, equipment: "ケーブル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "シーテッドフレンチプレス", mets: 4, level: 2, equipment: "ダンベル", target: "上腕三頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "シングルアームプレスダウン", mets: 4, level: 2, equipment: "ケーブル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルキックバック（三頭）", mets: 4, level: 2, equipment: "ケーブル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ロープオーバーヘッドエクステンション", mets: 4, level: 2, equipment: "ケーブル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ナロープッシュアップ", mets: 4, level: 2, equipment: "自重", target: "上腕三頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "シーテッドインクラインカール", mets: 4, level: 2, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    // --- 上級者(level3) ---
    { name: "クロスボディハンマーカール", mets: 4, level: 3, equipment: "ダンベル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ロープハンマーカール", mets: 4, level: 3, equipment: "ケーブル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルプリーチャーカール", mets: 4, level: 3, equipment: "ケーブル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "シングルケーブルカール", mets: 4, level: 3, equipment: "ケーブル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "リバースプレスダウン", mets: 4, level: 3, equipment: "ケーブル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ベイジアンカール", mets: 4, level: 3, equipment: "ケーブル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ケーブルドラッグカール", mets: 4, level: 3, equipment: "ケーブル", target: "上腕二頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "JMプレス", mets: 4, level: 3, equipment: "バーベル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ダンベルJMプレス", mets: 4, level: 3, equipment: "ダンベル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "クロスボディプレスダウン", mets: 4, level: 3, equipment: "ケーブル", target: "上腕三頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 }
  ],

  // ----------------------------- 脚 -----------------------------
  脚: [
    // --- 初心者(level1) ---
    { name: "スクワット", mets: 6, level: 1, equipment: "パワーラック", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 5, difficulty: 2 },
    { name: "スミススクワット", mets: 6, level: 1, equipment: "マシン", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "レッグプレス", mets: 5, level: 1, equipment: "マシン", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "レッグエクステンション", mets: 4, level: 1, equipment: "マシン", target: "大腿四頭筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "レッグカール", mets: 4, level: 1, equipment: "マシン", target: "ハムストリングス", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "シーテッドレッグカール", mets: 4, level: 1, equipment: "マシン", target: "ハムストリングス", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "ライイングレッグカール", mets: 4, level: 1, equipment: "マシン", target: "ハムストリングス", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "グルートブリッジ", mets: 4, level: 1, equipment: "自重", target: "大臀筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "カーフレイズ", mets: 3, level: 1, equipment: "自重", target: "下腿三頭筋(ふくらはぎ)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "シーテッドカーフレイズ", mets: 3, level: 1, equipment: "マシン", target: "下腿三頭筋(ふくらはぎ)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "ダンベルスクワット", mets: 6, level: 1, equipment: "ダンベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    // --- 中級者(level2) ---
    { name: "ゴブレットスクワット", mets: 6, level: 2, equipment: "ダンベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ボックススクワット", mets: 6, level: 2, equipment: "パワーラック", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ダンベルランジ", mets: 5, level: 2, equipment: "ダンベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "ウォーキングランジ", mets: 5, level: 2, equipment: "ダンベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ブルガリアンスクワット", mets: 6, level: 2, equipment: "ダンベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 3 },
    { name: "ステップアップ", mets: 5, level: 2, equipment: "ダンベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ハックスクワット", mets: 6, level: 2, equipment: "マシン", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ヒップスラスト", mets: 5, level: 2, equipment: "バーベル", target: "大臀筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 2 },
    { name: "レッグプレスカーフレイズ", mets: 3, level: 2, equipment: "マシン", target: "下腿三頭筋(ふくらはぎ)", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "サイドランジ", mets: 5, level: 2, equipment: "ダンベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "カーテシーランジ", mets: 5, level: 2, equipment: "ダンベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ダンベルRDL", mets: 6, level: 2, equipment: "ダンベル", target: "ハムストリングス・臀筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "ペンデュラムスクワット", mets: 6, level: 2, equipment: "マシン", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ベルトスクワット", mets: 6, level: 2, equipment: "マシン", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "グルートドライブ", mets: 4, level: 2, equipment: "マシン", target: "大臀筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルスクワット", mets: 5, level: 2, equipment: "ケーブル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルアブダクション", mets: 3, level: 2, equipment: "ケーブル", target: "中臀筋・外転筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルアダクション", mets: 3, level: 2, equipment: "ケーブル", target: "内転筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルプルスルー", mets: 4, level: 2, equipment: "ケーブル", target: "大臀筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    // --- 上級者(level3) ---
    { name: "フロントスクワット", mets: 6, level: 3, equipment: "バーベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ルーマニアンデッドリフト", mets: 6, level: 3, equipment: "バーベル", target: "ハムストリングス・臀筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 5 },
    { name: "スティッフレッグデッドリフト", mets: 6, level: 3, equipment: "バーベル", target: "ハムストリングス・臀筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "グッドモーニング", mets: 5, level: 3, equipment: "バーベル", target: "ハムストリングス・臀筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ケーブルキックバック", mets: 4, level: 3, equipment: "ケーブル", target: "大臀筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ゼーチャースクワット", mets: 6, level: 3, equipment: "バーベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "サイクリストスクワット", mets: 6, level: 3, equipment: "バーベル", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 5 },
    { name: "ポーズスクワット", mets: 6, level: 3, equipment: "パワーラック", target: "大腿四頭筋", type: "コンパウンド", goal: ["筋力向上","ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 }
  ],

  // ----------------------------- 腹筋 -----------------------------
  腹筋: [
    // --- 初心者(level1) ---
    { name: "クランチ", mets: 4, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "リバースクランチ", mets: 4, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "シットアップ", mets: 4, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "レッグレイズ", mets: 4, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "ニーレイズ", mets: 4, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "プランク", mets: 3, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 1 },
    { name: "デッドバグ", mets: 3, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "ヒールタッチ", mets: 4, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "リーチクランチ", mets: 4, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "スタンディングニーアップ", mets: 4, level: 1, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "アブドミナルマシン", mets: 4, level: 1, equipment: "マシン", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    { name: "ロータリートルソー", mets: 4, level: 1, equipment: "マシン", target: "腹斜筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 1 },
    // --- 中級者(level2) ---
    { name: "ケーブルクランチ", mets: 4, level: 2, equipment: "ケーブル", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "サイドプランク", mets: 3, level: 2, equipment: "自重", target: "腹斜筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "マウンテンクライマー", mets: 4, level: 2, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "バイシクルクランチ", mets: 5, level: 2, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "Vシット", mets: 5, level: 2, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ホローホールド", mets: 3, level: 2, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ジャックナイフ", mets: 4, level: 2, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルサイドベント", mets: 4, level: 2, equipment: "ケーブル", target: "腹斜筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルニーアップ", mets: 4, level: 2, equipment: "ケーブル", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    { name: "ケーブルオブリーククランチ", mets: 4, level: 2, equipment: "ケーブル", target: "腹斜筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 2 },
    // --- 上級者(level3) ---
    { name: "ケーブルツイスト", mets: 4, level: 3, equipment: "ケーブル", target: "腹斜筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ウッドチョッパー", mets: 4, level: 3, equipment: "ケーブル", target: "腹斜筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 4 },
    { name: "ドラゴンフラッグ", mets: 6, level: 3, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "アブローラー", mets: 5, level: 3, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 4, difficulty: 3 },
    { name: "ハンギングレッグレイズ", mets: 5, level: 3, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 },
    { name: "トゥ・トゥ・バー", mets: 6, level: 3, equipment: "自重", target: "腹直筋", type: "アイソレーション", goal: ["ダイエット","見た目改善","健康維持"], famous: 2, difficulty: 3 }
  ]

};
// =====================================================================
//  種目数は record.html のラジオ（aiCount: 2〜6）で選ぶ
// =====================================================================

const aiLevelRank = { 初心者: 1, 中級者: 2, 上級者: 3 };


// =====================================================================
//  目的ごとの回数・セット・レスト方針
//  （回数やセットを変えたいときはここを編集）
// =====================================================================
const aiScheme = {
  ダイエット: { reps: 15, sets: 3, rest: "30〜45秒（短め）" },
  見た目改善: { reps: 12, sets: 3, rest: "60秒前後" },
  筋力向上:   { reps: 6,  sets: 4, rest: "2〜3分（長め）" },
  健康維持:   { reps: 12, sets: 2, rest: "60秒前後" }
};


// =====================================================================
//  (1)進歩的過負荷 & (2)回復の設定
// =====================================================================
const aiWeightStep = 2.5;   // 前回より何kg増やして提案するか（最小プレートに合わせて2.5kg）
const aiRestDays   = 2;     // この日数以内に鍛えた部位は「回復中」として後回しにする


// --- (2)回復管理：鍛えた部位の最終トレ日を記録する ---
//  partLog = { "胸": "2026-06-15", "脚": "2026-06-14", ... }
function aiLogParts(parts) {
  const log = JSON.parse(localStorage.getItem("partLog")) || {};
  const today = new Date().toISOString().split("T")[0];
  [...new Set(parts)].forEach(p => { log[p] = today; });
  localStorage.setItem("partLog", JSON.stringify(log));
}

// --- (2)回復管理：直近 aiRestDays 日以内に鍛えた部位の集合を返す ---
function aiRecentParts() {
  const log = JSON.parse(localStorage.getItem("partLog")) || {};
  const recent = new Set();
  const now = new Date();
  Object.keys(log).forEach(p => {
    const diffDays = (now - new Date(log[p])) / (1000 * 60 * 60 * 24);
    if (diffDays < aiRestDays) recent.add(p);
  });
  return recent;
}


// =====================================================================
//  部位の優先順（おまかせ・部位未選択のときの並び）
//  ※見た目改善のときは「脚」を最優先にする
// =====================================================================
function aiBalancedOrder(purpose) {
  if (purpose === "見た目改善") {
    return ["脚", "胸", "背中", "肩", "腕", "腹筋"]; // 見た目改善 → 脚を優先
  }
  return ["胸", "背中", "脚", "肩", "腹筋", "腕"];
}


// =====================================================================
//  種目スコア（目的 × レベルで重み付け）
//   - 初心者は difficulty<=2 を優先、有名種目・扱いやすい器具を加点
//   - 筋力向上はコンパウンド優先 / 見た目改善はアイソレーションも歓迎
//   - 目的(goal)に合う種目を加点
// =====================================================================
function aiScore(ex, levelRank, purpose, preferType) {
  let s = 0;

  // --- レベル適合（difficulty基準：レベルごとに“狙う難易度帯”を変える） ---
  //   初心者: 易しい種目ほど高評価／難しい種目は減点
  //   中級  : difficulty 2〜3を中心に
  //   上級  : 難しい種目ほど高評価／易しすぎる種目は減点
  const diff = ex.difficulty || 3;
  if (levelRank === 1) {
    if (diff <= 2) s += 4;
    else s -= (diff - 2) * 3;                 // 難しすぎは強めに減点
  } else if (levelRank === 2) {
    if (diff === 2 || diff === 3) s += 4;     // 中級の中心帯
    else if (diff === 1) s += 1;              // 易しすぎは弱め
    else s -= (diff - 3) * 2;                 // 4〜5はやや減点
  } else {
    if (diff >= 3) s += 4;                    // 上級は難しい種目を優先
    else s -= (3 - diff) * 2;                 // 易しすぎ（1〜2）は減点
  }

  // --- 目的(goal)への適合 ---
  if (Array.isArray(ex.goal) && ex.goal.includes(purpose)) s += 3;

  // --- 目的別の種目タイプ優先 ---
  if (purpose === "筋力向上") {
    if (ex.type === "コンパウンド") s += 3;       // 力を伸ばすなら多関節種目
    else s -= 1;
  } else if (purpose === "見た目改善") {
    s += 1;                                        // コンパウンドもアイソレーションも歓迎（混ぜる）
  } else if (purpose === "ダイエット") {
    if (ex.type === "コンパウンド") s += 1;       // 消費が大きい
  }

  // --- 有名度（初心者ほど重視） ---
  const fame = ex.famous || 0;
  s += levelRank === 1 ? fame : fame * 0.3;

  // --- 初心者は扱いやすい器具を優先 ---
  if (levelRank === 1) {
    if (ex.equipment === "マシン" || ex.equipment === "パワーラック") s += 2;
    else if (ex.equipment === "自重") s += 1;
    else if (ex.equipment === "ダンベル" || ex.equipment === "バーベル") s -= 1;
  }

  // --- タイプの混在用ヒント（見た目改善でコンパウンド/アイソレーションを交互に） ---
  if (preferType && ex.type === preferType) s += 4;

  return s;
}

// --- 入力ヘルパー ---
function aiGetRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}
function aiGetChecked(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
}


// --- 部位の割り当て（種目数ぶんラウンドロビン） ---
//  recentParts に入っている部位（直近で鍛えた部位）は後回しにする
function aiPickParts(selectedParts, omakase, count, purpose, recentParts) {
  let parts;
  if (omakase || selectedParts.length === 0) {
    const order = aiBalancedOrder(purpose);            // おまかせ → 優先順で全身バランス
    const fresh = order.filter(p => !recentParts.has(p));  // 回復している部位
    const tired = order.filter(p => recentParts.has(p));   // 直近で鍛えた部位
    parts = [...fresh, ...tired];                      // 回復している部位を先に並べる
  } else {
    parts = selectedParts.slice();                     // 部位を選んでいれば、その中で配分
  }

  const result = [];
  let i = 0;
  while (result.length < count) {
    result.push(parts[i % parts.length]);
    i++;
  }
  return result;
}


// --- 自作種目（記録ページで部位を付けたもの）をAI候補に変換 ---
//  exercises は script.js のグローバル変数。記録ページでは ai.js より先に読まれている
function aiCustomForPart(part) {
  if (typeof exercises === "undefined") return [];
  return exercises
    .filter(e => e.part === part)
    .map(e => ({
      name: e.name,
      mets: e.mets,
      level: 2,                 // 自作種目は中級扱い
      equipment: "その他",
      target: part,
      type: "アイソレーション",
      goal: ["見た目改善", "健康維持", "ダイエット"],
      famous: 2,
      difficulty: 3
    }));
}

// --- 1つの部位から、スコアの高い未使用種目を選ぶ ---
function aiPickExercise(part, levelRank, used, purpose, preferType) {

  const builtin = aiExerciseDB[part] || [];

  // 自作種目を追加（名前が重複する場合は組み込み種目を優先）
  const custom = aiCustomForPart(part)
    .filter(c => !builtin.some(b => b.name === c.name));

  const pool = [...builtin, ...custom];

  const candidates = pool
    .filter(e => !used.has(e.name))
    .map(e => ({ e, score: aiScore(e, levelRank, purpose, preferType) }))
    .sort((a, b) => b.score - a.score);   // スコア降順（同点はDBの並び順）

  if (candidates.length === 0) {
    return pool[0] || builtin[0];         // 出し切ったら先頭で妥協
  }

  // 最高スコアに近い「良い候補」の中からランダムに選ぶ。
  //  → 押すたび／条件を変えるたびに種目が変わる（＝マンネリ防止）
  //    それでも上位だけから選ぶので、レベルや目的には合ったまま。
  const topScore = candidates[0].score;
  let near = candidates.filter(c => c.score >= topScore - 3);  // 最高から3点以内
  if (near.length < 3) near = candidates.slice(0, Math.min(3, candidates.length));
  const chosen = near[Math.floor(Math.random() * near.length)];
  return chosen.e;
}


// --- メニュー生成 ---
function generateAIMenu() {
  const purpose = aiGetRadio("aiPurpose") || "見た目改善";
  const level   = aiGetRadio("aiLevel")   || "初心者";
  const minutes = parseInt(aiGetRadio("aiTime") || "30");
  const omakase = document.getElementById("aiOmakase").checked;
  const selectedParts = aiGetChecked("aiPart");

  const scheme    = aiScheme[purpose];
  const levelRank = aiLevelRank[level];
  const count     = parseInt(aiGetRadio("aiCount") || "4");   // ← 選んだ種目数（2〜6）

  // 所要時間と種目数から、1種目あたりのセット数を決める。
  //  1セット ≒ 2.5分 とみなし、選んだ時間に収まる範囲でセット数を出す。
  //  → 時間を長くするほどセット数が増える（時間の変更が結果に反映される）
  let sets = Math.floor(minutes / (count * 2.5));
  if (level === "上級者") sets += 1;   // 上級はやや多め
  if (sets < 2) sets = 2;              // 最低2セット
  if (sets > 5) sets = 5;              // 多すぎない上限

  // 最低2セットでも時間が足りない場合はひとこと添える
  const tooLong = (count * 2 * 2.5 > minutes);

  // 種目を選ぶ（(2)直近で鍛えた部位は後回し）
  const recentParts = aiRecentParts();
  const parts = aiPickParts(selectedParts, omakase, count, purpose, recentParts);
  const used = new Set();
  const items = [];
  let nCompSoFar = 0, nIsoSoFar = 0;

  parts.forEach(part => {
    // 見た目改善では、コンパウンドとアイソレーションを交互に混ぜる
    let preferType = null;
    if (purpose === "見た目改善") {
      preferType = (nCompSoFar <= nIsoSoFar) ? "コンパウンド" : "アイソレーション";
    }

    const ex = aiPickExercise(part, levelRank, used, purpose, preferType);
    used.add(ex.name);
    if (ex.type === "コンパウンド") nCompSoFar++; else nIsoSoFar++;

    // (1)進歩的過負荷：前回の重量があれば +aiWeightStep kg を提案
    const last = parseFloat(localStorage.getItem(`lastWeight_${ex.name}`));
    let weight = null, lastWeight = null;
    if (!isNaN(last) && last > 0) {
      lastWeight = last;
      weight = last + aiWeightStep;
    }

    items.push({
      name: ex.name, mets: ex.mets, part,
      target: ex.target, type: ex.type,
      reps: scheme.reps, sets,
      weight, lastWeight
    });
  });

  // --- おすすめ理由（属性を使ってAIらしく説明） ---
  const usedParts = [...new Set(items.map(it => it.part))];
  const partText = (omakase || selectedParts.length === 0)
    ? "全身をバランスよく"
    : `${usedParts.join("・")}を中心に`;

  // 鍛える主な筋肉（重複を除いて最大4つ）
  const targets = [...new Set(items.map(it => it.target).filter(Boolean))].slice(0, 4);

  // コンパウンド／アイソレーションの内訳
  const nComp = items.filter(it => it.type === "コンパウンド").length;
  const nIso  = items.length - nComp;
  let typeText;
  if (purpose === "筋力向上") {
    typeText = "力を伸ばしやすいコンパウンド（多関節）種目を中心に";
  } else if (purpose === "見た目改善") {
    typeText = "コンパウンドで土台を作りつつ、アイソレーションで仕上げる構成で";
  } else if (purpose === "ダイエット") {
    typeText = "消費の大きいコンパウンドを軸に、テンポよく回せる構成で";
  } else {
    typeText = "無理なく続けやすい構成で";
  }

  // 想定時間
  const estMin = Math.round(count * sets * 2.5);

  let reason =
    `${purpose}が目的で${partText}${(omakase||selectedParts.length===0)?"":""}選んだため、` +
    `${typeText}、${targets.join("・")}を効率よく鍛えられる${count}種目にしました。` +
    `コンパウンド${nComp}・アイソレーション${nIso}種目、レストは${scheme.rest}が目安で、所要時間は約${estMin}分です。`;

  if (level === "初心者") {
    reason += " 初心者向けに、難易度が低く扱いやすい有名種目を優先しています。";
  }
  // (2)回復：おまかせ時に、直近で鍛えた部位を避けたら一言添える
  if ((omakase || selectedParts.length === 0) && recentParts.size > 0) {
    reason += ` 直近${aiRestDays}日で鍛えた部位（${[...recentParts].join("・")}）は休ませ、回復した部位を優先しました。`;
  }
  // (1)過負荷：前回より重量を上げた種目があれば一言添える
  if (items.some(it => it.weight != null)) {
    reason += ` 前回記録のある種目は、重量を +${aiWeightStep}kg にして提案しています。`;
  }
  if (tooLong) {
    reason += " ※種目数の割に時間が短めなので、入りきらない場合はチェックを外して調整してください。";
  }

  window.lastAIMenu = items;   // 保存用に保持
  renderAIResult(purpose, level, omakase, minutes, items, reason);
}


// --- 結果を画面に表示（チェックボックス付き） ---
function renderAIResult(purpose, level, omakase, minutes, items, reason) {
  const box = document.getElementById("aiResult");
  if (!box) return;

  const tags = [purpose, level];
  if (omakase) tags.push("AIにおまかせ");
  tags.push(`${minutes}分`);
  const tagHtml = tags.map(t => `<span class="ai-tag">${t}</span>`).join("");

  // チェックボックス付きの行（初期は全部チェックON）＋ 重さ入力
  const rowsHtml = items.map((it, i) => {
    const hint = (it.weight != null)
      ? `<span class="ai-ex-hint">前回 ${it.lastWeight}kg → おすすめ ${it.weight}kg</span>`
      : `<span class="ai-ex-hint">重さを入力してください</span>`;
    // 入力の初期値：おすすめ重量 → 前回重量 → 空
    const prefill = (it.weight != null) ? it.weight
                  : (it.lastWeight != null ? it.lastWeight : "");
    return `
    <div class="ai-pick-item">
      <label class="ai-pick-row">
        <span class="ai-pick-left">
          <input type="checkbox" class="ai-pick" data-index="${i}" checked>
          <span>
            <span class="ai-ex-name">${it.name}</span>
            ${hint}
          </span>
        </span>
        <span class="ai-ex-set">${it.reps}回 × ${it.sets}セット</span>
      </label>
      <div class="ai-weight-row">
        <span class="ai-weight-label">重さ</span>
        <button type="button" class="ai-step" onclick="aiStepWeight(${i}, -${aiWeightStep})">−</button>
        <input type="number" class="ai-weight" data-index="${i}" value="${prefill}"
          inputmode="decimal" step="${aiWeightStep}" placeholder="0">
        <span class="ai-weight-unit">kg</span>
        <button type="button" class="ai-step" onclick="aiStepWeight(${i}, ${aiWeightStep})">＋</button>
      </div>
    </div>
  `;
  }).join("");

  box.innerHTML = `
    <div class="ai-section-title">入力内容</div>
    <div class="ai-tags">${tagHtml}</div>

    <div class="ai-divider"></div>

    <div class="ai-section-title">AI提案（チェックした種目が今日のメニューに保存されます）</div>

    <div class="ai-check-controls">
      <button class="ai-mini" onclick="aiCheckAll(true)">全てにチェック</button>
      <button class="ai-mini" onclick="aiCheckAll(false)">全てチェックを外す</button>
    </div>

    ${rowsHtml}

    <div class="ai-reason">
      <div class="ai-reason-title">ⓘ 理由</div>
      <div>${reason}</div>
    </div>

    <button onclick="addAIMenuToRecord()">今日はこのメニューにする！</button>
    <div id="aiAddMsg" class="ai-add-msg"></div>
  `;
}


// --- 全てにチェック / 全て外す ---
function aiCheckAll(value) {
  document.querySelectorAll(".ai-pick").forEach(c => { c.checked = value; });
}


// --- 提案行の重さを −/＋ で調整 ---
function aiStepWeight(index, delta) {
  const input = document.querySelector(`.ai-weight[data-index="${index}"]`);
  if (!input) return;
  let v = parseFloat(input.value);
  if (isNaN(v)) v = 0;
  v = Math.max(0, Math.round((v + delta) * 10) / 10);
  input.value = v;
}


// --- チェックした種目を「今日のメニュー」に保存（既存の記録機能と連携） ---
function addAIMenuToRecord() {
  if (!window.lastAIMenu) return;

  // チェックの入っている種目だけ集める（入力した重さも取得）
  const selected = [];
  document.querySelectorAll(".ai-pick").forEach(c => {
    if (!c.checked) return;
    const idx = Number(c.dataset.index);
    const it = window.lastAIMenu[idx];

    // 入力欄の重さを優先。空ならおすすめ→前回→0
    const winput = document.querySelector(`.ai-weight[data-index="${idx}"]`);
    let w = winput ? parseFloat(winput.value) : NaN;
    if (isNaN(w)) {
      w = it.weight;
      if (w == null) w = parseFloat(localStorage.getItem(`lastWeight_${it.name}`)) || 0;
    }
    selected.push({ it, w });
  });

  const msg = document.getElementById("aiAddMsg");

  if (selected.length === 0) {
    if (msg) msg.innerText = "1つ以上チェックを入れてください。";
    return;
  }

  // todayMenu は script.js で定義されているグローバル変数
  selected.forEach(({ it, w }) => {
    // セット数ぶん記録に積む（既存の記録は1行=1セットの扱いに合わせる）
    for (let i = 0; i < it.sets; i++) {
      todayMenu.push({ name: it.name, mets: it.mets, reps: it.reps, weight: w });
    }

    // 次回の「前回重量」として保存
    localStorage.setItem(`lastWeight_${it.name}`, w);
    localStorage.setItem(`lastReps_${it.name}`, it.reps);

    // 種目別の重量推移グラフ用に履歴を残す
    if (typeof logExerciseHistory === "function") {
      logExerciseHistory(it.name, w, it.reps);
    }
  });

  localStorage.setItem("todayMenu", JSON.stringify(todayMenu));

  // (2)回復管理：今回鍛えた部位を記録（次回の提案で休ませる判断に使う）
  aiLogParts(selected.map(s => s.it.part));

  // 同じページの「今日のメニュー」一覧をその場で更新（script.js の関数）
  if (typeof renderMenu === "function") renderMenu();

  // XP獲得（保存したセット数ぶん）
  let xpMsg = "";
  if (typeof addXP === "function") {
    const totalSets = selected.reduce((s, x) => s + x.it.sets, 0);
    const gained = totalSets * (typeof XP_PER_SET !== "undefined" ? XP_PER_SET : 10);
    const leveledUp = addXP(gained);
    xpMsg = `（+${gained} XP）` + (leveledUp ? ` レベルアップ Lv.${leveledUp}！` : "");
  }

  if (msg) {
    msg.innerText =
      `${selected.length}種目を今日のメニューに追加しました！${xpMsg}`;
  }
}
