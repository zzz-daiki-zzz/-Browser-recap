/**
 * Wrapped App - Git Wrapped風のRecap表示
 */

// 現在のカードインデックス
let currentIndex = 0;
const totalCards = 8;

// タッチ操作用
let touchStartX = 0;
let touchEndX = 0;

// データ
let recapData = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initWrapped();
});

async function initWrapped() {
  // ★ ページを開いた時点で利用を記録
  RecapTracker.recordLaunch();
  
  // ページを離れる時に滞在時間を記録
  window.addEventListener('beforeunload', () => {
    RecapTracker.recordSession();
  });
  window.addEventListener('pagehide', () => {
    RecapTracker.recordSession();
  });
  
  // データ読み込み
  recapData = RecapTracker.loadData();
  
  // データチェック（初回アクセスでも1件あるはず）
  if (recapData.launches.length === 0) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('noData').style.display = 'flex';
    return;
  }
  
  // ローディング演出
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // データを準備
  prepareData();
  
  // UI表示
  document.getElementById('loading').style.display = 'none';
  document.getElementById('wrapped').style.display = 'block';
  document.getElementById('navigation').style.display = 'flex';
  
  // プログレスドット生成
  createProgressDots();
  
  // イベント設定
  setupEvents();
}

// プログレスドット生成
function createProgressDots() {
  const container = document.getElementById('progressDots');
  container.innerHTML = '';
  
  for (let i = 0; i < totalCards; i++) {
    const dot = document.createElement('div');
    dot.className = 'progress-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToCard(i));
    container.appendChild(dot);
  }
}

// イベント設定
function setupEvents() {
  // カードクリック
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        nextCard();
      }
    });
  });
  
  // ナビボタン
  document.getElementById('prevBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    prevCard();
  });
  
  document.getElementById('nextBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    nextCard();
  });
  
  // リスタートボタン
  document.getElementById('restartBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    restartWrapped();
  });
  
  // タッチスワイプ
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // キーボード
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextCard();
    } else if (e.key === 'ArrowLeft') {
      prevCard();
    }
  });
}

// タッチハンドラ
function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  const diff = touchStartX - touchEndX;
  const threshold = 50;
  
  if (diff > threshold) {
    nextCard();
  } else if (diff < -threshold) {
    prevCard();
  }
}

// 自動進行タイマー
let autoAdvanceTimer = null;
let progressInterval = null;
const AUTO_ADVANCE_TIME = 10000; // 10秒

// プログレスバー制御
function startProgressBar() {
  const progressBar = document.getElementById('autoProgressBar');
  const progressFill = document.getElementById('autoProgressFill');
  
  if (!progressBar || !progressFill) return;
  
  // バーを表示
  progressBar.classList.add('active');
  progressFill.style.width = '0%';
  
  // 既存のインターバルをクリア
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  
  const startTime = Date.now();
  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / AUTO_ADVANCE_TIME) * 100, 100);
    progressFill.style.width = `${progress}%`;
    
    if (progress >= 100) {
      clearInterval(progressInterval);
    }
  }, 50);
}

function stopProgressBar() {
  const progressBar = document.getElementById('autoProgressBar');
  const progressFill = document.getElementById('autoProgressFill');
  
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  
  if (progressBar) {
    progressBar.classList.remove('active');
  }
  if (progressFill) {
    progressFill.style.width = '0%';
  }
}

// カード切り替え
function goToCard(index) {
  if (index < 0 || index >= totalCards) return;
  
  // 既存のタイマーとプログレスバーをクリア
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  stopProgressBar();
  
  const cards = document.querySelectorAll('.card');
  const dots = document.querySelectorAll('.progress-dot');
  
  cards.forEach((card, i) => {
    card.classList.remove('active', 'prev');
    if (i === index) {
      card.classList.add('active');
      // カウントアップアニメーション
      animateCard(card);
    } else if (i < index) {
      card.classList.add('prev');
    }
  });
  
  dots.forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i === index) {
      dot.classList.add('active');
    } else if (i < index) {
      dot.classList.add('completed');
    }
  });
  
  currentIndex = index;
  
  // ナビボタン状態更新
  document.getElementById('prevBtn').disabled = index === 0;
  document.getElementById('nextBtn').disabled = index === totalCards - 1;
  
  // 2ページ目以降（index >= 1）かつ最後のページでなければ自動進行
  if (index >= 1 && index < totalCards - 1) {
    startProgressBar();
    autoAdvanceTimer = setTimeout(() => {
      nextCard();
    }, AUTO_ADVANCE_TIME);
  }
}

function nextCard() {
  if (currentIndex < totalCards - 1) {
    goToCard(currentIndex + 1);
  }
}

function prevCard() {
  if (currentIndex > 0) {
    goToCard(currentIndex - 1);
  }
}

// リスタート（最初から見る）
function restartWrapped() {
  // 全カードの数字をリセット
  document.querySelectorAll('.stat-big-number .number').forEach(el => {
    el.textContent = '0';
  });
  
  // 最初のカードに戻る
  goToCard(0);
}

// カードアニメーション
function animateCard(card) {
  const numberEl = card.querySelector('.stat-big-number .number');
  if (numberEl && numberEl.dataset.target) {
    // ボックスが開いた後（2秒後）にカウントアップ開始
    setTimeout(() => {
      animateNumber(numberEl, parseInt(numberEl.dataset.target));
    }, 2000);
  }
}

// 数字カウントアップ
function animateNumber(element, target) {
  const duration = 1500; // 1.5秒かけてカウントアップ
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // イージング（最後にゆっくり）
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (target - start) * eased);
    
    element.textContent = current.toLocaleString();
    element.classList.add('counting');
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString();
      element.classList.remove('counting');
    }
  }
  
  requestAnimationFrame(update);
}

// データ準備
function prepareData() {
  const year = new Date().getFullYear();
  const launches = recapData.launches;
  const sessions = recapData.sessions;
  
  // 年間データのみ
  const yearLaunches = launches.filter(l => l.date.startsWith(String(year)));
  const yearSessions = sessions.filter(s => s.date.startsWith(String(year)));
  
  // 統計計算
  const uniqueDays = new Set(yearLaunches.map(l => l.date)).size;
  const totalLaunches = yearLaunches.length;
  const totalSeconds = yearSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const avgMinutes = yearSessions.length > 0 ? Math.round(totalSeconds / yearSessions.length / 60) : 0;
  
  // 連続日数
  const sortedDates = [...new Set(yearLaunches.map(l => l.date))].sort();
  const maxStreak = calculateMaxStreak(sortedDates);
  const currentStreak = calculateCurrentStreak(sortedDates);
  
  // 時間帯分析
  const timeAnalysis = analyzeTimeOfDay(yearLaunches);
  
  // カード1: 総利用日数
  const daysNumber = document.querySelector('#wTotalDays .number');
  daysNumber.dataset.target = uniqueDays;
  daysNumber.textContent = '0';
  
  // カード2: 総起動回数
  const launchNumber = document.querySelector('#wTotalLaunches .number');
  launchNumber.dataset.target = totalLaunches;
  launchNumber.textContent = '0';
  
  const avgLaunchesPerDay = uniqueDays > 0 ? (totalLaunches / uniqueDays).toFixed(1) : 0;
  document.getElementById('wAvgLaunches').textContent = `1日平均 ${avgLaunchesPerDay}回`;
  
  // カード3: 滞在時間
  const timeNumber = document.querySelector('#wTotalTime .number');
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    timeNumber.dataset.target = hours;
    document.querySelector('#wTotalTime .unit').textContent = '時間';
  } else {
    timeNumber.dataset.target = totalMinutes;
  }
  timeNumber.textContent = '0';
  
  document.getElementById('wAvgTime').textContent = `平均 ${avgMinutes}分/回`;
  
  const timeContext = document.getElementById('wTimeContext');
  if (totalMinutes >= 1000) {
    timeContext.textContent = '📚 じっくり派！';
  } else if (totalMinutes >= 300) {
    timeContext.textContent = '⚡ 効率派！';
  } else {
    timeContext.textContent = '💨 サクサク派！';
  }
  
  // カード4: 時間帯性格
  document.getElementById('wPersonalityIcon').textContent = timeAnalysis.icon;
  document.getElementById('wPersonalityTitle').textContent = timeAnalysis.title;
  document.getElementById('wPersonalityDesc').textContent = timeAnalysis.desc;
  
  const breakdown = document.getElementById('wTimeBreakdown');
  breakdown.innerHTML = `
    <div class="time-item">
      <span class="time-period">朝</span>
      <span class="time-percent">${timeAnalysis.morning}%</span>
    </div>
    <div class="time-item">
      <span class="time-period">昼</span>
      <span class="time-percent">${timeAnalysis.afternoon}%</span>
    </div>
    <div class="time-item">
      <span class="time-period">夜</span>
      <span class="time-percent">${timeAnalysis.evening}%</span>
    </div>
    <div class="time-item">
      <span class="time-period">深夜</span>
      <span class="time-percent">${timeAnalysis.night}%</span>
    </div>
  `;
  
  // カード5: 連続日数
  const streakNumber = document.querySelector('#wMaxStreak .number');
  streakNumber.dataset.target = maxStreak;
  streakNumber.textContent = '0';
  document.getElementById('wCurrentStreak').textContent = `現在の連続: ${currentStreak}日`;
  
  // カード6: アクティビティ統計
  document.getElementById('wActiveDays').textContent = uniqueDays;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const daysPassed = getDayOfYear(new Date());
  document.getElementById('wActivePercent').textContent = Math.round((uniqueDays / daysPassed) * 100);
  
  // カード7: まとめ
  document.getElementById('wSumDays').textContent = `${uniqueDays}日`;
  document.getElementById('wSumLaunches').textContent = `${totalLaunches}回`;
  document.getElementById('wSumTime').textContent = totalMinutes >= 60 ? 
    `${Math.floor(totalMinutes / 60)}時間` : `${totalMinutes}分`;
  document.getElementById('wSumStreak').textContent = `${maxStreak}日`;
}

// 時間帯分析
function analyzeTimeOfDay(launches) {
  const total = launches.length;
  if (total === 0) {
    return { icon: '❓', title: 'データ不足', desc: '', morning: 0, afternoon: 0, evening: 0, night: 0 };
  }
  
  const morning = launches.filter(l => l.hour >= 5 && l.hour < 11).length;
  const afternoon = launches.filter(l => l.hour >= 11 && l.hour < 17).length;
  const evening = launches.filter(l => l.hour >= 17 && l.hour < 23).length;
  const night = launches.filter(l => l.hour >= 23 || l.hour < 5).length;
  
  const percentages = {
    morning: Math.round(morning / total * 100),
    afternoon: Math.round(afternoon / total * 100),
    evening: Math.round(evening / total * 100),
    night: Math.round(night / total * 100)
  };
  
  const max = Math.max(morning, afternoon, evening, night);
  
  let result = { ...percentages };
  
  if (max === morning) {
    result.icon = '🌅';
    result.title = 'アーリーバード型';
    result.desc = '朝の時間を活用するタイプ';
  } else if (max === afternoon) {
    result.icon = '☀️';
    result.title = 'デイタイム型';
    result.desc = '日中にアクティブなタイプ';
  } else if (max === evening) {
    result.icon = '🌆';
    result.title = 'イブニング型';
    result.desc = '夕方〜夜にアクティブなタイプ';
  } else {
    result.icon = '🦉';
    result.title = 'ナイトオウル型';
    result.desc = '深夜に活動するタイプ';
  }
  
  return result;
}

// ミニカレンダー描画
// 最大連続日数計算
function calculateMaxStreak(sortedDates) {
  if (sortedDates.length === 0) return 0;
  if (sortedDates.length === 1) return 1;
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    const prev = new Date(sortedDates[i - 1]);
    const diffDays = (current - prev) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}

// 現在の連続日数計算
function calculateCurrentStreak(sortedDates) {
  if (sortedDates.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const lastDate = sortedDates[sortedDates.length - 1];
  if (lastDate !== todayStr && lastDate !== yesterdayStr) {
    return 0;
  }
  
  let streak = 1;
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const current = new Date(sortedDates[i + 1]);
    const prev = new Date(sortedDates[i]);
    const diffDays = (current - prev) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// バッジ決定
function determineBadge(days, launches, streak) {
  if (days >= 300) {
    return { icon: '👑', text: '年間マスター' };
  } else if (streak >= 30) {
    return { icon: '🔥', text: '継続の達人' };
  } else if (launches >= 500) {
    return { icon: '🚀', text: 'ヘビーユーザー' };
  } else if (days >= 100) {
    return { icon: '⭐', text: '常連ユーザー' };
  } else if (days >= 30) {
    return { icon: '🌟', text: '成長中' };
  } else {
    return { icon: '🌱', text: 'ルーキー' };
  }
}

// ユーティリティ
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
