/**
 * Recap Tracker - 利用データ自動記録システム
 * localStorageにデータを保存、サーバー送信なし
 */

const RecapTracker = {
  // ストレージキー
  STORAGE_KEY: 'recap_data',
  
  // セッション開始時刻
  sessionStart: null,
  
  // データ構造の初期化
  getDefaultData() {
    return {
      // PWA起動記録
      launches: [], // { date: 'YYYY-MM-DD', time: 'HH:MM', timestamp: number }
      
      // 滞在時間記録
      sessions: [], // { date: 'YYYY-MM-DD', duration: seconds, startTime: 'HH:MM' }
      
      // 初回利用日
      firstUse: null,
      
      // 最終更新
      lastUpdated: null
    };
  },
  
  // データ読み込み
  loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('データ読み込みエラー:', e);
    }
    return this.getDefaultData();
  },
  
  // データ保存
  saveData(data) {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('データ保存エラー:', e);
    }
  },
  
  // 現在の日付文字列を取得
  getDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
  },
  
  // 現在の時刻文字列を取得
  getTimeString(date = new Date()) {
    return date.toTimeString().slice(0, 5);
  },
  
  // 時間帯を取得（0-23）
  getHour(date = new Date()) {
    return date.getHours();
  },
  
  // 起動を記録
  recordLaunch() {
    const now = new Date();
    const data = this.loadData();
    
    // 初回利用日を記録
    if (!data.firstUse) {
      data.firstUse = now.toISOString();
    }
    
    // 起動記録を追加
    data.launches.push({
      date: this.getDateString(now),
      time: this.getTimeString(now),
      hour: this.getHour(now),
      timestamp: now.getTime()
    });
    
    // 古いデータを削除（365日以上前）
    const oneYearAgo = now.getTime() - (365 * 24 * 60 * 60 * 1000);
    data.launches = data.launches.filter(l => l.timestamp > oneYearAgo);
    
    this.saveData(data);
    this.sessionStart = now.getTime();
    
    console.log('📱 起動を記録しました:', this.getDateString(now), this.getTimeString(now));
  },
  
  // 滞在時間を記録
  recordSession() {
    if (!this.sessionStart) return;
    
    const now = new Date();
    const duration = Math.round((now.getTime() - this.sessionStart) / 1000);
    
    // 最小1秒、最大24時間
    if (duration < 1 || duration > 86400) return;
    
    const data = this.loadData();
    const sessionDate = new Date(this.sessionStart);
    
    data.sessions.push({
      date: this.getDateString(sessionDate),
      startTime: this.getTimeString(sessionDate),
      startHour: this.getHour(sessionDate),
      duration: duration,
      timestamp: this.sessionStart
    });
    
    // 古いデータを削除（365日以上前）
    const oneYearAgo = now.getTime() - (365 * 24 * 60 * 60 * 1000);
    data.sessions = data.sessions.filter(s => s.timestamp > oneYearAgo);
    
    this.saveData(data);
    
    console.log('⏱️ 滞在時間を記録しました:', duration, '秒');
  },
  
  // データをリセット
  resetData() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.sessionStart = null;
    console.log('🗑️ データをリセットしました');
  },
  
  // 初期化
  init() {
    // 起動を記録
    this.recordLaunch();
    
    // ページ離脱時に滞在時間を記録
    window.addEventListener('beforeunload', () => {
      this.recordSession();
    });
    
    // visibilitychange でも記録（モバイル対応）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.recordSession();
      } else if (document.visibilityState === 'visible') {
        // 再表示時は新しいセッションとして扱う
        this.sessionStart = Date.now();
      }
    });
    
    // pagehide イベント（iOS Safari対応）
    window.addEventListener('pagehide', () => {
      this.recordSession();
    });
    
    console.log('✅ Recap Tracker 初期化完了');
  }
};

// ページ読み込み時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => RecapTracker.init());
} else {
  RecapTracker.init();
}
