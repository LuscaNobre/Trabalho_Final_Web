import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Scissors, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, formatCurrency, formatDate, toQuery } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { barberAvatar } from '../lib/barberPhotos';

function nextOpenDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while ([0, 1].includes(date.getDay())) date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function readBookingDraft() {
  try { return JSON.parse(sessionStorage.getItem('street095_booking_draft') || '{}'); }
  catch (_error) { sessionStorage.removeItem('street095_booking_draft'); return {}; }
}

function emptySlotsMessage(date) {
  if (!date) return 'Escolha uma data para ver os horários.';
  const weekday = new Date(`${date}T12:00:00-04:00`).getUTCDay();
  if (weekday === 0 || weekday === 1) return 'Fechado neste dia. Atendemos de terça a sábado, das 9h às 19h.';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Boa_Vista' });
  if (date < today) return 'Essa data já passou. Escolha uma data a partir de hoje.';
  if (date === today) return 'Os horários de hoje já passaram ou estão ocupados. Tenta outro dia.';
  return 'Todos os horários desse barbeiro estão ocupados nessa data. Tenta outro dia ou outro barbeiro.';
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const draft = searchParams.get('resume') === '1' ? readBookingDraft() : {};
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [serviceId, setServiceId] = useState(searchParams.get('serviceId') || draft.serviceId || '');
  const [barberId, setBarberId] = useState(draft.barberId || '');
  const [date, setDate] = useState(draft.date || nextOpenDate);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(draft.slot || '');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([api('/services'), api('/barbers')]).then(([s, b]) => {
      setServices(s.services); setBarbers(b.barbers);
      if (!searchParams.get('serviceId') && !draft.serviceId && s.services.length) setServiceId(s.services[0]._id);
      if (!draft.barberId && b.barbers.length) setBarberId(b.barbers[0]._id);
    }).catch((issue) => setError(issue.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!serviceId || !barberId || !date) return;
    const selectedSlot = slot;
    setSlotsLoading(true);
    api(`/appointments/availability?${toQuery({ serviceId, barberId, date })}`).then((result) => {
      setSlots(result.slots);
      if (selectedSlot && !result.slots.some((item) => item.label === selectedSlot)) setSlot('');
    }).catch((issue) => { setSlots([]); setSlot(''); setError(issue.message); }).finally(() => setSlotsLoading(false));
  }, [serviceId, barberId, date]);

  const service = useMemo(() => services.find((item) => item._id === serviceId), [services, serviceId]);
  const barber = useMemo(() => barbers.find((item) => item._id === barberId), [barbers, barberId]);

  async function confirmBooking() {
    if (!slot || !serviceId || !barberId) { setError('Escolha o serviço, o barbeiro e um horário.'); return; }
    if (!user) {
      sessionStorage.setItem('street095_booking_draft', JSON.stringify({ serviceId, barberId, date, slot }));
      navigate('/entrar', { state: { from: { pathname: '/agendar', search: '?resume=1' } } }); return;
    }
    setBusy(true); setError('');
    try {
      const startsAt = new Date(`${date}T${slot}:00-04:00`).toISOString();
      await api('/appointments', { method: 'POST', body: JSON.stringify({ serviceId, barberId, startsAt }) });
      sessionStorage.removeItem('street095_booking_draft'); setSlots((current) => current.filter((item) => item.label !== slot)); setSuccess('Horário reservado. A crew já está te esperando!');
    } catch (issue) { setError(issue.message); }
    finally { setBusy(false); }
  }

  const minDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Boa_Vista' });

  if (loading) return <main className="page-loading"><Loading label="Preparando a agenda..." /></main>;
  return <main className="booking-page"><div className="booking-heading wrap"><Link to="/" className="back-link"><ArrowLeft size={16} /> Voltar ao início</Link><span className="eyebrow">SUA PRÓXIMA VISITA</span><h1>Marca teu <em>horário.</em></h1><p>Escolhe os detalhes e deixa o resto com a crew.</p></div>
    <div className="booking-layout wrap"><section className="booking-form-panel">
      <div className="booking-step"><span className="step-number">01</span><div><h2>Escolha o serviço</h2><p>Qual é o movimento de hoje?</p></div></div>
      <div className="booking-service-list">{services.map((item) => <button key={item._id} onClick={() => { setServiceId(item._id); setSuccess(''); }} className={`booking-service ${serviceId === item._id ? 'booking-service-selected' : ''}`}><span className="booking-radio">{serviceId === item._id && <span />}</span><span className="booking-service-name"><strong>{item.name}</strong><small>{item.durationMinutes} min · {item.category}</small></span><strong>{item.priceNote || formatCurrency(item.price)}</strong></button>)}</div>
      <div className="booking-step"><span className="step-number">02</span><div><h2>Escolha o barbeiro</h2><p>Com quem você vai fechar?</p></div></div>
      <div className="booking-barber-list">{barbers.map((item) => <button key={item._id} onClick={() => { setBarberId(item._id); setSuccess(''); }} className={`booking-barber ${barberId === item._id ? 'booking-barber-selected' : ''}`}><span className="barber-avatar">{barberAvatar(item) ? <img src={barberAvatar(item)} alt="" /> : item.name[0]}</span><span><strong>{item.name}</strong><small>{item.specialty}</small></span>{barberId === item._id && <Check size={16} />}</button>)}</div>
      <div className="booking-step"><span className="step-number">03</span><div><h2>Escolha data e horário</h2><p>A agenda abre de terça a sábado.</p></div></div>
      <label className="date-field">Data da visita<input type="date" min={minDate} value={date} onChange={(event) => { setDate(event.target.value); setSuccess(''); setError(''); }} /></label>
      {slotsLoading ? <Loading label="Procurando horários livres..." /> : slots.length ? <div className="slot-grid">{slots.map((item) => <button key={item.startsAt} onClick={() => { setSlot(item.label); setSuccess(''); }} className={`slot-button ${slot === item.label ? 'slot-selected' : ''}`}>{item.label}</button>)}</div> : <div className="empty-slots">{emptySlotsMessage(date)}</div>}
      {error && <div className="notice notice-error" role="alert">{error}</div>}{success && <div className="notice notice-success" role="status"><Check size={17} /> {success} <Link to="/minha-conta">Ver meus agendamentos</Link></div>}
      <button onClick={confirmBooking} disabled={busy || !slot || Boolean(success)} className="button button-primary button-full button-large">{busy ? <><span className="spinner spinner-dark" /> Confirmando...</> : <>Confirmar agendamento <ArrowRight size={17} /></>}</button>
      {!user && <p className="booking-login-note"><ShieldCheck size={15} /> Você entra na sua conta ao confirmar. <Link to="/entrar">Já tem cadastro?</Link></p>}
    </section>
    <aside className="booking-summary"><span className="eyebrow">RESUMO DA VISITA</span><div className="summary-mark"><Scissors /></div><h2>Na moral,<br /><em>no horário.</em></h2><div className="summary-list"><div><span>Serviço</span><strong>{service?.name || 'Escolha um serviço'}</strong></div><div><span>Profissional</span><strong>{barber?.name || 'Escolha um barbeiro'}</strong></div><div><span>Data e hora</span><strong>{slot ? formatDate(new Date(`${date}T${slot}:00-04:00`)) : 'Selecione um horário'}</strong></div><div><span>Duração</span><strong>{service ? `${service.durationMinutes} min` : '—'}</strong></div></div><div className="summary-total"><span>Total estimado</span><strong>{service ? (service.priceNote || formatCurrency(service.price)) : '—'}</strong></div><div className="summary-note"><Clock3 size={15} /><span>Terça a sábado, das 9h às 19h.<br />Intervalo da crew: 12h às 13h.</span></div></aside></div>
  </main>;
}
