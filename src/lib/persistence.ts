const LOCAL_KEY = 'apex-applications-v1';
const ID_KEY = 'apex-next-id';

let supabase: any = null;

export function getNextId(): number {
  const current = parseInt(localStorage.getItem(ID_KEY) || '1');
  localStorage.setItem(ID_KEY, (current + 1).toString());
  return current;
}

export async function initSupabase(url?: string, anonKey?: string) {
  if (!url || !anonKey) return null;
  try {
  // dynamic import via eval so bundlers don't try to statically resolve the module
  // user can opt-in by providing VITE_SUPABASE_* env vars and installing the package
  // eslint-disable-next-line no-eval
  const mod = await eval("import('@supabase/supabase-js')");
    const createClient = mod.createClient;
    supabase = createClient(url, anonKey);
    return supabase;
  } catch (e) {
    console.warn('Supabase init failed', e);
    supabase = null;
    return null;
  }
}

export function loadFromLocal<T>(): T | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('Failed to parse localStorage data', e);
    return null;
  }
}

export function saveToLocal<T>(data: T) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write applications to localStorage', e);
  }
}

export async function syncToSupabase(table: string, rows: any[]) {
  if (!supabase) return null;
  try {
    // naive strategy: upsert all rows by primary key 'app_id'
    const { data, error } = await supabase.from(table).upsert(rows, { onConflict: 'app_id' });
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Supabase sync failed', e);
    return null;
  }
}

export function getSupabaseClient() {
  return supabase;
}
