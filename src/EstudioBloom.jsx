import React, { useState, useMemo, createContext, useContext } from 'react';
import {
  Calendar, Clock, User, LogOut, Bell, Check, X, Plus,
  Phone, Mail, FileText, Home, List, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Eye, Leaf,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const C = {
  cream: '#FAF7F2', moss: '#2D4A3E', mossDeep: '#1E3329',
  mossLight: '#3D6A58', gold: '#C9A96E', goldDark: '#B8945A',
  carbon: '#1C1C1C', surface: '#F0EBE1', border: '#E2D9C8', white: '#FFFFFF',
};

const STATUS_CFG = {
  pending:   { label: 'Pendiente',  bg: '#FEF3C7', text: '#92400E' },
  confirmed: { label: 'Confirmada', bg: '#D1FAE5', text: '#065F46' },
  rejected:  { label: 'Rechazada', bg: '#FEE2E2', text: '#991B1B' },
  cancelled: { label: 'Cancelada', bg: '#F3F4F6', text: '#374151' },
};

const SERVICES = [
  { id: 's1', name: 'Masaje Relajante', duration: 60, price: 850 },
  { id: 's2', name: 'Facial Exprés',    duration: 30, price: 450 },
  { id: 's3', name: 'Aromaterapia',     duration: 45, price: 650 },
  { id: 's4', name: 'Reflexología',     duration: 30, price: 400 },
];

const TIME_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
];

// ═══════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════

function pad(n) { return String(n).padStart(2, '0'); }
function toStr(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isWeekday(d) { const w = d.getDay(); return w >= 1 && w <= 5; }
function todayStr() { return toStr(new Date()); }

function getWeekDays(offset = 0) {
  const today = new Date();
  const dow = today.getDay();
  const monday = addDays(today, (dow === 0 ? -6 : 1 - dow) + offset * 7);
  return [0,1,2,3,4].map(i => addDays(monday, i));
}

function getNextN(n) {
  const days = []; let d = new Date(); d.setHours(0,0,0,0);
  while (days.length < n) { if (isWeekday(d)) days.push(new Date(d)); d = addDays(d, 1); }
  return days;
}

function fmtLong(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y, m-1, d).toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long' });
}

// ═══════════════════════════════════════════════════════════════
// INITIAL DATA
// ═══════════════════════════════════════════════════════════════

function buildAppointments() {
  const days = getNextN(7);
  return [
    { id:'a1', clientId:'u1', clientName:'María García', clientEmail:'maria@email.com', clientPhone:'442-111-2222', serviceId:'s1', serviceName:'Masaje Relajante', serviceDuration:60, date:toStr(days[0]), time:'10:00', status:'confirmed', notes:'Zona lumbar tensa', createdAt:new Date().toISOString(), adminRead:true },
    { id:'a2', clientId:'u2', clientName:'Carlos López',  clientEmail:'carlos@email.com', clientPhone:'442-333-4444', serviceId:'s2', serviceName:'Facial Exprés',    serviceDuration:30, date:toStr(days[0]), time:'11:30', status:'pending',   notes:'', createdAt:new Date().toISOString(), adminRead:false },
    { id:'a3', clientId:'u1', clientName:'María García', clientEmail:'maria@email.com', clientPhone:'442-111-2222', serviceId:'s3', serviceName:'Aromaterapia',     serviceDuration:45, date:toStr(days[1]), time:'14:00', status:'pending',   notes:'Prefiero lavanda', createdAt:new Date().toISOString(), adminRead:false },
    { id:'a4', clientId:'u2', clientName:'Carlos López',  clientEmail:'carlos@email.com', clientPhone:'442-333-4444', serviceId:'s4', serviceName:'Reflexología',    serviceDuration:30, date:toStr(days[2]), time:'09:00', status:'confirmed', notes:'', createdAt:new Date().toISOString(), adminRead:true },
    { id:'a5', clientId:'u1', clientName:'María García', clientEmail:'maria@email.com', clientPhone:'442-111-2222', serviceId:'s2', serviceName:'Facial Exprés',    serviceDuration:30, date:toStr(days[3]), time:'15:30', status:'rejected',  notes:'', createdAt:new Date().toISOString(), adminRead:true },
    { id:'a6', clientId:'u2', clientName:'Carlos López',  clientEmail:'carlos@email.com', clientPhone:'442-333-4444', serviceId:'s1', serviceName:'Masaje Relajante', serviceDuration:60, date:toStr(days[4]), time:'11:00', status:'pending',   notes:'Primera sesión', createdAt:new Date().toISOString(), adminRead:false },
  ];
}

const INIT_USERS = [
  { id:'admin', name:'Admin Bloom',  email:'admin@bloom.com',  password:'admin123', role:'admin',  phone:'442-000-0000' },
  { id:'u1',    name:'María García', email:'maria@email.com',  password:'123456',   role:'client', phone:'442-111-2222' },
  { id:'u2',    name:'Carlos López', email:'carlos@email.com', password:'123456',   role:'client', phone:'442-333-4444' },
];

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════

const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

// ═══════════════════════════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════════════════════════

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#FAF7F2;color:#1C1C1C;}
  .fd{font-family:'Cormorant Garamond',serif;}
  .btn-p{background:#2D4A3E;color:#FAF7F2;padding:11px 26px;border:none;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;letter-spacing:.4px;}
  .btn-p:hover{background:#3D6A58;transform:translateY(-1px);box-shadow:0 4px 14px rgba(45,74,62,.28);}
  .btn-p:disabled{background:#9CA3AF;cursor:not-allowed;transform:none;box-shadow:none;}
  .btn-g{background:#C9A96E;color:#FAF7F2;padding:11px 26px;border:none;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;}
  .btn-g:hover{background:#B8945A;transform:translateY(-1px);}
  .btn-o{background:transparent;color:#2D4A3E;padding:9px 20px;border:1.5px solid #2D4A3E;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;}
  .btn-o:hover{background:#2D4A3E;color:#FAF7F2;}
  .btn-d{background:transparent;color:#DC2626;padding:9px 20px;border:1.5px solid #DC2626;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all .2s;}
  .btn-d:hover{background:#DC2626;color:#fff;}
  .btn-sm{padding:6px 14px!important;font-size:12px!important;}
  .inp{width:100%;padding:10px 14px;border:1.5px solid #E2D9C8;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:14px;background:#fff;color:#1C1C1C;outline:none;transition:border-color .2s;}
  .inp:focus{border-color:#2D4A3E;}
  .inp:disabled{background:#F5F0E8;color:#9CA3AF;cursor:not-allowed;}
  .card{background:#fff;border-radius:12px;border:1px solid #E8E0D0;box-shadow:0 2px 8px rgba(45,74,62,.06);}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:8px;cursor:pointer;transition:all .2s;color:rgba(250,247,242,.7);font-size:14px;margin-bottom:3px;}
  .nav-item:hover{background:rgba(250,247,242,.1);color:#FAF7F2;}
  .nav-item.active{background:rgba(201,169,110,.22);color:#C9A96E;font-weight:500;}
  .fade{animation:fi .3s ease;}
  @keyframes fi{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
  .slot{padding:7px 10px;border-radius:7px;border:1.5px solid #E2D9C8;background:#fff;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all .15s;color:#1C1C1C;text-align:center;}
  .slot:hover:not(:disabled){border-color:#2D4A3E;background:#F0EBE1;}
  .slot.sel{background:#2D4A3E;color:#FAF7F2;border-color:#2D4A3E;}
  .slot:disabled{background:#F3F4F6;color:#D1D5DB;cursor:not-allowed;border-color:#E5E7EB;text-decoration:line-through;}
  .appt-blk{border-radius:4px;padding:3px 6px;font-size:10px;line-height:1.4;cursor:pointer;transition:opacity .15s;}
  .appt-blk:hover{opacity:.82;}
  tr:hover td{background:rgba(240,235,225,.5);}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(45,74,62,.25);border-radius:3px;}
`;

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{ background:s.bg, color:s.text, padding:'3px 11px', borderRadius:999, fontSize:12, fontWeight:500, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(28,28,28,.52)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(3px)' }}>
      <div style={{ background:C.white,borderRadius:16,padding:32,width:'90%',maxWidth:500,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,.18)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
          <h3 className="fd" style={{ fontSize:24,color:C.carbon,fontWeight:600 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4 }}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display:'flex',alignItems:'flex-start',gap:10,marginBottom:14 }}>
      <div style={{ color:C.moss,marginTop:2,flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:10,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:14,color:C.carbon,fontWeight:500 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{ position:'fixed',top:24,right:24,zIndex:9999,background:isErr?'#FEE2E2':'#D1FAE5',border:`1px solid ${isErr?'#FCA5A5':'#34D399'}`,color:isErr?'#991B1B':'#065F46',padding:'13px 20px',borderRadius:10,boxShadow:'0 4px 20px rgba(0,0,0,.12)',fontSize:14,maxWidth:340,display:'flex',alignItems:'center',gap:9,animation:'fi .3s ease' }}>
      {isErr ? <XCircle size={16}/> : <CheckCircle size={16}/>}
      {toast.message}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP (ROOT)
// ═══════════════════════════════════════════════════════════════

export default function App() {
  const [users, setUsers]               = useState(INIT_USERS);
  const [appointments, setAppointments] = useState(buildAppointments);
  const [currentUser, setCurrentUser]   = useState(null);
  const [clientSec, setClientSec]       = useState('dashboard');
  const [adminSec, setAdminSec]         = useState('dashboard');
  const [toast, setToast]               = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3600);
  }

  function login(email, password) {
    const u = users.find(u => u.email === email && u.password === password);
    if (u) { setCurrentUser(u); return true; }
    return false;
  }

  function register(name, email, phone, password) {
    if (users.find(u => u.email === email)) return false;
    const u = { id:`u${Date.now()}`, name, email, phone, password, role:'client' };
    setUsers(p => [...p, u]);
    setCurrentUser(u);
    return true;
  }

  function logout() {
    setCurrentUser(null);
    setClientSec('dashboard');
    setAdminSec('dashboard');
  }

  function bookAppointment(data) {
    const a = { id:`a${Date.now()}`, clientId:currentUser.id, clientName:currentUser.name, clientEmail:currentUser.email, clientPhone:currentUser.phone, ...data, status:'pending', createdAt:new Date().toISOString(), adminRead:false };
    setAppointments(p => [...p, a]);
    showToast('¡Cita agendada! Pendiente de confirmación del spa.');
  }

  function cancelAppointment(id) {
    setAppointments(p => p.map(a => a.id===id ? {...a,status:'cancelled'} : a));
    showToast('Cita cancelada.');
  }

  function confirmAppointment(id) {
    setAppointments(p => p.map(a => a.id===id ? {...a,status:'confirmed',adminRead:true} : a));
    showToast('Cita confirmada.');
  }

  function rejectAppointment(id) {
    setAppointments(p => p.map(a => a.id===id ? {...a,status:'rejected',adminRead:true} : a));
    showToast('Cita rechazada.', 'error');
  }

  const ctx = {
    users, appointments, currentUser,
    clientSec, setClientSec,
    adminSec, setAdminSec,
    login, register, logout,
    bookAppointment, cancelAppointment,
    confirmAppointment, rejectAppointment,
    showToast,
  };

  return (
    <Ctx.Provider value={ctx}>
      <style>{GLOBAL_CSS}</style>
      <Toast toast={toast} />
      {!currentUser
        ? <LandingPage />
        : currentUser.role === 'admin'
          ? <AdminPortal />
          : <ClientPortal />
      }
    </Ctx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════

function LandingPage() {
  const { login, register } = useApp();
  const [tab, setTab]   = useState('login');
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' });
  const [error, setError] = useState('');

  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setError(''); };

  function handleLogin() {
    if (!form.email||!form.password) { setError('Completa todos los campos.'); return; }
    if (!login(form.email, form.password)) setError('Credenciales incorrectas.');
  }

  function handleRegister() {
    if (!form.name||!form.email||!form.phone||!form.password) { setError('Completa todos los campos.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Email inválido.'); return; }
    if (!register(form.name, form.email, form.phone, form.password)) setError('Este email ya está registrado.');
  }

  function switchTab(t) { setTab(t); setError(''); setForm({name:'',email:'',phone:'',password:''}); }

  return (
    <div style={{ minHeight:'100vh',display:'flex',background:C.cream }}>
      {/* ── Left decorative panel ── */}
      <div style={{ flex:'0 0 420px',background:C.moss,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',padding:60,position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-100,right:-100,width:320,height:320,borderRadius:'50%',background:'rgba(201,169,110,.09)' }}/>
        <div style={{ position:'absolute',bottom:-70,left:-70,width:240,height:240,borderRadius:'50%',background:'rgba(201,169,110,.07)' }}/>
        <div style={{ position:'absolute',top:'50%',left:20,right:20,height:1,background:'rgba(201,169,110,.12)',transform:'translateY(-80px)' }}/>

        <div style={{ textAlign:'center',position:'relative',zIndex:1 }}>
          <div style={{ color:C.gold,fontSize:52,marginBottom:18,lineHeight:1 }}>✦</div>
          <h1 className="fd" style={{ color:C.cream,fontSize:58,fontWeight:600,lineHeight:1.08,marginBottom:10 }}>Estudio<br/>Bloom</h1>
          <p style={{ color:'rgba(250,247,242,.5)',fontSize:13,letterSpacing:'3.5px',textTransform:'uppercase',marginBottom:36 }}>Spa & Bienestar</p>
          <div style={{ width:36,height:1,background:C.gold,margin:'0 auto 32px' }}/>
          <p style={{ color:'rgba(250,247,242,.65)',fontSize:14,lineHeight:2,maxWidth:260 }}>
            Un espacio de paz y renovación.<br/>
            Querétaro, México.<br/>
            Lunes – Viernes · 9:00 – 18:00
          </p>
          <div style={{ marginTop:40,display:'flex',gap:20,justifyContent:'center',color:'rgba(250,247,242,.3)',fontSize:11,letterSpacing:'1px',textTransform:'uppercase' }}>
            <span>Masajes</span><span>·</span><span>Faciales</span><span>·</span><span>Bienestar</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'48px 60px',background:C.cream }}>
        <div style={{ maxWidth:400 }}>
          <h2 className="fd" style={{ fontSize:38,color:C.carbon,marginBottom:6,fontWeight:600 }}>Bienvenida</h2>
          <p style={{ color:'#8C7B6B',fontSize:14,marginBottom:36 }}>Agenda tu momento de bienestar</p>

          {/* Tabs */}
          <div style={{ display:'flex',borderBottom:`1.5px solid ${C.border}`,marginBottom:32 }}>
            {[['login','Iniciar sesión'],['register','Registrarse']].map(([k,l]) => (
              <button key={k} onClick={() => switchTab(k)}
                style={{ flex:1,padding:'10px 0',background:'none',border:'none',borderBottom:`2.5px solid ${tab===k?C.moss:'transparent'}`,color:tab===k?C.moss:'#9CA3AF',fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:tab===k?600:400,cursor:'pointer',transition:'all .2s',marginBottom:-1.5 }}>
                {l}
              </button>
            ))}
          </div>

          <div className="fade" key={tab}>
            {tab==='register' && (
              <div style={{ marginBottom:16 }}>
                <label style={LBL}>Nombre completo</label>
                <input className="inp" placeholder="María García" value={form.name} onChange={set('name')}/>
              </div>
            )}
            <div style={{ marginBottom:16 }}>
              <label style={LBL}>Correo electrónico</label>
              <input className="inp" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')}/>
            </div>
            {tab==='register' && (
              <div style={{ marginBottom:16 }}>
                <label style={LBL}>Teléfono</label>
                <input className="inp" placeholder="442-123-4567" value={form.phone} onChange={set('phone')}/>
              </div>
            )}
            <div style={{ marginBottom:26 }}>
              <label style={LBL}>Contraseña</label>
              <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={set('password')}/>
            </div>

            {error && (
              <div style={{ background:'#FEE2E2',border:'1px solid #FCA5A5',color:'#991B1B',padding:'10px 14px',borderRadius:8,fontSize:13,marginBottom:20 }}>
                {error}
              </div>
            )}

            <button className="btn-p" style={{ width:'100%',padding:'13px 0',fontSize:15 }}
              onClick={tab==='login' ? handleLogin : handleRegister}>
              {tab==='login' ? 'Ingresar al portal' : 'Crear cuenta'}
            </button>

            {tab==='login' && (
              <div style={{ marginTop:22,padding:'14px 16px',background:C.surface,borderRadius:8,fontSize:12,color:'#6B5E4E',lineHeight:1.8 }}>
                <strong style={{ display:'block',marginBottom:4,color:C.moss }}>Cuentas demo</strong>
                Cliente: <code>maria@email.com</code> / <code>123456</code><br/>
                Admin: <code>admin@bloom.com</code> / <code>admin123</code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const LBL = { display:'block',fontSize:11,color:'#6B5E4E',marginBottom:6,textTransform:'uppercase',letterSpacing:'.6px' };

// ═══════════════════════════════════════════════════════════════
// CLIENT PORTAL
// ═══════════════════════════════════════════════════════════════

function ClientPortal() {
  const { currentUser, appointments, clientSec, setClientSec, logout } = useApp();
  const myAppts = appointments.filter(a => a.clientId===currentUser.id);

  const nav = [
    { id:'dashboard',     label:'Inicio',       icon:<Home size={15}/> },
    { id:'book',          label:'Agendar Cita', icon:<Plus size={15}/> },
    { id:'appointments',  label:'Mis Citas',    icon:<Calendar size={15}/>, badge: myAppts.filter(a=>a.status!=='cancelled').length },
  ];

  return (
    <div style={{ display:'flex',minHeight:'100vh',background:C.cream }}>
      {/* Sidebar */}
      <aside style={{ width:240,background:C.moss,display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',flexShrink:0 }}>
        <div style={{ padding:'28px 20px 20px',borderBottom:'1px solid rgba(250,247,242,.1)' }}>
          <div style={{ color:C.gold,fontSize:22,marginBottom:8 }}>✦</div>
          <div className="fd" style={{ color:C.cream,fontSize:22,fontWeight:600 }}>Estudio Bloom</div>
          <div style={{ color:'rgba(250,247,242,.45)',fontSize:10,letterSpacing:'2px',textTransform:'uppercase' }}>Spa & Bienestar</div>
        </div>

        <div style={{ padding:'14px 20px',borderBottom:'1px solid rgba(250,247,242,.1)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:C.gold,display:'flex',alignItems:'center',justifyContent:'center',color:C.moss,fontWeight:700,fontSize:15 }}>
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div style={{ color:C.cream,fontSize:13,fontWeight:500 }}>{currentUser.name.split(' ')[0]}</div>
              <div style={{ color:'rgba(250,247,242,.45)',fontSize:11 }}>Cliente</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1,padding:'14px 12px' }}>
          {nav.map(item => (
            <div key={item.id} className={`nav-item ${clientSec===item.id?'active':''}`} onClick={() => setClientSec(item.id)}>
              {item.icon}
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ marginLeft:'auto',background:C.gold,color:C.moss,borderRadius:999,padding:'1px 7px',fontSize:11,fontWeight:700 }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding:'14px 12px',borderTop:'1px solid rgba(250,247,242,.1)' }}>
          <div className="nav-item" onClick={logout} style={{ color:'rgba(250,247,242,.45)' }}>
            <LogOut size={15}/><span>Cerrar sesión</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1,padding:'36px 44px',overflowY:'auto' }}>
        <div className="fade" key={clientSec}>
          {clientSec==='dashboard'    && <ClientDashboard />}
          {clientSec==='book'         && <BookAppointment />}
          {clientSec==='appointments' && <MyAppointments />}
        </div>
      </main>
    </div>
  );
}

// ── 2A. Client Dashboard ──────────────────────────────────────

function ClientDashboard() {
  const { currentUser, appointments, setClientSec } = useApp();
  const myAppts = appointments.filter(a => a.clientId===currentUser.id);
  const today = todayStr();

  const pending   = myAppts.filter(a => a.status==='pending');
  const confirmed = myAppts.filter(a => a.status==='confirmed');
  const nextAppt  = confirmed.filter(a => a.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))[0];
  const notifications = myAppts.filter(a => a.status==='confirmed'||a.status==='rejected').slice(-4).reverse();

  return (
    <div>
      <div style={{ marginBottom:36 }}>
        <h1 className="fd" style={{ fontSize:44,color:C.carbon,fontWeight:600,marginBottom:4 }}>
          Hola, {currentUser.name.split(' ')[0]}
        </h1>
        <p style={{ color:'#8C7B6B',fontSize:15 }}>Aquí está el resumen de tu actividad</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28 }}>
        {[
          { label:'Total de citas', value:myAppts.filter(a=>a.status!=='cancelled').length, accent:C.moss },
          { label:'Pendientes',     value:pending.length,   accent:'#D97706' },
          { label:'Confirmadas',    value:confirmed.length, accent:'#059669' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="card" style={{ padding:24 }}>
            <div className="fd" style={{ fontSize:44,fontWeight:600,color:accent,lineHeight:1,marginBottom:6 }}>{value}</div>
            <div style={{ fontSize:13,color:'#6B7280' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="card" style={{ padding:24,marginBottom:20,borderLeft:`3px solid ${C.gold}` }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:16 }}>
            <Bell size={16} style={{ color:C.gold }}/>
            <h3 style={{ fontSize:15,fontWeight:600,color:C.carbon }}>Actualizaciones de tus citas</h3>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
            {notifications.map(a => (
              <div key={a.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:9,background:a.status==='confirmed'?'#F0FDF4':'#FFF5F5' }}>
                <div>
                  <span style={{ fontSize:13,fontWeight:600,color:C.carbon }}>{a.serviceName}</span>
                  <span style={{ fontSize:12,color:'#6B7280',marginLeft:10 }}>{fmtLong(a.date)} · {a.time}</span>
                </div>
                <StatusBadge status={a.status}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next appointment */}
      {nextAppt ? (
        <div className="card" style={{ padding:28 }}>
          <div style={{ fontSize:11,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'1px',marginBottom:16 }}>Próxima cita confirmada</div>
          <div style={{ display:'flex',alignItems:'center',gap:20 }}>
            <div style={{ width:56,height:56,borderRadius:12,background:'#D1FAE5',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Calendar size={24} style={{ color:'#059669' }}/>
            </div>
            <div>
              <div className="fd" style={{ fontSize:26,color:C.carbon,fontWeight:600 }}>{nextAppt.serviceName}</div>
              <div style={{ color:'#6B7280',fontSize:14,marginTop:2 }}>{fmtLong(nextAppt.date)} · {nextAppt.time} hrs</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding:40,textAlign:'center' }}>
          <div style={{ color:'#D1D5DB',fontSize:40,marginBottom:12 }}>✦</div>
          <p style={{ color:'#9CA3AF',marginBottom:20 }}>No tienes citas confirmadas próximamente.</p>
          <button className="btn-p" onClick={() => setClientSec('book')}>Agendar cita</button>
        </div>
      )}
    </div>
  );
}

// ── 2B. Book Appointment ──────────────────────────────────────

function BookAppointment() {
  const { appointments, currentUser, bookAppointment, setClientSec } = useApp();
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState({ serviceId:'', date:'', time:'', notes:'' });
  const [success, setSuccess] = useState(false);

  const service = SERVICES.find(s => s.id===form.serviceId);
  const availDays = getNextN(30).slice(0,14);

  const occupiedSlots = useMemo(() => {
    if (!form.date) return [];
    return appointments
      .filter(a => a.date===form.date && ['pending','confirmed'].includes(a.status))
      .map(a => a.time);
  }, [appointments, form.date]);

  function handleBook() {
    if (!form.serviceId||!form.date||!form.time) return;
    bookAppointment({ serviceId:form.serviceId, serviceName:service.name, serviceDuration:service.duration, date:form.date, time:form.time, notes:form.notes });
    setSuccess(true);
  }

  if (success) return (
    <div style={{ maxWidth:480,margin:'0 auto',textAlign:'center',paddingTop:60 }}>
      <div style={{ width:80,height:80,borderRadius:'50%',background:'#D1FAE5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px' }}>
        <CheckCircle size={36} style={{ color:'#059669' }}/>
      </div>
      <h2 className="fd" style={{ fontSize:38,color:C.carbon,marginBottom:10 }}>¡Cita Agendada!</h2>
      <p style={{ color:'#6B7280',marginBottom:28 }}>Pendiente de confirmación. El spa revisará tu solicitud pronto.</p>
      <div className="card" style={{ padding:24,marginBottom:28,textAlign:'left' }}>
        <InfoRow icon={<Leaf size={14}/>}     label="Servicio" value={service.name}/>
        <InfoRow icon={<Calendar size={14}/>} label="Fecha"    value={fmtLong(form.date)}/>
        <InfoRow icon={<Clock size={14}/>}    label="Hora"     value={`${form.time} hrs`}/>
      </div>
      <div style={{ display:'flex',gap:12,justifyContent:'center' }}>
        <button className="btn-o" onClick={() => { setStep(1); setForm({serviceId:'',date:'',time:'',notes:''}); setSuccess(false); }}>Agendar otra</button>
        <button className="btn-p" onClick={() => setClientSec('appointments')}>Ver mis citas</button>
      </div>
    </div>
  );

  // Step indicators
  const steps = ['Servicio','Fecha & Hora','Confirmar'];

  return (
    <div style={{ maxWidth:660 }}>
      <h1 className="fd" style={{ fontSize:44,color:C.carbon,marginBottom:6 }}>Agendar Cita</h1>
      <p style={{ color:'#8C7B6B',marginBottom:36 }}>Selecciona servicio, fecha y horario</p>

      {/* Progress */}
      <div style={{ display:'flex',alignItems:'center',marginBottom:40 }}>
        {steps.map((s,i) => (
          <React.Fragment key={s}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:step>i+1?C.moss:step===i+1?C.gold:C.border,color:step>=i+1?C.white:'#9CA3AF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,flexShrink:0,transition:'all .3s' }}>
                {step>i+1?<Check size={12}/>:i+1}
              </div>
              <span style={{ fontSize:13,color:step===i+1?C.carbon:'#9CA3AF',fontWeight:step===i+1?600:400 }}>{s}</span>
            </div>
            {i<2 && <div style={{ flex:1,height:1,background:C.border,margin:'0 14px' }}/>}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 — Service */}
      {step===1 && (
        <div className="fade">
          <h3 style={{ fontSize:16,fontWeight:600,color:C.carbon,marginBottom:18 }}>Elige tu servicio</h3>
          <div style={{ display:'grid',gap:12,marginBottom:28 }}>
            {SERVICES.map(svc => (
              <div key={svc.id} onClick={() => setForm(f=>({...f,serviceId:svc.id}))}
                style={{ padding:20,borderRadius:12,border:`2px solid ${form.serviceId===svc.id?C.moss:C.border}`,background:form.serviceId===svc.id?'#F0EBE1':C.white,cursor:'pointer',transition:'all .2s',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600,color:C.carbon,marginBottom:3 }}>{svc.name}</div>
                  <div style={{ fontSize:13,color:'#9CA3AF' }}>{svc.duration} minutos</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="fd" style={{ fontSize:24,fontWeight:600,color:C.moss }}>${svc.price}</div>
                  <div style={{ fontSize:11,color:'#9CA3AF' }}>MXN</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-p" disabled={!form.serviceId} onClick={() => setStep(2)}>Continuar →</button>
        </div>
      )}

      {/* Step 2 — Date & Time */}
      {step===2 && (
        <div className="fade">
          <h3 style={{ fontSize:16,fontWeight:600,color:C.carbon,marginBottom:16 }}>Selecciona la fecha</h3>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:28 }}>
            {availDays.map(day => {
              const dStr = toStr(day);
              const sel  = form.date===dStr;
              return (
                <div key={dStr} onClick={() => setForm(f=>({...f,date:dStr,time:''}))}
                  style={{ padding:'10px 6px',borderRadius:10,border:`1.5px solid ${sel?C.moss:C.border}`,background:sel?C.moss:C.white,cursor:'pointer',textAlign:'center',transition:'all .2s' }}>
                  <div style={{ fontSize:10,color:sel?'rgba(250,247,242,.65)':'#9CA3AF',textTransform:'capitalize',marginBottom:2 }}>
                    {day.toLocaleDateString('es-MX',{weekday:'short'})}
                  </div>
                  <div className="fd" style={{ fontSize:20,fontWeight:600,color:sel?C.cream:C.carbon }}>
                    {day.getDate()}
                  </div>
                  <div style={{ fontSize:10,color:sel?'rgba(250,247,242,.55)':'#9CA3AF' }}>
                    {day.toLocaleDateString('es-MX',{month:'short'})}
                  </div>
                </div>
              );
            })}
          </div>

          {form.date && (
            <div style={{ marginBottom:28 }}>
              <h3 style={{ fontSize:16,fontWeight:600,color:C.carbon,marginBottom:16 }}>Selecciona el horario</h3>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8,marginBottom:10 }}>
                {TIME_SLOTS.map(slot => (
                  <button key={slot} className={`slot ${form.time===slot?'sel':''}`}
                    disabled={occupiedSlots.includes(slot)}
                    onClick={() => setForm(f=>({...f,time:slot}))}>
                    {slot}
                  </button>
                ))}
              </div>
              {occupiedSlots.length > 0 && (
                <p style={{ fontSize:12,color:'#9CA3AF' }}>Los horarios tachados ya están ocupados.</p>
              )}
            </div>
          )}

          <div style={{ marginBottom:24 }}>
            <label style={LBL}>Notas adicionales (opcional)</label>
            <textarea className="inp" rows={3} style={{ resize:'vertical' }}
              placeholder="Ej: zona de tensión, alergias, preferencias..."
              value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/>
          </div>

          <div style={{ display:'flex',gap:12 }}>
            <button className="btn-o" onClick={() => setStep(1)}>← Atrás</button>
            <button className="btn-p" disabled={!form.date||!form.time} onClick={() => setStep(3)}>Continuar →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step===3 && (
        <div className="fade">
          <h3 style={{ fontSize:16,fontWeight:600,color:C.carbon,marginBottom:22 }}>Confirma tu reservación</h3>
          <div className="card" style={{ padding:28,marginBottom:22 }}>
            <div style={{ borderBottom:`1px solid ${C.border}`,paddingBottom:18,marginBottom:20 }}>
              <div className="fd" style={{ fontSize:30,color:C.carbon,fontWeight:600 }}>{service.name}</div>
              <div style={{ color:'#9CA3AF',fontSize:14 }}>{service.duration} min · ${service.price} MXN</div>
            </div>
            <InfoRow icon={<Calendar size={14}/>} label="Fecha"   value={fmtLong(form.date)}/>
            <InfoRow icon={<Clock size={14}/>}    label="Hora"    value={`${form.time} hrs`}/>
            <InfoRow icon={<User size={14}/>}     label="Cliente" value={currentUser.name}/>
            {form.notes && <InfoRow icon={<FileText size={14}/>} label="Notas" value={form.notes}/>}
          </div>
          <div style={{ padding:'12px 16px',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,fontSize:13,color:'#92400E',marginBottom:24 }}>
            Tu cita quedará como <strong>pendiente</strong> hasta que el spa la confirme.
          </div>
          <div style={{ display:'flex',gap:12 }}>
            <button className="btn-o" onClick={() => setStep(2)}>← Atrás</button>
            <button className="btn-g" style={{ padding:'12px 32px' }} onClick={handleBook}>Confirmar Reservación</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 2C. My Appointments ───────────────────────────────────────

function MyAppointments() {
  const { appointments, currentUser, cancelAppointment } = useApp();
  const [cancelTarget, setCancelTarget] = useState(null);
  const today = todayStr();

  const myAppts = appointments
    .filter(a => a.clientId===currentUser.id)
    .sort((a,b) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time));

  const upcoming = myAppts.filter(a => a.date>=today && a.status!=='cancelled' && a.status!=='rejected');
  const past     = myAppts.filter(a => a.date<today  || a.status==='cancelled' || a.status==='rejected');

  function Section({ title, items }) {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:11,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'1px',marginBottom:14 }}>{title}</div>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {items.map(a => (
            <div key={a.id} className="card" style={{ padding:20,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16 }}>
              <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                <div style={{ width:46,height:46,borderRadius:10,background:a.status==='confirmed'?'#D1FAE5':a.status==='pending'?'#FEF3C7':'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <Calendar size={18} style={{ color:a.status==='confirmed'?'#059669':a.status==='pending'?'#D97706':'#9CA3AF' }}/>
                </div>
                <div>
                  <div style={{ fontWeight:600,color:C.carbon,marginBottom:2 }}>{a.serviceName}</div>
                  <div style={{ fontSize:13,color:'#6B7280' }}>{fmtLong(a.date)} · {a.time} hrs</div>
                  {a.notes && <div style={{ fontSize:12,color:'#9CA3AF',marginTop:2 }}>"{a.notes}"</div>}
                </div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
                <StatusBadge status={a.status}/>
                {['pending','confirmed'].includes(a.status) && a.date>=today && (
                  <button className="btn-d btn-sm" onClick={() => setCancelTarget(a)}>Cancelar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="fd" style={{ fontSize:44,color:C.carbon,marginBottom:6 }}>Mis Citas</h1>
      <p style={{ color:'#8C7B6B',marginBottom:36 }}>{myAppts.length} cita{myAppts.length!==1?'s':''} registrada{myAppts.length!==1?'s':''}</p>

      {myAppts.length===0 ? (
        <div className="card" style={{ padding:48,textAlign:'center' }}>
          <p style={{ color:'#9CA3AF' }}>No tienes citas agendadas aún.</p>
        </div>
      ) : (
        <>
          <Section title="Próximas" items={upcoming}/>
          <Section title="Historial" items={past}/>
        </>
      )}

      {cancelTarget && (
        <Modal title="Cancelar cita" onClose={() => setCancelTarget(null)}>
          <p style={{ color:'#6B7280',marginBottom:24,lineHeight:1.7 }}>
            ¿Segura que deseas cancelar tu cita de <strong>{cancelTarget.serviceName}</strong> el {fmtLong(cancelTarget.date)} a las {cancelTarget.time} hrs?
          </p>
          <div style={{ display:'flex',gap:12 }}>
            <button className="btn-o" onClick={() => setCancelTarget(null)}>Conservar cita</button>
            <button className="btn-d" onClick={() => { cancelAppointment(cancelTarget.id); setCancelTarget(null); }}>Sí, cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PORTAL
// ═══════════════════════════════════════════════════════════════

function AdminPortal() {
  const { adminSec, setAdminSec, appointments, logout } = useApp();
  const unread = appointments.filter(a => !a.adminRead).length;

  const nav = [
    { id:'dashboard', label:'Dashboard',      icon:<Home size={15}/>,     badge: unread },
    { id:'calendar',  label:'Calendario',     icon:<Calendar size={15}/> },
    { id:'list',      label:'Lista de Citas', icon:<List size={15}/> },
  ];

  return (
    <div style={{ display:'flex',minHeight:'100vh',background:'#F2EDE4' }}>
      {/* Admin sidebar — darker tone */}
      <aside style={{ width:240,background:C.mossDeep,display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',flexShrink:0 }}>
        <div style={{ padding:'28px 20px 20px',borderBottom:'1px solid rgba(250,247,242,.08)' }}>
          <div style={{ color:C.gold,fontSize:22,marginBottom:8 }}>✦</div>
          <div className="fd" style={{ color:C.cream,fontSize:21,fontWeight:600 }}>Estudio Bloom</div>
          <div style={{ color:'rgba(250,247,242,.4)',fontSize:10,letterSpacing:'2px',textTransform:'uppercase' }}>Panel Administrador</div>
        </div>

        <div style={{ padding:'14px 20px',borderBottom:'1px solid rgba(250,247,242,.08)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(201,169,110,.25)',display:'flex',alignItems:'center',justifyContent:'center',color:C.gold,fontWeight:700,fontSize:14 }}>
              A
            </div>
            <div>
              <div style={{ color:C.cream,fontSize:13,fontWeight:500 }}>Administrador</div>
              <div style={{ color:'rgba(250,247,242,.4)',fontSize:11 }}>admin@bloom.com</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1,padding:'14px 12px' }}>
          {nav.map(item => (
            <div key={item.id} className={`nav-item ${adminSec===item.id?'active':''}`} onClick={() => setAdminSec(item.id)}>
              {item.icon}
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ marginLeft:'auto',background:'#EF4444',color:C.white,borderRadius:999,padding:'1px 7px',fontSize:11,fontWeight:700 }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding:'14px 12px',borderTop:'1px solid rgba(250,247,242,.08)' }}>
          <div className="nav-item" onClick={logout} style={{ color:'rgba(250,247,242,.4)' }}>
            <LogOut size={15}/><span>Cerrar sesión</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1,padding:'36px 44px',overflowY:'auto' }}>
        <div className="fade" key={adminSec}>
          {adminSec==='dashboard' && <AdminDashboard />}
          {adminSec==='calendar'  && <WeekCalendar />}
          {adminSec==='list'      && <AppointmentsList />}
        </div>
      </main>
    </div>
  );
}

// ── 3A. Admin Dashboard ───────────────────────────────────────

function AdminDashboard() {
  const { appointments, confirmAppointment, rejectAppointment, setAdminSec } = useApp();
  const today     = todayStr();
  const weekStrs  = getWeekDays(0).map(toStr);

  const confirmedToday = appointments.filter(a => a.date===today && a.status==='confirmed').length;
  const pendingAll     = appointments.filter(a => a.status==='pending').length;
  const weekTotal      = appointments.filter(a => weekStrs.includes(a.date) && !['cancelled'].includes(a.status)).length;

  const newReqs = appointments.filter(a => a.status==='pending' && !a.adminRead);
  const oldPend = appointments.filter(a => a.status==='pending' && a.adminRead);

  return (
    <div>
      <h1 className="fd" style={{ fontSize:44,color:C.carbon,marginBottom:6 }}>Dashboard</h1>
      <p style={{ color:'#8C7B6B',marginBottom:36 }}>Resumen operativo del negocio</p>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28 }}>
        {[
          { label:'Confirmadas hoy',          value:confirmedToday, accent:'#059669', bg:'#F0FDF4' },
          { label:'Pendientes de respuesta',   value:pendingAll,     accent:'#D97706', bg:'#FFFBEB' },
          { label:'Total esta semana',         value:weekTotal,      accent:C.moss,    bg:'#F0F7F4' },
        ].map(({ label,value,accent,bg }) => (
          <div key={label} className="card" style={{ padding:24,background:bg }}>
            <div className="fd" style={{ fontSize:48,fontWeight:600,color:accent,lineHeight:1,marginBottom:6 }}>{value}</div>
            <div style={{ fontSize:13,color:'#6B7280' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* New requests */}
      <div className="card" style={{ padding:28,marginBottom:20 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <Bell size={17} style={{ color:C.gold }}/>
            <h3 style={{ fontSize:16,fontWeight:600,color:C.carbon }}>Nuevas solicitudes</h3>
            {newReqs.length > 0 && (
              <span style={{ background:'#EF4444',color:C.white,borderRadius:999,padding:'2px 9px',fontSize:12,fontWeight:700 }}>{newReqs.length}</span>
            )}
          </div>
          <button className="btn-o btn-sm" onClick={() => setAdminSec('list')}>Ver todas</button>
        </div>

        {newReqs.length===0 ? (
          <div style={{ textAlign:'center',padding:28,color:'#9CA3AF' }}>
            <CheckCircle size={28} style={{ marginBottom:8,opacity:.35 }}/>
            <p style={{ fontSize:13 }}>Sin solicitudes nuevas por revisar.</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
            {newReqs.map(a => (
              <div key={a.id} style={{ padding:'16px 18px',borderRadius:10,border:`1px solid ${C.border}`,background:'#FFFBF5',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16 }}>
                <div>
                  <div style={{ fontWeight:600,color:C.carbon,marginBottom:3 }}>{a.clientName}</div>
                  <div style={{ fontSize:13,color:'#6B7280' }}>{a.serviceName} · {fmtLong(a.date)} · {a.time} hrs</div>
                  {a.notes && <div style={{ fontSize:12,color:'#9CA3AF',marginTop:2 }}>"{a.notes}"</div>}
                </div>
                <div style={{ display:'flex',gap:8,flexShrink:0 }}>
                  <button className="btn-o btn-sm" style={{ color:'#059669',borderColor:'#059669' }}
                    onClick={() => confirmAppointment(a.id)}>
                    <Check size={12} style={{ display:'inline',marginRight:4 }}/>Aceptar
                  </button>
                  <button className="btn-d btn-sm" onClick={() => rejectAppointment(a.id)}>
                    <X size={12} style={{ display:'inline',marginRight:4 }}/>Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other pending */}
      {oldPend.length > 0 && (
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:14,fontWeight:600,color:C.carbon,marginBottom:16 }}>Otras pendientes</h3>
          <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
            {oldPend.map(a => (
              <div key={a.id} style={{ padding:'12px 16px',borderRadius:8,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div>
                  <span style={{ fontWeight:500,color:C.carbon,fontSize:13 }}>{a.clientName}</span>
                  <span style={{ color:'#9CA3AF',fontSize:12,marginLeft:10 }}>{a.serviceName} · {a.date} · {a.time}</span>
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  <button className="btn-o btn-sm" style={{ color:'#059669',borderColor:'#059669' }} onClick={() => confirmAppointment(a.id)}>
                    <Check size={12} style={{ display:'inline',marginRight:3 }}/>Aceptar
                  </button>
                  <button className="btn-d btn-sm" onClick={() => rejectAppointment(a.id)}>
                    <X size={12} style={{ display:'inline',marginRight:3 }}/>Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3B. Week Calendar ─────────────────────────────────────────

function WeekCalendar() {
  const { appointments, confirmAppointment, rejectAppointment } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);
  const [detail, setDetail]         = useState(null);

  const weekDays    = getWeekDays(weekOffset);
  const weekDayStrs = weekDays.map(toStr);
  const today       = todayStr();

  const SLOT_COLORS = {
    confirmed: { bg:'#D1FAE5', text:'#065F46', border:'#34D399' },
    pending:   { bg:'#FEF9C3', text:'#713F12', border:'#FDE047' },
    rejected:  { bg:'#FEE2E2', text:'#991B1B', border:'#FCA5A5' },
  };

  function getCellAppts(dateStr, time) {
    return appointments.filter(a => a.date===dateStr && a.time===time && a.status!=='cancelled');
  }

  return (
    <div>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:16 }}>
        <div>
          <h1 className="fd" style={{ fontSize:44,color:C.carbon,marginBottom:6 }}>Calendario</h1>
          <p style={{ color:'#8C7B6B' }}>
            {weekDays[0].toLocaleDateString('es-MX',{day:'numeric',month:'long'})} — {weekDays[4].toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button className="btn-o btn-sm" onClick={() => setWeekOffset(o=>o-1)}>
            <ChevronLeft size={14} style={{ display:'inline' }}/> Anterior
          </button>
          <button className="btn-o btn-sm" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button className="btn-o btn-sm" onClick={() => setWeekOffset(o=>o+1)}>
            Siguiente <ChevronRight size={14} style={{ display:'inline' }}/>
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        {/* Calendar header */}
        <div style={{ display:'grid',gridTemplateColumns:'72px repeat(5,1fr)',background:C.moss }}>
          <div style={{ padding:'12px 8px',borderRight:'1px solid rgba(250,247,242,.1)' }}/>
          {weekDays.map((day,i) => {
            const isToday = toStr(day)===today;
            return (
              <div key={i} style={{ padding:'12px 6px',borderRight:'1px solid rgba(250,247,242,.1)',textAlign:'center' }}>
                <div style={{ color:'rgba(250,247,242,.6)',fontSize:10,textTransform:'capitalize',marginBottom:2 }}>
                  {day.toLocaleDateString('es-MX',{weekday:'short'})}
                </div>
                <div className="fd" style={{ color:isToday?C.gold:C.cream,fontWeight:isToday?700:400,fontSize:22 }}>
                  {day.getDate()}
                </div>
                {isToday && <div style={{ width:4,height:4,borderRadius:'50%',background:C.gold,margin:'3px auto 0' }}/>}
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        <div style={{ overflowY:'auto',maxHeight:'62vh' }}>
          {TIME_SLOTS.map((slot,si) => (
            <div key={slot} style={{ display:'grid',gridTemplateColumns:'72px repeat(5,1fr)',borderBottom:`1px solid ${C.border}`,background:si%2===0?C.white:'#FBFAF7' }}>
              <div style={{ padding:'8px 10px 8px 6px',borderRight:`1px solid ${C.border}`,fontSize:11,color:'#9CA3AF',textAlign:'right',paddingTop:10,flexShrink:0 }}>
                {slot}
              </div>
              {weekDayStrs.map((dStr,ci) => {
                const appts = getCellAppts(dStr, slot);
                return (
                  <div key={ci} style={{ padding:3,borderRight:`1px solid ${C.border}`,minHeight:44 }}>
                    {appts.map(a => {
                      const sc = SLOT_COLORS[a.status]||SLOT_COLORS.pending;
                      return (
                        <div key={a.id} className="appt-blk" onClick={() => setDetail(a)}
                          style={{ background:sc.bg,color:sc.text,borderLeft:`2.5px solid ${sc.border}`,marginBottom:2 }}>
                          <div style={{ fontWeight:600 }}>{a.clientName.split(' ')[0]}</div>
                          <div style={{ opacity:.8 }}>{a.serviceName.split(' ')[0]}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex',gap:16,marginTop:16 }}>
        {Object.entries(SLOT_COLORS).map(([s,sc]) => (
          <div key={s} style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#6B7280' }}>
            <div style={{ width:12,height:12,borderRadius:2,background:sc.bg,border:`1.5px solid ${sc.border}` }}/>
            {STATUS_CFG[s]?.label}
          </div>
        ))}
      </div>

      {detail && (
        <Modal title="Detalle de cita" onClose={() => setDetail(null)}>
          <InfoRow icon={<User size={14}/>}     label="Cliente"   value={detail.clientName}/>
          <InfoRow icon={<Mail size={14}/>}     label="Email"     value={detail.clientEmail}/>
          <InfoRow icon={<Phone size={14}/>}    label="Teléfono"  value={detail.clientPhone}/>
          <InfoRow icon={<Leaf size={14}/>}     label="Servicio"  value={`${detail.serviceName} (${detail.serviceDuration} min)`}/>
          <InfoRow icon={<Calendar size={14}/>} label="Fecha"     value={fmtLong(detail.date)}/>
          <InfoRow icon={<Clock size={14}/>}    label="Hora"      value={`${detail.time} hrs`}/>
          {detail.notes && <InfoRow icon={<FileText size={14}/>} label="Notas" value={detail.notes}/>}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:6 }}>Estado</div>
            <StatusBadge status={detail.status}/>
          </div>
          {detail.status==='pending' && (
            <div style={{ display:'flex',gap:10 }}>
              <button className="btn-o" style={{ flex:1,color:'#059669',borderColor:'#059669' }}
                onClick={() => { confirmAppointment(detail.id); setDetail(d=>({...d,status:'confirmed'})); }}>
                <Check size={13} style={{ display:'inline',marginRight:4 }}/>Confirmar
              </button>
              <button className="btn-d" style={{ flex:1 }}
                onClick={() => { rejectAppointment(detail.id); setDetail(d=>({...d,status:'rejected'})); }}>
                <X size={13} style={{ display:'inline',marginRight:4 }}/>Rechazar
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── 3C. Appointments List ─────────────────────────────────────

function AppointmentsList() {
  const { appointments, confirmAppointment, rejectAppointment } = useApp();
  const [filters, setFilters] = useState({ status:'all', service:'all', date:'' });
  const [detail, setDetail]   = useState(null);

  const filtered = appointments
    .filter(a => {
      if (filters.status!=='all'  && a.status!==filters.status)    return false;
      if (filters.service!=='all' && a.serviceId!==filters.service) return false;
      if (filters.date            && a.date!==filters.date)         return false;
      return true;
    })
    .sort((a,b) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time));

  const setF = k => e => setFilters(f=>({...f,[k]:e.target.value}));

  const TH = ({ children }) => (
    <th style={{ padding:'11px 16px',textAlign:'left',color:'rgba(250,247,242,.7)',fontSize:11,fontWeight:500,textTransform:'uppercase',letterSpacing:'.5px',whiteSpace:'nowrap' }}>
      {children}
    </th>
  );

  return (
    <div>
      <h1 className="fd" style={{ fontSize:44,color:C.carbon,marginBottom:6 }}>Lista de Citas</h1>
      <p style={{ color:'#8C7B6B',marginBottom:28 }}>{filtered.length} resultado{filtered.length!==1?'s':''}</p>

      {/* Filters */}
      <div className="card" style={{ padding:20,marginBottom:24,display:'flex',gap:14,flexWrap:'wrap',alignItems:'flex-end' }}>
        <div style={{ flex:'1 1 130px' }}>
          <label style={LBL}>Estado</label>
          <select className="inp" value={filters.status} onChange={setF('status')}>
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="rejected">Rechazada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
        <div style={{ flex:'1 1 160px' }}>
          <label style={LBL}>Servicio</label>
          <select className="inp" value={filters.service} onChange={setF('service')}>
            <option value="all">Todos</option>
            {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ flex:'1 1 140px' }}>
          <label style={LBL}>Fecha</label>
          <input className="inp" type="date" value={filters.date} onChange={setF('date')}/>
        </div>
        <button className="btn-o btn-sm" onClick={() => setFilters({status:'all',service:'all',date:''})}>
          Limpiar filtros
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontFamily:"'DM Sans',sans-serif" }}>
            <thead>
              <tr style={{ background:C.moss }}>
                <TH>Cliente</TH>
                <TH>Teléfono</TH>
                <TH>Servicio</TH>
                <TH>Fecha</TH>
                <TH>Hora</TH>
                <TH>Estado</TH>
                <TH>Acciones</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={7} style={{ padding:40,textAlign:'center',color:'#9CA3AF' }}>Sin resultados con los filtros actuales</td></tr>
              ) : filtered.map((a,idx) => (
                <tr key={a.id} style={{ borderBottom:`1px solid ${C.border}`,background:idx%2===0?C.white:'#FBFAF7' }}>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ fontWeight:600,color:C.carbon,fontSize:13 }}>{a.clientName}</div>
                    <div style={{ fontSize:11,color:'#9CA3AF' }}>{a.clientEmail}</div>
                  </td>
                  <td style={{ padding:'13px 16px',fontSize:13,color:'#6B7280' }}>{a.clientPhone}</td>
                  <td style={{ padding:'13px 16px',fontSize:13,color:C.carbon }}>{a.serviceName}</td>
                  <td style={{ padding:'13px 16px',fontSize:13,color:'#6B7280',whiteSpace:'nowrap' }}>{a.date}</td>
                  <td style={{ padding:'13px 16px',fontSize:13,color:'#6B7280' }}>{a.time}</td>
                  <td style={{ padding:'13px 16px' }}><StatusBadge status={a.status}/></td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      <button title="Ver detalle" onClick={() => setDetail(a)}
                        style={{ background:'none',border:'none',cursor:'pointer',color:'#6B7280',padding:4,borderRadius:4,transition:'background .15s' }}>
                        <Eye size={15}/>
                      </button>
                      {a.status==='pending' && (
                        <>
                          <button title="Confirmar" onClick={() => confirmAppointment(a.id)}
                            style={{ background:'none',border:'none',cursor:'pointer',color:'#059669',padding:4,borderRadius:4 }}>
                            <Check size={15}/>
                          </button>
                          <button title="Rechazar" onClick={() => rejectAppointment(a.id)}
                            style={{ background:'none',border:'none',cursor:'pointer',color:'#DC2626',padding:4,borderRadius:4 }}>
                            <X size={15}/>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <Modal title="Detalle de cita" onClose={() => setDetail(null)}>
          <InfoRow icon={<User size={14}/>}     label="Cliente"   value={detail.clientName}/>
          <InfoRow icon={<Mail size={14}/>}     label="Email"     value={detail.clientEmail}/>
          <InfoRow icon={<Phone size={14}/>}    label="Teléfono"  value={detail.clientPhone}/>
          <InfoRow icon={<Leaf size={14}/>}     label="Servicio"  value={`${detail.serviceName} (${detail.serviceDuration} min)`}/>
          <InfoRow icon={<Calendar size={14}/>} label="Fecha"     value={fmtLong(detail.date)}/>
          <InfoRow icon={<Clock size={14}/>}    label="Hora"      value={`${detail.time} hrs`}/>
          {detail.notes && <InfoRow icon={<FileText size={14}/>} label="Notas" value={detail.notes}/>}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:6 }}>Estado</div>
            <StatusBadge status={detail.status}/>
          </div>
          {detail.status==='pending' && (
            <div style={{ display:'flex',gap:10 }}>
              <button className="btn-o" style={{ flex:1,color:'#059669',borderColor:'#059669' }}
                onClick={() => { confirmAppointment(detail.id); setDetail(d=>({...d,status:'confirmed'})); }}>
                <Check size={13} style={{ display:'inline',marginRight:4 }}/>Confirmar
              </button>
              <button className="btn-d" style={{ flex:1 }}
                onClick={() => { rejectAppointment(detail.id); setDetail(d=>({...d,status:'rejected'})); }}>
                <X size={13} style={{ display:'inline',marginRight:4 }}/>Rechazar
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
