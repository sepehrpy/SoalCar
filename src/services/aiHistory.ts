export interface AiHistoryMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; uri: string }>;
}

export interface AiSessionHistoryItem {
  id: string;
  type: 'chat' | 'diagnosis';
  title: string;
  carBrand?: string;
  carModel?: string;
  carYear?: string;
  symptoms?: string;
  messages?: AiHistoryMessage[];
  diagnosisResult?: {
    text: string;
    sources?: Array<{ title: string; uri: string }>;
  };
  createdAt: string;
}

const STORAGE_KEY = 'soalcar_ai_history_v2';

export function getAiHistory(): AiSessionHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse AI history from localStorage', e);
    return [];
  }
}

export function saveAiSession(item: AiSessionHistoryItem): AiSessionHistoryItem[] {
  const current = getAiHistory();
  const existingIndex = current.findIndex((i) => i.id === item.id);
  if (existingIndex >= 0) {
    current[existingIndex] = item;
  } else {
    current.unshift(item);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
}

export function deleteAiSession(id: string): AiSessionHistoryItem[] {
  const current = getAiHistory().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
}

export function clearAllAiHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
