import { seedState } from './seed';
import type { AccessRequest, AppState, Material, MaterialCopy, RequestStatus, Role, User } from '../types';

export const STORAGE_KEY = 'library-demo:v1';
export const SESSION_KEY = 'library-demo:session';
export const PASSWORD = 'P4ssword@123';
const managers: Role[] = ['superadmin', 'committee', 'itadmin'];
const levels: Record<Role, number> = { student: 1, faculty: 2, custodian: 2, committee: 3, itadmin: 3, superadmin: 3 };

export const canManage = (role: Role) => managers.includes(role);
export const canReview = (role: Role, format?: AccessRequest['format']) => canManage(role) || (role === 'custodian' && format === 'physical');
export const canAccess = (user: User, material: Material) => levels[user.role] >= material.accessLevel;

export function loadState(): AppState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as AppState | null;
    if (parsed?.version === 1 && Array.isArray(parsed.materials) && Array.isArray(parsed.requests)) return parsed;
  } catch { /* stale or corrupt data is reseeded */ }
  return resetState();
}
export function saveState(state: AppState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
export function resetState() { const state = seedState(); saveState(state); return state; }
export function getSession() { return sessionStorage.getItem(SESSION_KEY); }
export function authenticate(email: string, password: string) {
  if (password !== PASSWORD) return null;
  const user = loadState().users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.active) || null;
  if (user) sessionStorage.setItem(SESSION_KEY, user.id);
  return user;
}
export function logout() { sessionStorage.removeItem(SESSION_KEY); }

const stamp = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
function audit(state: AppState, actorId: string, action: string, detail: string) {
  state.audit.unshift({ id: id('audit'), actorId, action, detail, createdAt: stamp() });
}
function notify(state: AppState, userId: string, message: string) {
  state.notifications.unshift({ id: id('note'), userId, message, read: false, createdAt: stamp() });
}

export function createRequest(state: AppState, actor: User, materialId: string, format: AccessRequest['format']) {
  const material = state.materials.find((item) => item.id === materialId);
  if (!material || !canAccess(actor, material)) throw new Error('You do not have access to this material.');
  if (state.requests.some((request) => request.userId === actor.id && request.materialId === materialId && ['pending', 'approved'].includes(request.status))) throw new Error('You already have an active request for this material.');
  const copy = state.copies.find((item) => item.materialId === materialId && item.format === format && item.available);
  if (!copy) throw new Error(`No ${format} copy is currently available.`);
  const request: AccessRequest = { id: id('req'), userId: actor.id, materialId, copyId: copy.id, format, status: 'pending', requestedAt: stamp() };
  state.requests.unshift(request); audit(state, actor.id, 'request.created', `${actor.name} requested ${format} access to ${material.title}`); saveState(state); return request;
}
export function transitionRequest(state: AppState, actor: User, requestId: string, next: RequestStatus, note?: string) {
  const request = state.requests.find((item) => item.id === requestId); if (!request) throw new Error('Request not found.');
  const allowed = (request.status === 'pending' && ['approved', 'rejected'].includes(next) && canReview(actor.role, request.format)) ||
    (request.status === 'pending' && next === 'cancelled' && request.userId === actor.id) ||
    (request.status === 'approved' && next === 'returned' && request.format === 'physical' && canReview(actor.role, 'physical'));
  if (!allowed) throw new Error('This transition is not permitted.');
  request.status = next; request.note = note; request.decidedAt = stamp();
  const copy = state.copies.find((item) => item.id === request.copyId);
  if (copy && request.format === 'physical' && next === 'approved') copy.available = false;
  if (copy && request.format === 'physical' && next === 'returned') copy.available = true;
  const material = state.materials.find((item) => item.id === request.materialId)!;
  audit(state, actor.id, `request.${next}`, `${material.title} request marked ${next}`);
  notify(state, request.userId, `Your ${material.title} request was ${next}.`); saveState(state); return request;
}
export function addMaterial(state: AppState, actor: User, data: Omit<Material, 'id'>) {
  if (!canManage(actor.role)) throw new Error('Not permitted.');
  const material = { ...data, id: id('mat') }; state.materials.unshift(material); audit(state, actor.id, 'material.created', `Created ${material.title}`); saveState(state); return material;
}
export function addCopy(state: AppState, actor: User, materialId: string, format: MaterialCopy['format'], label: string) {
  if (!canManage(actor.role) && !(actor.role === 'custodian' && format === 'physical')) throw new Error('Not permitted.');
  const copy = { id: id('copy'), materialId, format, label, available: true }; state.copies.push(copy); audit(state, actor.id, 'copy.created', `Added ${format} copy ${label}`); saveState(state); return copy;
}
