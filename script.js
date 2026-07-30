// ===== PWA: Service Worker 登録 =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

// ===== メニュー =====
function toggleMenu() {

  const menu =
    document.getElementById("menu");

  if (menu.style.display === "block") {

    menu.style.display = "none";

  } else {

    menu.style.display = "block";
  }
}

// ===== 状態 =====
let totalSets = 0;
let doneSets = 0;

let timerInterval;
let alarmInterval;
let chart;

let isResting = false;
let wakeLock = null;

// ===== タイマー（セット間レスト／種目間レスト） =====

// セット完了 → セット間レストを開始
function startSetRest() {

  if (isResting) return;

  totalSets = parseInt(
    document.getElementById("totalSets").value
  ) || 0;

  const sec = parseInt(
    document.getElementById("setRest").value
  ) || 0;

  doneSets++;
  updateSetDisplay();

  startTimer(sec, () => {

    finishBeep();

    if (totalSets > 0 && doneSets >= totalSets) {
      document.getElementById("timer").innerText =
        "全セット終了！（種目完了で次へ）";
    } else {
      document.getElementById("timer").innerText =
        "次のセット開始！";
    }
  });
}

// 種目完了 → 種目間レストを開始（セット数はリセット）
function startExerciseRest() {

  if (isResting) return;

  const sec = parseInt(
    document.getElementById("exerciseRest").value
  ) || 0;

  doneSets = 0;
  updateSetDisplay();

  startTimer(sec, () => {
    finishBeep();
    document.getElementById("timer").innerText =
      "次の種目開始！";
  });
}

function updateSetDisplay() {

  const display =
    document.getElementById("setDisplay");

  if (!display) return;

  display.innerText =
    `${doneSets} / ${totalSets} セット完了`;
}

// ===== タイマー：種目ごとのレスト時間 =====
// 種目を選ぶと、その種目に保存したレスト時間を呼び出す。
// レストを変えると、その種目に保存される（次回同じ種目で呼び出される）。

// タイマーページの種目セレクトを、今日のメニューの種目で用意
function initTimerExercisePicker() {
  const select = document.getElementById("timerExercise");
  if (!select) return;

  const menu = JSON.parse(localStorage.getItem("todayMenu")) || [];
  const names = [...new Set(menu.map(it => it.name))];

  select.innerHTML = "";

  const first = document.createElement("option");
  first.value = "";
  first.textContent = names.length ? "指定なし（共通で使う）" : "今日のメニューが空です";
  select.appendChild(first);

  names.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    select.appendChild(opt);
  });

  onTimerExerciseChange();  // 初期表示のレストを反映
}

// 種目が変わったら、その種目に保存されたレスト時間を読み込む
function onTimerExerciseChange() {
  const select = document.getElementById("timerExercise");
  if (!select) return;
  const name = select.value;

  const setEl = document.getElementById("setRest");
  const exEl  = document.getElementById("exerciseRest");
  const note  = document.getElementById("timerExerciseNote");

  if (!name) {
    if (note) note.textContent = "種目を選ぶと、その種目に保存したレスト時間が呼び出されます。";
    return;
  }

  // 保存済みがあれば呼び出す。なければ初期値（60/120）に戻す。
  const savedSet = localStorage.getItem(`timerSetRest_${name}`);
  const savedEx  = localStorage.getItem(`timerExRest_${name}`);
  if (setEl) setEl.value = (savedSet !== null) ? savedSet : "60";
  if (exEl)  exEl.value  = (savedEx  !== null) ? savedEx  : "120";

  if (note) {
    note.textContent = (savedSet !== null || savedEx !== null)
      ? `「${name}」に保存したレスト時間を呼び出しました。`
      : `「${name}」のレスト時間を設定できます（変更すると保存されます）。`;
  }
}

// レスト時間を、選択中の種目に保存する
function saveTimerRest() {
  const select = document.getElementById("timerExercise");
  if (!select) return;
  const name = select.value;
  if (!name) return;   // 「指定なし」のときは保存しない

  const setEl = document.getElementById("setRest");
  const exEl  = document.getElementById("exerciseRest");
  if (setEl) localStorage.setItem(`timerSetRest_${name}`, setEl.value);
  if (exEl)  localStorage.setItem(`timerExRest_${name}`,  exEl.value);

  const note = document.getElementById("timerExerciseNote");
  if (note) note.textContent = `「${name}」のレスト時間を保存しました。`;
}

function startTimer(seconds, callback) {

  // レスト0秒ならすぐ完了扱い
  if (!seconds || seconds <= 0) {
    callback();
    return;
  }

  isResting = true;
  requestWakeLock();          // レスト中は画面を消さない
  setTimerButtons(true);

  let time = seconds;
  document.getElementById("timer").innerText = time;

  timerInterval = setInterval(() => {

    time--;
    document.getElementById("timer").innerText = time;

    if (time <= 0) {

      clearInterval(timerInterval);
      isResting = false;
      releaseWakeLock();
      setTimerButtons(false);
      callback();
    }

  }, 1000);
}

// レスト途中で止める
function stopTimer() {

  clearInterval(timerInterval);
  isResting = false;
  releaseWakeLock();
  setTimerButtons(false);

  const t = document.getElementById("timer");
  if (t) t.innerText = "停止しました";
}

// レスト中はレスト開始ボタンを無効化
function setTimerButtons(disabled) {

  ["setRestBtn", "exerciseRestBtn"].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.disabled = disabled;
  });
}

// 終了時：ピピ音＋スマホ振動
function finishBeep() {

  playSound();

  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

// ===== 画面スリープ防止（Wake Lock） =====
async function requestWakeLock() {

  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (e) {
    // 非対応・失敗時は何もしない（タイマー自体は動く）
  }
}

function releaseWakeLock() {

  try {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  } catch (e) {}
}

// ===== 音停止 =====
function stopSound() {

  clearInterval(alarmInterval);
}

// ===== ピピ音 =====
function playSound() {

  const ctx =
    new (window.AudioContext || window.webkitAudioContext)();

  function beep(time) {

    const osc = ctx.createOscillator();

    const gain = ctx.createGain();

    osc.type = "sine";

    osc.frequency.setValueAtTime(
      1000,
      ctx.currentTime + time
    );

    gain.gain.setValueAtTime(
      0.2,
      ctx.currentTime + time
    );

    osc.connect(gain);

    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + time);

    osc.stop(ctx.currentTime + time + 0.15);
  }

  beep(0);

  beep(0.2);
}

// ===== 種目 =====
let exercises =
  JSON.parse(localStorage.getItem("exercises")) || [

    { name: "ベンチプレス", mets: 5, part: "胸" },

    { name: "スクワット", mets: 6, part: "脚" },

    { name: "デッドリフト", mets: 6, part: "背中" },

    { name: "ランニング", mets: 8, part: "有酸素" }
  ];

function updateExerciseSelect() {

  const select =
    document.getElementById("exerciseSelect");

  if (!select) return;

  select.innerHTML = "";

  exercises.forEach((ex, i) => {

    const opt = document.createElement("option");

    opt.value = i;

    opt.textContent =
      `${ex.name} (METs:${ex.mets})`;

    select.appendChild(opt);
  });

  showPreviousWeight();
}

// ===== 種目管理（追加・編集・削除・一覧） =====
let editingExerciseIndex = -1;

// 自己ベスト判定：今回の重量が、その種目の過去最高を超えていれば true
function checkPR(name, weight) {

  if (isNaN(weight) || weight <= 0) return false;

  const hist =
    JSON.parse(localStorage.getItem("exerciseHistory")) || {};

  const records = hist[name] || [];

  let prevBest = 0;
  records.forEach(r => { if (r.weight > prevBest) prevBest = r.weight; });

  // 過去に記録があり、それを上回ったときだけ自己ベスト扱い
  return prevBest > 0 && weight > prevBest;
}

// 記録ページのメッセージ表示
function showRecordMessage(msg) {
  const el = document.getElementById("recordMsg");
  if (el) el.innerText = msg;
}

function addExercise() {

  const name =
    document.getElementById("newExerciseName").value.trim();

  const partEl =
    document.getElementById("newExercisePart");

  const part = partEl ? partEl.value : "";

  const mets = parseFloat(
    document.getElementById("newExerciseMets").value
  );

  if (!name || isNaN(mets)) {
    alert("種目名とMETsを入力してください。");
    return;
  }

  if (editingExerciseIndex >= 0) {
    // 編集モード：既存を上書き
    exercises[editingExerciseIndex] = { name, mets, part };
    editingExerciseIndex = -1;
    resetExerciseForm();
  } else {
    // 追加モード
    exercises.push({ name, mets, part });
  }

  localStorage.setItem(
    "exercises",
    JSON.stringify(exercises)
  );

  // フォームを空に
  document.getElementById("newExerciseName").value = "";
  document.getElementById("newExerciseMets").value = "";

  renderExerciseList();
  updateExerciseSelect();   // 記録ページのドロップダウンも更新
}

// 登録済み種目の一覧表示
function renderExerciseList() {

  const list =
    document.getElementById("exerciseList");

  if (!list) return;

  list.innerHTML = "";

  exercises.forEach((ex, i) => {

    const part = ex.part || "部位未設定";

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="item-name">
        ${ex.name}（${part} / METs:${ex.mets}）
      </div>
      <div class="item-actions">
        <button class="item-btn" onclick="editExercise(${i})">編集</button>
        <button class="item-btn del" onclick="deleteExercise(${i})">削除</button>
      </div>
    `;

    list.appendChild(li);
  });
}

// 種目を編集（フォームに値を入れて更新モードへ）
function editExercise(i) {

  const ex = exercises[i];

  if (!ex) return;

  document.getElementById("newExerciseName").value = ex.name;

  const partEl = document.getElementById("newExercisePart");
  if (partEl) partEl.value = ex.part || "胸";

  document.getElementById("newExerciseMets").value = ex.mets;

  editingExerciseIndex = i;

  const title = document.getElementById("exFormTitle");
  if (title) title.innerText = "種目を編集";

  const btn = document.getElementById("exSubmitBtn");
  if (btn) btn.innerText = "更新する";

  const cancel = document.getElementById("exCancelBtn");
  if (cancel) cancel.style.display = "block";

  window.scrollTo(0, 0);
}

function cancelEditExercise() {

  editingExerciseIndex = -1;

  document.getElementById("newExerciseName").value = "";
  document.getElementById("newExerciseMets").value = "";

  resetExerciseForm();
}

function resetExerciseForm() {

  const title = document.getElementById("exFormTitle");
  if (title) title.innerText = "種目を追加";

  const btn = document.getElementById("exSubmitBtn");
  if (btn) btn.innerText = "追加";

  const cancel = document.getElementById("exCancelBtn");
  if (cancel) cancel.style.display = "none";
}

function deleteExercise(i) {

  if (!confirm("この種目を削除しますか？")) return;

  exercises.splice(i, 1);

  localStorage.setItem(
    "exercises",
    JSON.stringify(exercises)
  );

  if (editingExerciseIndex === i) cancelEditExercise();

  renderExerciseList();
  updateExerciseSelect();
}

// ===== 記録 =====
let todayMenu =
  JSON.parse(localStorage.getItem("todayMenu")) || [];

// 今日の日付（YYYY-MM-DD）
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// 日付が変わっていたら、前日のメニューを片付けて今日を始める
function checkNewDay() {

  const savedDate = localStorage.getItem("todayMenuDate");
  const today = todayStr();

  if (savedDate && savedDate !== today && todayMenu.length > 0) {

    // 前日のメニューは「前回のトレ」として残し、今日のメニューは空にする
    localStorage.setItem("lastSession", JSON.stringify(todayMenu));

    todayMenu = [];
    localStorage.setItem("todayMenu", JSON.stringify(todayMenu));
  }

  localStorage.setItem("todayMenuDate", today);
}

// 今日のメニューを手動でクリア
function clearTodayMenu() {

  if (todayMenu.length === 0) return;

  if (!confirm("今日のメニューをすべて消します。よろしいですか？")) return;

  // 念のため「前回のトレ」として残してから消す
  localStorage.setItem("lastSession", JSON.stringify(todayMenu));

  todayMenu = [];
  localStorage.setItem("todayMenu", JSON.stringify(todayMenu));

  renderMenu();
}

function addWorkout() {

  const index =
    document.getElementById("exerciseSelect").value;

  const reps = parseFloat(
    document.getElementById("exerciseReps").value
  );

  const weight = parseFloat(
    document.getElementById("exerciseWeight").value
  );

  // セット数（まとめ入力）。未入力なら1セット扱い
  const setsEl = document.getElementById("exerciseSets");
  let sets = parseInt(setsEl ? setsEl.value : "1");
  if (isNaN(sets) || sets < 1) sets = 1;

  const ex = exercises[index];

  // 種目・回数・重量が未入力なら何もしない
  if (!ex || isNaN(reps) || isNaN(weight)) return;

  // セット数ぶんまとめて記録（1行=1セット）
  for (let i = 0; i < sets; i++) {
    todayMenu.push({
      name: ex.name,
      mets: ex.mets,
      reps,
      weight
    });
  }

  localStorage.setItem(
    "todayMenu",
    JSON.stringify(todayMenu)
  );

  // 前回の重量・回数を保存（次回の自動入力に使う）
  localStorage.setItem(
    `lastWeight_${ex.name}`,
    weight
  );
  localStorage.setItem(
    `lastReps_${ex.name}`,
    reps
  );

  // 種目別の重量推移グラフ用に履歴を残す
  // （自己ベスト判定は履歴を更新する前に行う）
  const isPR = checkPR(ex.name, weight);
  logExerciseHistory(ex.name, weight, reps);

  // 回復管理：この種目の部位を記録（ai.js が読み込まれている時のみ）
  if (typeof aiLogParts === "function") {

    // 種目に部位が設定されていればそれを使う
    let loggedPart = ex.part;

    // 未設定なら AI の種目DBから名前で部位を推定
    if (!loggedPart && typeof aiExerciseDB !== "undefined") {
      for (const part in aiExerciseDB) {
        if (aiExerciseDB[part].some(e => e.name === ex.name)) {
          loggedPart = part;
          break;
        }
      }
    }

    if (loggedPart) aiLogParts([loggedPart]);
  }

  renderMenu();

  showPreviousWeight();

  // XP獲得（1セット=XP_PER_SET、自己ベストはボーナス）
  const gainedXP = sets * XP_PER_SET + (isPR ? XP_PR_BONUS : 0);
  const leveledUp = addXP(gainedXP);

  let msg = isPR
    ? `${ex.name} 自己ベスト更新！ ${weight}kg`
    : "記録しました";
  msg += `（+${gainedXP} XP）`;
  if (leveledUp) msg += ` ／ レベルアップ Lv.${leveledUp}！`;

  showRecordMessage(msg);
}

// ===== ステッパー（＋/−ボタンで数値を増減） =====
function stepField(id, delta, min) {

  const el = document.getElementById(id);

  if (!el) return;

  let v = parseFloat(el.value);

  if (isNaN(v)) v = 0;

  v += delta;

  if (typeof min === "number" && v < min) v = min;

  // 2.5刻みなどの小数誤差対策（小数1桁に丸め）
  el.value = Math.round(v * 10) / 10;
}

function renderMenu() {

  const list =
    document.getElementById("menuList");

  if (!list) return;

  list.innerHTML = "";

  // todayMenu（1件=1セット）を、種目ごとにまとめる（初出順を保つ）
  const groups = [];
  const indexByName = {};
  todayMenu.forEach((item, i) => {
    if (!(item.name in indexByName)) {
      indexByName[item.name] = groups.length;
      groups.push({ name: item.name, mets: item.mets, sets: [] });
    }
    groups[indexByName[item.name]].sets.push({ idx: i, reps: item.reps, weight: item.weight });
  });

  groups.forEach(g => {
    const li = document.createElement("li");
    li.className = "menu-ex";

    const rows = g.sets.map((s, n) => `
      <div class="set-row">
        <span class="set-no">${n + 1}セット目</span>
        <input class="set-inp" type="number" inputmode="decimal" value="${s.reps}"
          onchange="updateSet(${s.idx}, 'reps', this.value)">
        <span class="set-unit">回</span>
        <input class="set-inp" type="number" inputmode="decimal" value="${s.weight}"
          onchange="updateSet(${s.idx}, 'weight', this.value)">
        <span class="set-unit">kg</span>
        <button class="set-del" onclick="deleteItem(${s.idx})" aria-label="このセットを削除">×</button>
      </div>
    `).join("");

    li.innerHTML = `
      <div class="menu-ex-head">
        <span class="menu-ex-name">${g.name}</span>
        <button class="set-add-btn" onclick="addSetToExercise('${g.name.replace(/'/g, "\\'")}')">＋セット追加</button>
      </div>
      ${rows}
      <button class="menu-ex-del" onclick="deleteExerciseGroup('${g.name.replace(/'/g, "\\'")}')">この種目を削除</button>
    `;

    list.appendChild(li);
  });

  // メニューが変わるたびに当日の総ボリュームを更新（グラフの土台）
  updateDailyVolume();
}

// セットの回数・重さを編集
function updateSet(idx, field, value) {
  if (!todayMenu[idx]) return;
  const v = parseFloat(value);
  if (isNaN(v)) return;
  todayMenu[idx][field] = v;
  localStorage.setItem("todayMenu", JSON.stringify(todayMenu));
  updateDailyVolume();
}

// その種目に1セット追加（最後のセットの回数・重さを引き継ぐ）
function addSetToExercise(name) {
  // その種目の最後の出現位置を探す
  let lastIdx = -1;
  todayMenu.forEach((it, i) => { if (it.name === name) lastIdx = i; });
  if (lastIdx === -1) return;
  const base = todayMenu[lastIdx];
  todayMenu.splice(lastIdx + 1, 0, {
    name: base.name, mets: base.mets, reps: base.reps, weight: base.weight
  });
  localStorage.setItem("todayMenu", JSON.stringify(todayMenu));
  renderMenu();
}

// その種目のセットをすべて削除
function deleteExerciseGroup(name) {
  todayMenu = todayMenu.filter(it => it.name !== name);
  localStorage.setItem("todayMenu", JSON.stringify(todayMenu));
  renderMenu();
}

// 同じ内容のセットをすぐ下に複製（重量・回数を入れ直さずに1セット追加）
function duplicateItem(i) {

  const item = todayMenu[i];

  if (!item) return;

  todayMenu.splice(i + 1, 0, {
    name: item.name,
    mets: item.mets,
    reps: item.reps,
    weight: item.weight
  });

  localStorage.setItem(
    "todayMenu",
    JSON.stringify(todayMenu)
  );

  renderMenu();
}

function deleteItem(i) {

  todayMenu.splice(i, 1);

  localStorage.setItem(
    "todayMenu",
    JSON.stringify(todayMenu)
  );

  renderMenu();
}

// ===== 前回の重量・回数（表示＋自動入力） =====
function showPreviousWeight() {

  const select =
    document.getElementById("exerciseSelect");

  const div =
    document.getElementById("previousWeight");

  if (!select || !div) return;

  const ex =
    exercises[select.value];

  if (!ex) return;

  const lastW =
    localStorage.getItem(`lastWeight_${ex.name}`);

  const lastR =
    localStorage.getItem(`lastReps_${ex.name}`);

  if (lastW) {

    div.innerText =
      `前回 : ${lastW}kg` + (lastR ? ` × ${lastR}回` : "");

    // 前回の値を入力欄に自動セット（同じならそのまま記録ボタンでOK）
    const wEl = document.getElementById("exerciseWeight");
    const rEl = document.getElementById("exerciseReps");

    if (wEl) wEl.value = lastW;
    if (rEl && lastR) rEl.value = lastR;

  } else {

    div.innerText =
      "前回記録なし";
  }
}

// ===== 前回のトレ（ワンタップ呼び出し用スロット） =====
function saveLastSession() {

  if (todayMenu.length === 0) {
    alert("今日のメニューが空です。");
    return;
  }

  localStorage.setItem(
    "lastSession",
    JSON.stringify(todayMenu)
  );

  alert("今日のトレを「前回のトレ」として記憶しました。");
}

function loadLastSession() {

  const data =
    JSON.parse(localStorage.getItem("lastSession"));

  if (!data || data.length === 0) {
    alert("記憶された前回のトレがありません。まず「前回として記憶」で保存してください。");
    return;
  }

  // 配列をコピーして読み込む（元データを共有しないように）
  todayMenu = data.map(item => ({ ...item }));

  localStorage.setItem(
    "todayMenu",
    JSON.stringify(todayMenu)
  );

  renderMenu();
}

// ===== 名前付き保存メニュー（ルーティン） =====
function saveRoutine() {

  const name =
    document.getElementById("menuName").value;

  if (!name) {
    alert("メニュー名を入力してください。");
    return;
  }

  if (todayMenu.length === 0) {
    alert("今日のメニューが空です。");
    return;
  }

  let routines =
    JSON.parse(localStorage.getItem("routines")) || [];

  routines.push({
    name,
    menu: todayMenu.map(item => ({ ...item }))
  });

  localStorage.setItem(
    "routines",
    JSON.stringify(routines)
  );

  // 保存したものは「前回のトレ」としても覚えておく
  localStorage.setItem(
    "lastSession",
    JSON.stringify(todayMenu)
  );

  document.getElementById("menuName").value = "";

  renderRoutines();
}

// 保存済みメニューをワンタップ読み込みボタンとして表示
function renderRoutines() {

  const box =
    document.getElementById("routineButtons");

  if (!box) return;

  let routines =
    JSON.parse(localStorage.getItem("routines")) || [];

  box.innerHTML = "";

  if (routines.length === 0) {
    box.innerHTML =
      `<div style="color:var(--muted);">保存したメニューはまだありません。</div>`;
    return;
  }

  routines.forEach((r, i) => {

    const row = document.createElement("div");
    row.className = "routine-row";

    row.innerHTML = `
      <button class="routine-load" onclick="loadRoutineByIndex(${i})">
        ${r.name}
      </button>
      <button class="routine-del" onclick="deleteRoutine(${i})">✕</button>
    `;

    box.appendChild(row);
  });
}

function loadRoutineByIndex(index) {

  let routines =
    JSON.parse(localStorage.getItem("routines")) || [];

  if (!routines[index]) return;

  // コピーして読み込む
  todayMenu = routines[index].menu.map(item => ({ ...item }));

  localStorage.setItem(
    "todayMenu",
    JSON.stringify(todayMenu)
  );

  renderMenu();
}

function deleteRoutine(index) {

  let routines =
    JSON.parse(localStorage.getItem("routines")) || [];

  routines.splice(index, 1);

  localStorage.setItem(
    "routines",
    JSON.stringify(routines)
  );

  renderRoutines();
}

// ===== 身長・体重の記憶（毎回同じ値が入るように） =====
function saveBodyStats() {

  const w = document.getElementById("weight");
  const h = document.getElementById("height");

  if (w && w.value) localStorage.setItem("bodyWeight", w.value);
  if (h && h.value) localStorage.setItem("bodyHeight", h.value);
}

function loadBodyStats() {

  const w = document.getElementById("weight");
  const h = document.getElementById("height");

  if (w) {
    const bw = localStorage.getItem("bodyWeight");
    if (bw) w.value = bw;
  }
  if (h) {
    const bh = localStorage.getItem("bodyHeight");
    if (bh) h.value = bh;
  }
}

// ===== カロリー =====
function calcFromMenu() {

  const bodyWeight = parseFloat(
    document.getElementById("weight").value
  );

  const heightEl =
    document.getElementById("height");

  const height =
    heightEl ? parseFloat(heightEl.value) : NaN;

  const result =
    document.getElementById("result");

  // 体重は必須
  if (isNaN(bodyWeight)) {
    result.innerText = "体重を入力してください。";
    return;
  }

  // 入力した身長・体重を記憶（次回も同じ値が入る）
  saveBodyStats();

  // 今日のメニューが空なら計算しない
  if (todayMenu.length === 0) {
    result.innerText =
      "今日のメニューが空です。記録ページで種目を追加してください。";
    return;
  }

  // 身長は可動域の差として軽く反映（基準170cm）。未入力なら1.0倍
  const heightFactor =
    (!isNaN(height) && height > 0) ? height / 170 : 1;

  let total = 0;

  todayMenu.forEach(item => {

    const minutes =
      (item.reps * 4) / 60;

    const intensity =
      1 + item.weight / 100;

    total +=
      item.mets *
      bodyWeight *
      (minutes / 60) *
      intensity *
      heightFactor;
  });

  result.innerText =
    `合計消費カロリー：約 ${total.toFixed(1)} kcal`;

  saveCalories(total);

  drawCharts();
}

// ===== 履歴データ（土台） =====
//  dailyStats      = { "YYYY-MM-DD": { volume, calories } }
//  exerciseHistory = { 種目名: [ { date, weight, reps } ] }

// 今日のメニューから総ボリューム（重量×回数の合計）を計算して当日分に保存
function updateDailyVolume() {

  const stats =
    JSON.parse(localStorage.getItem("dailyStats")) || {};

  const today = todayStr();

  let vol = 0;
  todayMenu.forEach(it => {
    vol += (it.weight || 0) * (it.reps || 0);
  });

  if (!stats[today]) stats[today] = {};
  stats[today].volume = vol;

  localStorage.setItem("dailyStats", JSON.stringify(stats));
}

// 種目ごとの重量履歴を残す（同じ日はその日の最大重量を保持）
function logExerciseHistory(name, weight, reps) {

  if (isNaN(weight)) return;

  markTrainedToday();   // 週ストリーク用に「今日トレした」を記録

  const hist =
    JSON.parse(localStorage.getItem("exerciseHistory")) || {};

  if (!hist[name]) hist[name] = [];

  const today = todayStr();
  const existing = hist[name].find(e => e.date === today);

  if (existing) {
    if (weight > existing.weight) {
      existing.weight = weight;
      existing.reps = reps;
    }
  } else {
    hist[name].push({ date: today, weight, reps });
  }

  // 各種目 最新60日分まで
  if (hist[name].length > 60) {
    hist[name] = hist[name].slice(-60);
  }

  localStorage.setItem("exerciseHistory", JSON.stringify(hist));
}

// =====================================================================
//  ゲーミフィケーション：週の目標回数 と 達成週の連続記録（ストリーク）
//  ※筋トレは休養が必要なので「連続日数」ではなく「週◯回を達成した週の連続数」
// =====================================================================

// トレした日を記録（重複なし）
function markTrainedToday() {
  const days = JSON.parse(localStorage.getItem("trainedDays")) || [];
  const today = todayStr();
  if (!days.includes(today)) {
    days.push(today);
    if (days.length > 200) days.splice(0, days.length - 200);
    localStorage.setItem("trainedDays", JSON.stringify(days));
  }
}

// 月曜はじまりの「その週の月曜の日付」を返す
function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;   // 月=0 … 日=6
  d.setDate(d.getDate() - day);
  return d;
}
function weekKey(date) {
  return weekStart(date).toISOString().split("T")[0];
}

// 今週のトレ回数
function countThisWeek() {
  const days = JSON.parse(localStorage.getItem("trainedDays")) || [];
  const thisKey = weekKey(new Date());
  return days.filter(d => weekKey(d) === thisKey).length;
}

// 週1回以上トレした週が何週連続しているか
//  （今週は進行中なので、まだ0回でも連続は途切れない）
function weeklyStreak() {
  const days = JSON.parse(localStorage.getItem("trainedDays")) || [];
  const weeks = new Set(days.map(d => weekKey(d)));

  let streak = 0;
  const cursor = weekStart(new Date());

  // 今週：トレしていれば数える。まだでも（進行中なので）切らさず先週から見る
  if (weeks.has(cursor.toISOString().split("T")[0])) {
    streak++;
  }

  // 先週以前をさかのぼって、トレした週が続く間だけ連続を伸ばす
  cursor.setDate(cursor.getDate() - 7);
  while (weeks.has(cursor.toISOString().split("T")[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

// ホームに今週のトレ状況（曜日ドット）とストリークを表示
function renderWeeklyStreak() {
  const box = document.getElementById("weeklyStreakBox");
  if (!box) return;

  const days = JSON.parse(localStorage.getItem("trainedDays")) || [];
  const mon = weekStart(new Date());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const labels = ["月", "火", "水", "木", "金", "土", "日"];

  let dots = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const on = days.includes(key);
    const future = d > today;
    dots += `
      <div class="week-dot${on ? " on" : ""}${future ? " future" : ""}">
        <span class="week-dot-day">${labels[i]}</span>
        <span class="week-dot-mark">${on ? "✓" : ""}</span>
      </div>`;
  }

  const done = countThisWeek();
  const streak = weeklyStreak();

  const streakText =
    streak > 1 ? `${streak}週連続でトレーニング中`
    : streak === 1 ? "連続記録スタート。来週も続けよう"
    : "今週トレして連続記録を始めよう";

  box.innerHTML = `
    <div class="stat-row">
      <span class="stat-num-md">${done}</span>
      <span class="stat-den">回 / 今週</span>
    </div>
    <div class="week-dots">${dots}</div>
    <div class="streak ${streak > 0 ? "on" : ""}">${streakText}</div>
  `;
}

// =====================================================================
//  ゲーミフィケーション：経験値（XP）とレベル
// =====================================================================
const XP_PER_SET  = 10;   // 1セット記録ごとのXP
const XP_PR_BONUS = 50;   // 自己ベスト更新ボーナス

// 累計XPから 現在レベル・次までの進捗 を計算
//  レベルが上がるほど必要XPが増える（Lv1→2:100, Lv2→3:150, …）
function levelInfo(totalXP) {
  let level = 1;
  let xp = totalXP;
  let need = 100;

  while (xp >= need) {
    xp -= need;
    level++;
    need = 100 + (level - 1) * 50;
  }

  return { level, currentXP: xp, needXP: need };
}

// XPを加算。レベルが上がったら新レベルを返す（上がらなければ null）
function addXP(amount) {
  if (!amount || amount <= 0) return null;

  const before = levelInfo(parseInt(localStorage.getItem("totalXP")) || 0).level;

  const total = (parseInt(localStorage.getItem("totalXP")) || 0) + amount;
  localStorage.setItem("totalXP", total);

  const after = levelInfo(total).level;

  renderLevel();   // ホーム表示中なら更新（無ければ何もしない）

  return after > before ? after : null;
}

// ホームにレベルとXPバーを表示
function renderLevel() {
  const box = document.getElementById("levelBox");
  if (!box) return;

  const total = parseInt(localStorage.getItem("totalXP")) || 0;
  const info = levelInfo(total);
  const pct = Math.min(100, Math.round((info.currentXP / info.needXP) * 100));

  box.innerHTML = `
    <div class="stat-label">LEVEL</div>
    <div class="stat-num">${info.level}</div>
    <div class="progress-track">
      <div class="progress-fill" style="width:${pct}%"></div>
    </div>
    <div class="stat-sub">
      次のレベルまで XP ${info.currentXP} / ${info.needXP}（累計 ${total} XP）
    </div>
  `;
}

// カロリーを当日分として保存（同じ日は上書き＝重複しない）
function saveCalories(cal) {

  const stats =
    JSON.parse(localStorage.getItem("dailyStats")) || {};

  const today = todayStr();

  if (!stats[today]) stats[today] = {};
  stats[today].calories = cal;

  localStorage.setItem("dailyStats", JSON.stringify(stats));
}

// ===== グラフ =====
let calorieChartObj;
let volumeChartObj;
let weightChartObj;

// dailyStats を日付順の配列にして返す（直近 limit 日ぶん）
function getDailyStatsArray(limit) {

  const stats =
    JSON.parse(localStorage.getItem("dailyStats")) || {};

  const arr = Object.keys(stats)
    .sort()
    .map(date => ({
      date,
      volume: stats[date].volume || 0,
      calories: stats[date].calories || 0
    }));

  return limit ? arr.slice(-limit) : arr;
}

function shortDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// グラフページの全チャートを描画
function drawCharts() {
  applyChartTheme();
  drawWeightChart();
  drawVolumeChart();
  drawCalorieChart();
}

// グラフの文字・目盛りをダーク背景で読みやすい色にする
function applyChartTheme() {
  if (typeof Chart === "undefined") return;
  Chart.defaults.color = "#E9EDF3";                       // 凡例・軸ラベルの文字
  Chart.defaults.borderColor = "rgba(255,255,255,0.10)";  // グリッド線
  Chart.defaults.font = Chart.defaults.font || {};
  Chart.defaults.font.size = 13;
  // スマホで縦に伸びすぎないよう、やや横長のアスペクトに
  Chart.defaults.maintainAspectRatio = true;
  Chart.defaults.aspectRatio = 1.9;
}

// ① 種目別の重量推移（折れ線）
function drawWeightChart() {

  const canvas = document.getElementById("weightChart");
  if (!canvas) return;

  const select = document.getElementById("graphExerciseSelect");
  const name = select ? select.value : null;

  const hist =
    JSON.parse(localStorage.getItem("exerciseHistory")) || {};

  const records = (name && hist[name]) ? hist[name] : [];

  const labels = records.map(r => shortDate(r.date));
  const data = records.map(r => r.weight);

  if (weightChartObj) weightChartObj.destroy();

  weightChartObj = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: name ? `${name} の重量(kg)` : "重量(kg)",
        data,
        borderColor: "#2CE080",
        backgroundColor: "rgba(44,224,128,0.25)",
        tension: 0.2
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const r = records[ctx.dataIndex];
              return r ? `${r.reps}回` : "";
            }
          }
        }
      }
    }
  });
}

// ② 総ボリュームの推移（棒）
function drawVolumeChart() {

  const canvas = document.getElementById("volumeChart");
  if (!canvas) return;

  const arr = getDailyStatsArray(14);

  if (volumeChartObj) volumeChartObj.destroy();

  volumeChartObj = new Chart(canvas, {
    type: "bar",
    data: {
      labels: arr.map(a => shortDate(a.date)),
      datasets: [{
        label: "総ボリューム (kg×回)",
        data: arr.map(a => a.volume),
        backgroundColor: "#18C7C0"
      }]
    }
  });
}

// 消費カロリーの推移（棒）
function drawCalorieChart() {

  const canvas = document.getElementById("calorieChart");
  if (!canvas) return;

  const arr = getDailyStatsArray(14);

  if (calorieChartObj) calorieChartObj.destroy();

  calorieChartObj = new Chart(canvas, {
    type: "bar",
    data: {
      labels: arr.map(a => shortDate(a.date)),
      datasets: [{
        label: "消費カロリー (kcal)",
        data: arr.map(a => a.calories),
        backgroundColor: "#FFA94D"
      }]
    }
  });
}

// グラフページの種目セレクトを用意
function initGraphPage() {

  const select = document.getElementById("graphExerciseSelect");
  if (!select) return;

  const hist =
    JSON.parse(localStorage.getItem("exerciseHistory")) || {};

  const names = Object.keys(hist);

  select.innerHTML = "";

  if (names.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "記録された種目がありません";
    select.appendChild(opt);
  } else {
    names.forEach(n => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      select.appendChild(opt);
    });
  }

  select.addEventListener("change", drawWeightChart);
}

// ===== 初期化 =====
window.onload = () => {

  checkNewDay();

  updateExerciseSelect();

  renderExerciseList();

  renderMenu();

  initGraphPage();

  drawCharts();

  renderRoutines();

  loadBodyStats();

  // ホームの週表示・レベル表示
  renderWeeklyStreak();
  renderLevel();

  // タイマーの種目選択（メニューから）
  initTimerExercisePicker();

  const select =
    document.getElementById("exerciseSelect");

  if (select) {

    select.addEventListener(
      "change",
      showPreviousWeight
    );
  }
};


// =====================================================================
//  データのバックアップ／復元
//  localStorage の全データをファイルに保存・読み込みする
// =====================================================================

// エクスポート：全データを JSON ファイルにして保存
function exportData() {

  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workout-backup-${todayStr()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// インポート：バックアップファイルを読み込んで復元
function importData(input) {

  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (!confirm("バックアップを読み込みます。今のデータは上書きされます。よろしいですか？")) {
        input.value = "";
        return;
      }

      Object.keys(data).forEach(key => {
        localStorage.setItem(key, data[key]);
      });

      alert("読み込みました。ページを再読み込みします。");
      location.reload();

    } catch (err) {
      alert("ファイルを読み込めませんでした。正しいバックアップファイルか確認してください。");
    }
  };

  reader.onerror = () => {
    alert("ファイルの読み込みに失敗しました。");
  };

  reader.readAsText(file);
}
