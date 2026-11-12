import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, Clock3, LogOut, Scissors, X } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, formatCurrency, formatDate } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const statusLabels = { confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };

export default function AccountPage() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    setLoading(true); setError('');
    try { const result = await api('/appointments'); setAppointments(result.appointments); }
    catch (issue) { setError(issue.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (!isAdmin) refresh(); }, [isAdmin]);

  async function cancel(appointment) {
    if (!window.confirm('Cancelar este horário?')) return;
    try { const result = await api(`/appointments/${appointment._id}`, { method: 'DELETE' }); setNotice(result.message); await refresh(); }
    catch (issue) { setError(issue.message); }
  }

  function logout() { signOut(); navigate('/'); }
  const upcoming = appointments.filter((appointment) => appointment.status === 'confirmed' && new Date(appointment.startsAt) > new Date());
  const past = appointments.filter((appointment) => !upcoming.includes(appointment));

  if (isAdmin) return <Navigate to="/admin" replace />;
  return <main className="account-page"><div className="account-hero"><div className="wrap account-hero-inner"><div><span className="eyebrow">ÁREA DA CREW</span><h1>Salve, <em>{user?.name?.split(' ')[0]}.</em></h1><p>Seu corre, seus horários, tudo num só lugar.</p></div><button className="button button-ghost-light" onClick={logout}><LogOut size={16} /> Sair</button></div></div>
    <div className="wrap account-content"><div className="account-welcome"><div><span className="eyebrow">MEUS AGENDAMENTOS</span><h2>Os próximos <em>capítulos.</em></h2></div><Link to="/agendar" className="button button-primary">Novo horário <ArrowUpRight size={16} /></Link></div>
      {notice && <div className="notice notice-success">{notice}</div>}{error && <div className="notice notice-error">{error}</div>}
      {loading ? <Loading label="Buscando seus horários..." /> : <>
        <h3 className="list-heading"><CalendarDays size={17} /> Próximos horários <span>{upcoming.length}</span></h3>
        {upcoming.length ? <div className="appointment-list">{upcoming.map((item) => <article key={item._id} className="appointment-card"><div className="appointment-date"><strong>{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Boa_Vista', day: '2-digit' }).format(new Date(item.startsAt))}</strong><span>{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Boa_Vista', month: 'short' }).format(new Date(item.startsAt)).replace('.', '').toUpperCase()}</span></div><div className="appointment-main"><span className="eyebrow">{item.service?.category}</span><h3>{item.service?.name}</h3><p><Clock3 size={14} /> {formatDate(item.startsAt)} · {item.service?.durationMinutes} min</p></div><div className="appointment-side"><span className="status-pill status-confirmed">{statusLabels[item.status]}</span><span>{item.barber?.name}</span><strong>{formatCurrency(item.priceAtBooking)}</strong></div><button className="appointment-cancel" onClick={() => cancel(item)} title="Cancelar agendamento" aria-label="Cancelar agendamento"><X size={17} /></button></article>)}</div> : <div className="empty-card"><span className="empty-icon"><Scissors /></span><h3>Nenhum corte marcado ainda.</h3><p>Seu próximo horário tá te esperando.</p><Link to="/agendar" className="button button-primary">Agendar agora <ArrowUpRight size={16} /></Link></div>}
        {past.length > 0 && <><h3 className="list-heading past-heading"><Clock3 size={17} /> Histórico <span>{past.length}</span></h3><div className="appointment-list appointment-history">{past.map((item) => <article key={item._id} className="appointment-card"><div className="appointment-date"><strong>{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Boa_Vista', day: '2-digit' }).format(new Date(item.startsAt))}</strong><span>{new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Boa_Vista', month: 'short' }).format(new Date(item.startsAt)).replace('.', '').toUpperCase()}</span></div><div className="appointment-main"><span className="eyebrow">{item.service?.category}</span><h3>{item.service?.name}</h3><p>{formatDate(item.startsAt)} · {item.barber?.name}</p></div><div className="appointment-side"><span className={`status-pill status-${item.status}`}>{statusLabels[item.status]}</span><strong>{formatCurrency(item.priceAtBooking)}</strong></div></article>)}</div></>}
      </>}
    </div></main>;
}
