export interface UserProgress {
  grammar: Record<string, Partial<any>>;
  vocabulary: any[];
  sessions: any[];
  lastUpdated: string;
}

export function exportProgress(): string {
  const grammar = localStorage.getItem('nihongo-master-grammar-srs');
  const vocab = localStorage.getItem('nihongo-master-vocabulary');
  const sessions = localStorage.getItem('nihongo-master-sessions');
  
  const data: UserProgress = {
    grammar: grammar ? JSON.parse(grammar) : {},
    vocabulary: vocab ? JSON.parse(vocab) : [],
    sessions: sessions ? JSON.parse(sessions) : [],
    lastUpdated: new Date().toISOString()
  };
  
  return JSON.stringify(data, null, 2);
}

export function importProgress(jsonString: string): boolean {
  try {
    const data: UserProgress = JSON.parse(jsonString);
    if (data.grammar) localStorage.setItem('nihongo-master-grammar-srs', JSON.stringify(data.grammar));
    if (data.vocabulary) localStorage.setItem('nihongo-master-vocabulary', JSON.stringify(data.vocabulary));
    if (data.sessions) localStorage.setItem('nihongo-master-sessions', JSON.stringify(data.sessions));
    return true;
  } catch (e) {
    console.error('Failed to import progress:', e);
    return false;
  }
}

export function downloadProgressAsFile() {
  const data = exportProgress();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nihongo-master-progress-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
