import { tryFetch } from './cartService';

export async function getUsers() {
  const data = await tryFetch('/api/users');
  if (!data) return [];
  const raw = Array.isArray(data.userIds) ? data.userIds : Array.isArray(data.users) ? data.users : [];
  const seen = new Set();
  const unique = [];
  for (const u of raw) {
    if (!u) continue;
    const name = typeof u === 'string' ? u : u.name || u.id;
    const key = String(name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ id: name, name });
  }
  return unique;
}