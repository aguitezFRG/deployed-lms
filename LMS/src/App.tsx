import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { BarChart3, Bell, BookOpen, ChevronLeft, ChevronRight, ClipboardList, Eye, EyeOff, FileClock, LayoutDashboard, LogOut, Menu, PackagePlus, RotateCcw, Search, UserRound, Users, X } from 'lucide-react';
import type { AccessRequest, AppState, Material, RequestStatus, Role, User } from './types';
import { addCopy, addMaterial, authenticate, canAccess, canManage, canReview, createRequest, getSession, loadState, logout, resetState, saveState, transitionRequest } from './lib/repository';
import { Badge, Empty, Modal, PageHeader, Tabs } from './components/ui';

type DemoContext = { state: AppState; user: User | null; refresh: () => void; setUser: (user: User | null) => void };
const Demo = createContext<DemoContext>(null!);
const useDemo = () => useContext(Demo);
const roleNames: Record<Role, string> = { superadmin: 'Super Admin', committee: 'Committee', itadmin: 'IT Admin', custodian: 'Custodian', faculty: 'Faculty', student: 'Student' };
const statusTone: Record<RequestStatus, string> = { pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'neutral', returned: 'info' };
const initials = (name = '') => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();

export default function App() {
    const [state, setState] = useState(loadState);
    const [user, setUser] = useState<User | null>(() => state.users.find(item => item.id === getSession()) || null);
    const refresh = () => setState({ ...loadState() });
    return <Demo.Provider value={{ state, user, refresh, setUser }}><Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route element={<Guard><Shell /></Guard>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:id" element={<MaterialDetail />} />
            <Route path="/materials" element={<RoleGuard roles={['superadmin', 'committee', 'itadmin', 'custodian']}><Materials /></RoleGuard>} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/users" element={<RoleGuard roles={['superadmin', 'committee', 'itadmin']}><UsersPage /></RoleGuard>} />
            <Route path="/audit-logs" element={<RoleGuard roles={['superadmin', 'committee', 'itadmin']}><AuditLogs /></RoleGuard>} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/analytics" element={<RoleGuard roles={['superadmin', 'committee', 'itadmin']}><Analytics /></RoleGuard>} />
            <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
    </Routes></Demo.Provider>;
}

function Guard({ children }: { children: ReactNode }) { return useDemo().user ? children : <Navigate to="/login" replace />; }
function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) { const { user } = useDemo(); return user && roles.includes(user.role) ? children : <Navigate to="/dashboard" replace />; }

function Login() {
    const { state, setUser } = useDemo(); const nav = useNavigate();
    const [email, setEmail] = useState('student@library.demo'); const [password, setPassword] = useState('P4ssword@123');
    const [error, setError] = useState(''); const [showPassword, setShowPassword] = useState(false); const [showAccounts, setShowAccounts] = useState(false);
    function submit(event: FormEvent) { event.preventDefault(); const found = authenticate(email, password); if (!found) return setError('Email or password is incorrect.'); setUser(found); nav('/dashboard'); }
    function selectAccount(user: User) { setEmail(user.email); setPassword('P4ssword@123'); setError(''); setShowAccounts(false); }
    return <main className="login-page"><form onSubmit={submit} className="login-card">
        <div className="login-brand">LMS Demo</div><h1>Sign in</h1><p>Enter a seeded demo account to continue.</p>
        {error && <div role="alert" className="alert-danger">{error}</div>}
        <label>Email address<input aria-label="Email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Password<span className="password-field"><input aria-label="Password" className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
        <button className="btn-primary full">Sign in</button><button type="button" className="text-button" onClick={() => setShowAccounts(true)}>View other users</button>
        <p className="login-hint">All content and changes stay in this browser.</p>
    </form><Modal open={showAccounts} onClose={() => setShowAccounts(false)} title="Choose a demo user"><p className="muted">Select a role to fill the login fields.</p><div className="account-grid">{state.users.map(user => <button type="button" key={user.id} onClick={() => selectAccount(user)}><strong>{roleNames[user.role]}</strong><span>{user.email}</span></button>)}</div></Modal></main>;
}

function Shell() {
    const { state, user, setUser, refresh } = useDemo(); const nav = useNavigate();
    const [drawer, setDrawer] = useState(false); const [collapsed, setCollapsed] = useState(false); const [account, setAccount] = useState(false); const [bell, setBell] = useState(false);
    const notes = state.notifications.filter(item => item.userId === user!.id); const unread = notes.filter(item => !item.read).length;
    const items = [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { to: '/catalog', label: 'Catalog', icon: BookOpen }, { to: '/requests', label: 'Requests', icon: ClipboardList }, { to: '/notifications', label: 'Notifications', icon: Bell }];
    if (['superadmin', 'committee', 'itadmin', 'custodian'].includes(user!.role)) items.splice(2, 0, { to: '/materials', label: 'Materials', icon: PackagePlus });
    if (canManage(user!.role)) items.push({ to: '/users', label: 'Users', icon: Users }, { to: '/audit-logs', label: 'Audit logs', icon: FileClock }, { to: '/analytics', label: 'Analytics', icon: BarChart3 });
    function markAll() { notes.forEach(item => item.read = true); saveState(state); refresh(); }
    function signOut() { logout(); setUser(null); }
    function reset() { if (window.confirm('Reset all browser demo data?')) { resetState(); refresh(); nav('/dashboard'); } }
    return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu /></button><NavLink to="/dashboard" className="top-brand">LMS Demo</NavLink><div className="top-actions">
            <div className="popover-wrap"><button className="icon-button" aria-label="Notifications" aria-expanded={bell} onClick={() => { setBell(!bell); setAccount(false); }}><Bell />{unread > 0 && <span className="notification-count">{unread}</span>}</button>{bell && <div className="popover notifications-popover"><div className="popover-title"><strong>Notifications</strong><button onClick={markAll}>Mark all as read</button></div>{notes.slice(0, 4).map(note => <div className={`popover-note ${note.read ? '' : 'unread'}`} key={note.id}><p>{note.message}</p><time>{new Date(note.createdAt).toLocaleDateString()}</time></div>)}<NavLink to="/notifications" onClick={() => setBell(false)} className="popover-link">View all notifications</NavLink></div>}</div>
            <div className="popover-wrap"><button className="avatar" aria-label="Open account menu" aria-expanded={account} onClick={() => { setAccount(!account); setBell(false); }}>{initials(user!.name)}</button>{account && <div className="popover account-popover"><div><strong>{user!.name}</strong><span>{roleNames[user!.role]}</span></div><NavLink to="/profile" onClick={() => setAccount(false)}><UserRound />Profile</NavLink><button onClick={signOut}><LogOut />Sign out</button></div>}</div>
        </div></header>
        {drawer && <button className="drawer-backdrop" aria-label="Close menu overlay" onClick={() => setDrawer(false)} />}
        <aside className={`sidebar ${drawer ? 'drawer-open' : ''}`}><div className="sidebar-brand"><span>LMS Demo</span><button className="icon-button desktop-collapse" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight /> : <ChevronLeft />}</button><button className="icon-button drawer-close" aria-label="Close menu" onClick={() => setDrawer(false)}><X /></button></div><nav>{items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} title={collapsed ? label : undefined} onClick={() => setDrawer(false)}><Icon /><span>{label}</span></NavLink>)}</nav><div className="sidebar-footer"><button title="Reset demo data" onClick={reset}><RotateCcw /><span>Reset demo data</span></button></div></aside>
        <main className="content"><Outlet /></main>
    </div>;
}

const Stat = ({ label, value, hint }: { label: string; value: number; hint?: string }) => <div className="stat-card"><p>{label}</p><strong>{value}</strong><span>{hint || 'Current browser data'}</span></div>;

function Dashboard() {
    const { state, user } = useDemo(); const [tab, setTab] = useState('general');
    const mine = state.requests.filter(r => r.userId === user!.id); const staff = canReview(user!.role); const visible = state.materials.filter(m => canAccess(user!, m));
    const borrow = state.requests.filter(r => r.format === 'physical'); const access = state.requests.filter(r => r.format === 'digital');
    if (!staff) return <><PageHeader title="Dashboard" detail={`Welcome, ${user!.name}. Here is your library workspace.`} /><section className="welcome-panel"><Badge tone="success">Account ready</Badge><h2>Start exploring the LMS Demo</h2><p>Browse accessible materials, submit requests, and track decisions from one place.</p><div className="capability-grid"><NavLink to="/catalog"><BookOpen /><strong>Browse the catalog</strong><span>{visible.length} titles available to you</span></NavLink><NavLink to="/requests"><ClipboardList /><strong>Track requests</strong><span>{mine.filter(r => r.status === 'pending').length} awaiting review</span></NavLink><NavLink to="/notifications"><Bell /><strong>Review updates</strong><span>{state.notifications.filter(n => n.userId === user!.id && !n.read).length} unread notifications</span></NavLink></div></section><section className="section-card"><div className="section-heading"><h2>Request summary</h2><NavLink to="/requests">View all</NavLink></div><div className="stats-grid three"><Stat label="Pending" value={mine.filter(r => r.status === 'pending').length} /><Stat label="Approved" value={mine.filter(r => r.status === 'approved').length} /><Stat label="Completed" value={mine.filter(r => ['returned', 'cancelled', 'rejected'].includes(r.status)).length} /></div></section></>;
    const selected = tab === 'borrow' ? borrow : tab === 'access' ? access : state.requests;
    return <><PageHeader title="Dashboard" detail={`Welcome back, ${user!.name}.`} /><Tabs value={tab} onChange={setTab} items={[{ value: 'general', label: 'General' }, { value: 'borrow', label: 'Borrow Requests', count: borrow.filter(r => r.status === 'pending').length }, { value: 'access', label: 'Access Requests', count: access.filter(r => r.status === 'pending').length }]} /><div className="stats-grid"><Stat label="Catalog titles" value={state.materials.length} /><Stat label="Pending review" value={selected.filter(r => r.status === 'pending').length} /><Stat label="Approved" value={selected.filter(r => r.status === 'approved').length} /><Stat label="Active users" value={state.users.filter(u => u.active).length} /></div><RequestTable requests={selected.slice(0, 6)} readOnly /></>;
}

function Catalog() {
    const { state, user } = useDemo(); const [query, setQuery] = useState(''); const [format, setFormat] = useState('all');
    const list = state.materials.filter(m => canAccess(user!, m)).filter(m => `${m.title} ${m.author} ${m.category} ${m.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase())).filter(m => format === 'all' || state.copies.some(c => c.materialId === m.id && c.format === format));
    return <><PageHeader title="Material Catalog" detail="Browse titles available for your access level." /><div className="toolbar"><label className="search"><Search /><input aria-label="Search catalog" placeholder="Search title, author, or keyword" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="Format" value={format} onChange={e => setFormat(e.target.value)}><option value="all">All formats</option><option value="physical">Physical</option><option value="digital">Digital</option></select></div><p className="result-count">Showing {list.length} materials</p>{list.length ? <div className="catalog-grid">{list.map(m => <MaterialCard key={m.id} material={m} />)}</div> : <Empty>No materials match those filters.</Empty>}</>;
}

function MaterialCard({ material }: { material: Material }) {
    const { state } = useDemo(); const copies = state.copies.filter(c => c.materialId === material.id); const formats = [...new Set(copies.map(c => c.format))];
    return <article className="material-card"><div><Badge tone={copies.some(c => c.available) ? 'success' : 'neutral'}>{copies.some(c => c.available) ? 'Available' : 'Unavailable'}</Badge><span className="material-year">{material.year}</span></div><h2><NavLink to={`/catalog/${material.id}`}>{material.title}</NavLink></h2><p className="material-author">{material.author}</p><p>{material.description}</p><div className="material-meta">{formats.map(f => <Badge key={f} tone="info">{f}</Badge>)}<Badge>{material.category}</Badge></div><NavLink className="card-link" to={`/catalog/${material.id}`}>View material</NavLink></article>;
}

function MaterialDetail() {
    const { id } = useParams(); const { state, user, refresh } = useDemo(); const material = state.materials.find(m => m.id === id); const [message, setMessage] = useState(''); const [format, setFormat] = useState<'physical' | 'digital' | null>(null);
    if (!material || !canAccess(user!, material)) return <Empty>Material not found.</Empty>; const copies = state.copies.filter(c => c.materialId === material.id);
    function submit() { if (!format) return; try { createRequest(state, user!, material!.id, format); refresh(); setMessage('Request submitted for review.'); } catch (e) { setMessage((e as Error).message); } setFormat(null); }
    return <><PageHeader parent="Material Catalog" title={material.title} detail={`${material.author} · ${material.year}`} action={<div className="button-row">{(['digital', 'physical'] as const).map(item => <button key={item} disabled={!copies.some(c => c.format === item && c.available)} onClick={() => setFormat(item)} className="btn-primary">{item === 'physical' ? 'Borrow physical copy' : 'Request digital copy'}</button>)}</div>} />{message && <div role="status" className="alert-info">{message}</div>}<section className="detail-card"><div><h2>Material overview</h2><p>{material.description}</p></div><dl><div><dt>Category</dt><dd>{material.category}</dd></div><div><dt>Access level</dt><dd>Level {material.accessLevel}</dd></div><div><dt>Available formats</dt><dd>{copies.filter(c => c.available).map(c => c.format).join(', ')}</dd></div><div><dt>Keywords</dt><dd>{material.keywords.join(', ')}</dd></div></dl></section><Modal open={format !== null} onClose={() => setFormat(null)} title={format === 'physical' ? 'Confirm borrowing request' : 'Confirm digital access request'} footer={<><button className="btn-secondary" onClick={() => setFormat(null)}>Cancel</button><button className="btn-primary" onClick={submit}>Submit request</button></>}><p>Submit a {format} request for <strong>{material.title}</strong>? Staff will review it before access is granted.</p></Modal></>;
}

function RequestTable({ requests, readOnly = false, onAction }: { requests: AccessRequest[]; readOnly?: boolean; onAction?: (request: AccessRequest, next: RequestStatus) => void }) {
    const { state, user } = useDemo();
    if (!requests.length) return <Empty>There are no requests to show.</Empty>;
    return <div className="table-card"><table><thead><tr><th>Material</th><th>Requester</th><th>Format</th><th>Requested</th><th>Status</th>{!readOnly && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{requests.map(r => { const material = state.materials.find(m => m.id === r.materialId); const owner = state.users.find(u => u.id === r.userId); return <tr key={r.id}><td><strong>{material?.title}</strong>{r.note && <small>Reason: {r.note}</small>}</td><td>{owner?.name}</td><td><Badge tone="info">{r.format}</Badge></td><td>{new Date(r.requestedAt).toLocaleDateString()}</td><td><Badge tone={statusTone[r.status]}>{r.status}</Badge></td>{!readOnly && <td><div className="row-actions">{r.status === 'pending' && canReview(user!.role, r.format) && <><button aria-label={`Approve ${material?.title}`} className="btn-primary small" onClick={() => onAction?.(r, 'approved')}>Approve</button><button aria-label={`Reject ${material?.title}`} className="btn-danger small" onClick={() => onAction?.(r, 'rejected')}>Reject</button></>}{r.status === 'pending' && r.userId === user!.id && !canReview(user!.role, r.format) && <button className="btn-secondary small" onClick={() => onAction?.(r, 'cancelled')}>Cancel</button>}{r.status === 'approved' && r.format === 'physical' && canReview(user!.role, 'physical') && <button aria-label={`Return ${material?.title}`} className="btn-secondary small" onClick={() => onAction?.(r, 'returned')}>Mark returned</button>}</div></td>}</tr>; })}</tbody></table></div>;
}

function Requests() {
    const { state, user, refresh } = useDemo(); const [status, setStatus] = useState('all'); const [pending, setPending] = useState<{ request: AccessRequest; next: RequestStatus } | null>(null); const [note, setNote] = useState('');
    const all = canReview(user!.role) ? state.requests.filter(r => canReview(user!.role, r.format)) : state.requests.filter(r => r.userId === user!.id); const requests = status === 'all' ? all : all.filter(r => r.status === status);
    function confirm() { if (!pending) return; try { transitionRequest(state, user!, pending.request.id, pending.next, pending.next === 'rejected' ? note.trim() : undefined); refresh(); } catch (e) { window.alert((e as Error).message); } setPending(null); setNote(''); }
    const actionName = pending ? (pending.next === 'returned' ? 'Mark as returned' : pending.next[0].toUpperCase() + pending.next.slice(1)) : 'Update';
    return <><PageHeader title="Requests" detail={canReview(user!.role) ? 'Review access and borrowing activity.' : 'Track your material requests.'} /><Tabs value={status} onChange={setStatus} items={['all', 'pending', 'approved', 'rejected', 'cancelled', 'returned'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1), count: value === 'all' ? all.length : all.filter(r => r.status === value).length }))} /><RequestTable requests={requests} onAction={(request, next) => setPending({ request, next })} /><Modal open={pending !== null} onClose={() => { setPending(null); setNote(''); }} title={`${actionName} request`} footer={<><button className="btn-secondary" onClick={() => setPending(null)}>Keep request</button><button className={pending?.next === 'rejected' ? 'btn-danger' : 'btn-primary'} onClick={confirm} disabled={pending?.next === 'rejected' && !note.trim()}>Confirm {pending?.next}</button></>}>{pending?.next === 'rejected' ? <label>Reason for rejection<textarea aria-label="Reason for rejection" className="input" rows={4} value={note} onChange={e => setNote(e.target.value)} required /></label> : <p>Confirm this request status change. This action will notify the requester.</p>}</Modal></>;
}

function Materials() {
    const { state, user, refresh } = useDemo(); const [show, setShow] = useState(false); const [title, setTitle] = useState(''); const [query, setQuery] = useState('');
    function submit(e: FormEvent) { e.preventDefault(); addMaterial(state, user!, { title, author: 'Demo Author', year: new Date().getFullYear(), category: 'General', description: 'A newly added catalog material.', accessLevel: 1, keywords: [] }); refresh(); setTitle(''); setShow(false); }
    const materials = state.materials.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    return <><PageHeader title="Materials" detail="Manage catalog records and tracked copies." action={canManage(user!.role) && <button className="btn-primary" onClick={() => setShow(true)}>Add material</button>} /><div className="toolbar"><label className="search"><Search /><input aria-label="Search materials" placeholder="Search materials" value={query} onChange={e => setQuery(e.target.value)} /></label></div><div className="table-card"><table><thead><tr><th>Title</th><th>Author</th><th>Access</th><th>Copies</th><th></th></tr></thead><tbody>{materials.map(m => <tr key={m.id}><td><strong>{m.title}</strong></td><td>{m.author}</td><td><Badge>Level {m.accessLevel}</Badge></td><td>{state.copies.filter(c => c.materialId === m.id).length}</td><td><button className="btn-secondary small" onClick={() => { addCopy(state, user!, m.id, 'physical', 'New shelf copy'); refresh(); }}>Add copy</button></td></tr>)}</tbody></table></div><Modal open={show} onClose={() => setShow(false)} title="Add material"><form id="material-form" onSubmit={submit}><label>Title<input aria-label="Material title" className="input" value={title} onChange={e => setTitle(e.target.value)} required /></label><button className="btn-primary form-submit">Save material</button></form></Modal></>;
}

function UsersPage() {
    const { state, user, refresh } = useDemo(); const [query, setQuery] = useState(''); const users = state.users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()));
    function toggle(target: User) { if (target.id === user!.id) return; target.active = !target.active; state.audit.unshift({ id: `audit-${Date.now()}`, actorId: user!.id, action: 'user.status', detail: `${target.name} marked ${target.active ? 'active' : 'inactive'}`, createdAt: new Date().toISOString() }); saveState(state); refresh(); }
    return <><PageHeader title="Users" detail="Review demo accounts and account status." /><div className="toolbar"><label className="search"><Search /><input aria-label="Search users" placeholder="Search users" value={query} onChange={e => setQuery(e.target.value)} /></label></div><div className="table-card"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td><strong>{u.name}</strong><small>{u.email}</small></td><td>{roleNames[u.role]}</td><td><Badge tone={u.active ? 'success' : 'danger'}>{u.active ? 'Active' : 'Inactive'}</Badge></td><td><button disabled={u.id === user!.id} className="btn-secondary small" onClick={() => toggle(u)}>{u.active ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div></>;
}

function AuditLogs() { const { state } = useDemo(); return <><PageHeader title="Audit logs" detail="A chronological record of demo actions." /><div className="table-card"><table><thead><tr><th>Event</th><th>Action</th><th>Date</th></tr></thead><tbody>{state.audit.map(a => <tr key={a.id}><td>{a.detail}</td><td><Badge>{a.action}</Badge></td><td>{new Date(a.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div></>; }
function Notifications() { const { state, user, refresh } = useDemo(); const [tab, setTab] = useState('all'); const notes = state.notifications.filter(n => n.userId === user!.id); const shown = tab === 'unread' ? notes.filter(n => !n.read) : notes; function readAll() { notes.forEach(n => n.read = true); saveState(state); refresh(); } return <><PageHeader title="Notifications" detail="Updates about your library activity." action={<button className="btn-secondary" onClick={readAll}>Mark all as read</button>} /><Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: 'All', count: notes.length }, { value: 'unread', label: 'Unread', count: notes.filter(n => !n.read).length }]} />{shown.length ? <div className="notification-list">{shown.map(n => <article className={n.read ? '' : 'unread'} key={n.id}><span></span><div><p>{n.message}</p><time>{new Date(n.createdAt).toLocaleString()}</time></div></article>)}</div> : <Empty>No notifications in this view.</Empty>}</>; }
function Analytics() { const { state } = useDemo(); const approved = state.requests.filter(r => ['approved', 'returned'].includes(r.status)).length; const physical = state.copies.filter(c => c.format === 'physical').length; const digital = state.copies.length - physical; return <><PageHeader title="Analytics" detail="A snapshot of seeded and browser-generated activity." /><div className="stats-grid three"><Stat label="Total materials" value={state.materials.length} /><Stat label="Approved requests" value={approved} /><Stat label="Active users" value={state.users.filter(u => u.active).length} /></div><section className="section-card"><div className="section-heading"><h2>Collection formats</h2></div>{[['Physical', physical], ['Digital', digital]].map(([name, count]) => <div className="metric" key={name}><div><span>{name}</span><strong>{count}</strong></div><div><span style={{ width: `${Number(count) / state.copies.length * 100}%` }} /></div></div>)}</section></>; }

function Profile() {
    const { state, user, refresh } = useDemo(); const [tab, setTab] = useState('details'); const [name, setName] = useState(user!.name); const [saved, setSaved] = useState(false); const notes = state.notifications.filter(n => n.userId === user!.id);
    function save(e: FormEvent) { e.preventDefault(); user!.name = name.trim(); saveState(state); refresh(); setSaved(true); }
    return <><PageHeader title="Profile" detail="Manage your personal details and notification history." /><Tabs value={tab} onChange={setTab} items={[{ value: 'details', label: 'Personal Details' }, { value: 'notifications', label: 'Notifications', count: notes.filter(n => !n.read).length }]} />{tab === 'details' ? <form className="profile-card" onSubmit={save}><div className="profile-avatar">{initials(user!.name)}</div><div className="form-grid"><label>Full name<input className="input" value={name} onChange={e => setName(e.target.value)} required /></label><label>Email address<input className="input" value={user!.email} disabled /></label><label>Role<input className="input" value={roleNames[user!.role]} disabled /></label></div><button className="btn-primary">Save changes</button>{saved && <span role="status" className="save-status">Profile saved.</span>}</form> : <div className="notification-list">{notes.map(n => <article className={n.read ? '' : 'unread'} key={n.id}><span></span><div><p>{n.message}</p><time>{new Date(n.createdAt).toLocaleString()}</time></div></article>)}</div>}</>;
}
