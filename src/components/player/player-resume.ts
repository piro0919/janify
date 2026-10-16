import type { QueueItem } from '@/lib/catalog';

/**
 * 読み込み直したり開き直したりしたときに、前に流していた曲を止まった状態で戻すための控え（Vocafy から移した）。
 * 並び・何曲目か・流す順・どこまで聴いたか・並びの種類を、このブラウザの localStorage に残す。
 * 最後に聴いてから RESUME_HOURS 時間を過ぎたものは戻さない（久しぶりに開いたときに、前の曲が居座らないように）
 */
const KEY = 'janify-resume';
const RESUME_HOURS = 12;
const HOUR_MS = 60 * 60 * 1000;

/** 並びの種類。player-provider.tsx の PlayContext と同じ */
type ResumeContext = 'album' | 'favorites' | 'pending';

export type Resume = {
  queue: QueueItem[];
  index: number;
  order: number[];
  /** その曲のどこまで聴いたか（秒）と、曲の長さ */
  position: number;
  duration: number;
  context: ResumeContext;
  /** 残した時刻（Date.now()） */
  at: number;
};

export function saveResume(resume: Omit<Resume, 'at'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...resume, at: Date.now() }));
  } catch {
    // 残せない窓では戻さない
  }
}

export function clearResume() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 残せない窓では何もしない
  }
}

const isQueueItem = (value: unknown): value is QueueItem => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return ['title', 'videoId', 'albumId', 'albumTitle', 'artistId', 'artistName'].every(
    (k) => typeof v[k] === 'string',
  );
};

/** 戻せる控え。無いか、古いか、形が合わないか、設定で切っていれば null */
export function readResume(): Resume | null {
  if (!resumeEnabled()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as Resume;
    if (Date.now() - r.at > RESUME_HOURS * HOUR_MS) return null;
    if (!Array.isArray(r.queue) || !r.queue.every(isQueueItem) || !r.queue[r.index]) return null;
    if (!Array.isArray(r.order) || r.order.length !== r.queue.length) return null;
    // 一曲だけ流してアルバムの画面に着く途中（pending）のまま残ったものは、アルバムの曲目として戻す
    if (r.context !== 'favorites') r.context = 'album';
    return r;
  } catch {
    return null;
  }
}

/**
 * 設定の「前回の続きから始める」。はじめはオンで、切ったときだけ OFF_KEY を残す
 * （スマホのブラウザは裏に回したタブを捨てて読み込み直すので、オフが既定だと聴いていた曲が消える。多くの人は設定を開かない）
 */
const OFF_KEY = 'janify-resume-off';
const CHANGE_EVENT = 'janify-resume-change';

export function resumeEnabled(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) !== '1';
  } catch {
    return true;
  }
}

export function setResumeEnabled(on: boolean): void {
  try {
    if (on) localStorage.removeItem(OFF_KEY);
    else {
      localStorage.setItem(OFF_KEY, '1');
      localStorage.removeItem(KEY);
    }
  } catch {
    // 保存できないときは、この画面のあいだだけ効く
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** useSyncExternalStore 用。設定が切り替わったら知らせる */
export function subscribeResume(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}
