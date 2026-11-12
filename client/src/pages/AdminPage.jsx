import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, Check, CircleDollarSign, Clock3, Plus, Scissors, Users, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { api, formatCurrency, formatDate } from '../lib/api';
import Loading from '../components/Loading';
import { barberAvatar } from '../lib/barberPhotos';

const categories = ['Cortes & Estilos', 'Barba & Rosto', 'Tratamentos & Rituais'];
const emptyService = { name: '', category: categories[0], description: '', durationMinutes: 30, price: 30, priceNote: '', featured: false };
const emptyBarber = { name: '', specialty: '', bio: '', avatarUrl: '' };
const servicePayload = (item) => ({ name: item.name, category: item.category, description: item.description, durationMinutes: Number(item.durationMinutes), price: Number(item.price), priceNote: item.priceNote || '', featured: Boolean(item.featured) });
const barberPayload = (item) => ({ name: item.name, specialty: item.specialty || '', bio: item.bio || '', avatarUrl: item.avatarUrl || '' });

function validateService(form) {
  const errors = {};
  const duration = Number(form.durationMinutes);
  const price = Number(form.price);
  if (form.name.trim().length < 2) errors.name = 'Informe o nome do serviço (mínimo de 2 letras).';
  const description = form.description.trim().length;
  if (description < 5 || description > 500) errors.description = 'A descrição deve ter entre 5 e 500 caracteres.';
  if (form.durationMinutes === '' || !Number.isInteger(duration) || duration < 10 || duration > 360) errors.durationMinutes = 'Duração entre 10 e 360 minutos.';
  if (form.price === '' || Number.isNaN(price) || price < 0 || price > 10000) errors.price = 'Preço entre R$ 0 e R$ 10.000.';
  return errors;
}

function validateBarber(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Informe o nome do barbeiro (mínimo de 2 letras).';
  const photo = form.avatarUrl.trim();
  if (photo && !/^https?:\/\/\S+$/i.test(photo) && !/^\/images\/[\w.-]+$/.test(photo)) errors.avatarUrl = 'Foto inválida. Use um link https://... ou um caminho /images/arquivo.webp.';
  return errors;
}

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [editingBarber, setEditingBarber] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [barberForm, setBarberForm] = useState(emptyBarber);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [live, setLive] = useState(false);

  async function load({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const [dashboard, allServices, allBarbers, allAppointments] = await Promise.all([
        api('/appointments/dashboard'), api('/services/manage'), api('/barbers/manage'), api('/appointments')
      ]);
      setStats(dashboard.stats); setToday(dashboard.todayAppointments); setServices(allServices.services); setBarbers(allBarbers.barbers); setAppointments(allAppointments.appointments);
    } catch (issue) { setError(issue.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const token = localStorage.getItem('street095_token');
    if (!token) return undefined;
    const socketUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
    const socket = io(socketUrl || undefined, { auth: { token } });
    socket.on('connect', () => setLive(true));
    socket.on('disconnect', () => setLive(false));
    socket.on('connect_error', () => setLive(false));
    socket.on('appointment:created', () => { setNotice('Novo agendamento chegou à agenda.'); load({ quiet: true }); });
    socket.on('appointment:updated', () => load({ quiet: true }));
    return () => socket.disconnect();
  }, []);

  const appointmentsByDate = useMemo(() => [...appointments].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)), [appointments]);
  function openNewService() { resetModalErrors(); setEditingService(null); setServiceForm(emptyService); setModal('service'); }
  function openEditService(item) { resetModalErrors(); setEditingService(item); setServiceForm(servicePayload(item)); setModal('service'); }
  function openNewBarber() { resetModalErrors(); setEditingBarber(null); setBarberForm(emptyBarber); setModal('barber'); }
  function openEditBarber(item) { resetModalErrors(); setEditingBarber(item); setBarberForm(barberPayload(item)); setModal('barber'); }

  function resetModalErrors() { setModalError(''); setFieldErrors({}); }
  function showFormErrors(issue) {
    setModalError(issue.message);
    if (issue.details?.length) setFieldErrors(Object.fromEntries(issue.details.filter((item) => item.field).map((item) => [item.field, item.message])));
  }
  function checkForm(errors) {
    setFieldErrors(errors);
    if (Object.keys(errors).length) { setModalError('Confira os campos destacados.'); return false; }
    setModalError(''); return true;
  }
  function updateService(field, value) { setServiceForm({ ...serviceForm, [field]: value }); if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: undefined }); }
  function updateBarber(field, value) { setBarberForm({ ...barberForm, [field]: value }); if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: undefined }); }
  const fieldError = (field) => fieldErrors[field] && <small className="field-error" id={`admin-${field}-error`} role="alert">{fieldErrors[field]}</small>;
  const invalidProps = (field) => (fieldErrors[field] ? { 'aria-invalid': true, 'aria-describedby': `admin-${field}-error`, className: 'input-invalid' } : {});

  async function saveService(event) {
    event.preventDefault();
    if (!checkForm(validateService(serviceForm))) return;
    setSaving(true);
    try {
      const path = editingService ? `/services/${editingService._id}` : '/services';
      const result = await api(path, { method: editingService ? 'PUT' : 'POST', body: JSON.stringify(servicePayload(serviceForm)) });
      setNotice(result.message); setModal(''); await load();
    } catch (issue) { showFormErrors(issue); }
    finally { setSaving(false); }
  }
  async function saveBarber(event) {
    event.preventDefault();
    if (!checkForm(validateBarber(barberForm))) return;
    setSaving(true);
    try {
      const path = editingBarber ? `/barbers/${editingBarber._id}` : '/barbers';
      const result = await api(path, { method: editingBarber ? 'PUT' : 'POST', body: JSON.stringify(barberPayload(barberForm)) });
      setNotice(result.message); setModal(''); await load();
    } catch (issue) { showFormErrors(issue); }
    finally { setSaving(false); }
  }
  async function removeItem(kind, item) {
    if (!window.confirm(`Excluir ${item.name}? Se houver agendamentos no histórico, o item será apenas desativado.`)) return;
    try { const result = await api(`/${kind}/${item._id}`, { method: 'DELETE' }); setNotice(result.message); await load(); }
    catch (issue) { setError(issue.message); }
  }
  async function reactivate(kind, item) {
    const payload = kind === 'services' ? servicePayload(item) : barberPayload(item);
    try { await api(`/${kind}/${item._id}`, { method: 'PUT', body: JSON.stringify({ ...payload, active: true }) }); setNotice(`${item.name} voltou para a lista ativa.`); await load(); }
    catch (issue) { setError(issue.message); }
  }
  async function changeStatus(item, status) {
    try { const result = await api(`/appointments/${item._id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); setNotice(result.message); await load(); }
    catch (issue) { setError(issue.message); }
  }

  return <main className="admin-page"><div className="admin-top"><div className="wrap admin-top-inner"><div><span className="eyebrow">BACKSTAGE / STREET 095</span><h1>O corre da <em>crew.</em></h1><p>Gerencie os horários, o menu e quem faz a mágica.</p></div><div className="admin-badges"><span className="admin-badge"><span /> ADMINISTRADOR</span><span className={`admin-live ${live ? 'admin-live-on' : ''}`}><i /> {live ? 'AGENDA EM TEMPO REAL' : 'CONECTANDO A AGENDA'}</span></div></div></div>
    <div className="wrap admin-content"><nav className="admin-tabs" aria-label="Seções administrativas">{[['overview', 'Visão geral'], ['appointments', 'Agendamentos'], ['services', 'Serviços'], ['barbers', 'Equipe']].map(([key, label]) => <button key={key} className={tab === key ? 'admin-tab-active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav>
      {notice && <div className="notice notice-success">{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15} /></button></div>}{error && <div className="notice notice-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Fechar aviso"><X size={15} /></button></div>}
      {loading ? <Loading label="Abrindo o backstage..." /> : <>
        {tab === 'overview' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">AGORA NA CASA</span><h2>Visão geral <em>do estúdio.</em></h2></div><button className="button button-primary" onClick={() => setTab('appointments')}>Ver agenda <ArrowUpRight size={16} /></button></div>
          <div className="stats-grid"><div className="stat-card"><span>HOJE NA CADEIRA <CalendarDays /></span><strong>{stats?.today ?? 0}</strong><small>agendamentos ativos</small></div><div className="stat-card"><span>PRÓXIMOS HORÁRIOS <Clock3 /></span><strong>{stats?.upcoming ?? 0}</strong><small>reservas confirmadas</small></div><div className="stat-card"><span>CREW CADASTRADA <Users /></span><strong>{stats?.customers ?? 0}</strong><small>clientes ativos</small></div><div className="stat-card"><span>SERVIÇOS FEITOS <CircleDollarSign /></span><strong>{stats?.completed ?? 0}</strong><small>atendimentos concluídos</small></div></div>
          <div className="admin-subheading"><h3><CalendarDays size={17} /> Agenda de hoje</h3><button className="text-link" onClick={() => setTab('appointments')}>Ver todos <ArrowUpRight size={15} /></button></div>
          <AppointmentTable items={today} onStatus={changeStatus} />
        </section>}
        {tab === 'appointments' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">AGENDA COMPLETA</span><h2>Horário por <em>horário.</em></h2></div></div><AppointmentTable items={appointmentsByDate} onStatus={changeStatus} /></section>}
        {tab === 'services' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">MENU STREET</span><h2>Os serviços <em>da casa.</em></h2></div><button className="button button-primary" onClick={openNewService}><Plus size={17} /> Novo serviço</button></div><div className="manage-list">{services.map((item) => <div key={item._id} className={`manage-row ${!item.active ? 'manage-inactive' : ''}`}><div className="manage-icon"><Scissors /></div><div className="manage-main"><strong>{item.name}</strong><span>{item.category} · {item.durationMinutes} min</span></div><strong className="manage-price">{item.priceNote || formatCurrency(item.price)}</strong><span className={`status-pill ${item.active ? 'status-confirmed' : 'status-cancelled'}`}>{item.active ? 'Ativo' : 'Inativo'}</span><div className="manage-actions"><button onClick={() => openEditService(item)}>Editar</button>{item.active ? <button className="danger-link" onClick={() => removeItem('services', item)}>Excluir</button> : <button onClick={() => reactivate('services', item)}>Reativar</button>}</div></div>)}</div></section>}
        {tab === 'barbers' && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">QUEM FAZ</span><h2>A crew <em>do estúdio.</em></h2></div><button className="button button-primary" onClick={openNewBarber}><Plus size={17} /> Novo barbeiro</button></div><div className="manage-list">{barbers.map((item) => <div key={item._id} className={`manage-row ${!item.active ? 'manage-inactive' : ''}`}><div className="barber-avatar">{barberAvatar(item) ? <img src={barberAvatar(item)} alt="" /> : item.name[0]}</div><div className="manage-main"><strong>{item.name}</strong><span>{item.specialty}</span></div><span className={`status-pill ${item.active ? 'status-confirmed' : 'status-cancelled'}`}>{item.active ? 'Ativo' : 'Inativo'}</span><div className="manage-actions"><button onClick={() => openEditBarber(item)}>Editar</button>{item.active ? <button className="danger-link" onClick={() => removeItem('barbers', item)}>Excluir</button> : <button onClick={() => reactivate('barbers', item)}>Reativar</button>}</div></div>)}</div></section>}
      </>}
    </div>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(''); }}><div className="form-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="eyebrow">BACKSTAGE / CADASTRO</span><h2 id="modal-title">{modal === 'service' ? (editingService ? 'Editar serviço' : 'Novo serviço') : (editingBarber ? 'Editar barbeiro' : 'Adicionar à crew')}</h2></div><button onClick={() => setModal('')} aria-label="Fechar"><X /></button></div>
      {modalError && <div className="notice notice-error" role="alert">{modalError}</div>}
      {modal === 'service' ? <form className="admin-form" onSubmit={saveService} noValidate>
        <label>Nome do serviço<input {...invalidProps('name')} maxLength="80" value={serviceForm.name} onChange={(e) => updateService('name', e.target.value)} />{fieldError('name')}</label>
        <label>Categoria<select value={serviceForm.category} onChange={(e) => updateService('category', e.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Descrição<textarea {...invalidProps('description')} maxLength="500" rows="3" value={serviceForm.description} onChange={(e) => updateService('description', e.target.value)} />{fieldError('description')}</label>
        <div className="admin-form-row"><label>Duração (min)<input {...invalidProps('durationMinutes')} type="number" step="5" value={serviceForm.durationMinutes} onChange={(e) => updateService('durationMinutes', e.target.value)} />{fieldError('durationMinutes')}</label><label>Preço (R$)<input {...invalidProps('price')} type="number" step="0.01" value={serviceForm.price} onChange={(e) => updateService('price', e.target.value)} />{fieldError('price')}</label></div>
        <label>Observação do preço <span className="optional-label">opcional · ex.: A partir de R$ 120</span><input maxLength="100" value={serviceForm.priceNote} onChange={(e) => updateService('priceNote', e.target.value)} /></label>
        <button className="button button-primary button-full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar serviço'} <Check size={16} /></button>
      </form> : <form className="admin-form" onSubmit={saveBarber} noValidate>
        <label>Nome<input {...invalidProps('name')} maxLength="80" value={barberForm.name} onChange={(e) => updateBarber('name', e.target.value)} />{fieldError('name')}</label>
        <label>Especialidade<input maxLength="100" value={barberForm.specialty} onChange={(e) => updateBarber('specialty', e.target.value)} /></label>
        <label>Apresentação<textarea maxLength="400" rows="3" value={barberForm.bio} onChange={(e) => updateBarber('bio', e.target.value)} /></label>
        <label>Foto <span className="optional-label">opcional · https://... ou /images/arquivo.webp</span><input {...invalidProps('avatarUrl')} type="text" placeholder="/images/barbeiro-nox.webp" value={barberForm.avatarUrl} onChange={(e) => updateBarber('avatarUrl', e.target.value)} />{fieldError('avatarUrl')}</label>
        <button className="button button-primary button-full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar barbeiro'} <Check size={16} /></button>
      </form>}</div></div>}
  </main>;
}

function AppointmentTable({ items, onStatus }) {
  if (!items.length) return <div className="empty-state">Nenhum agendamento por aqui ainda.</div>;
  return <div className="table-scroll"><table className="admin-table"><thead><tr><th>HORÁRIO</th><th>CLIENTE</th><th>SERVIÇO</th><th>BARBEIRO</th><th>VALOR</th><th>STATUS</th><th>AÇÃO</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td><strong>{formatDate(item.startsAt)}</strong></td><td>{item.customer?.name}<small>{item.customer?.phone}</small></td><td>{item.service?.name}</td><td>{item.barber?.name}</td><td>{formatCurrency(item.priceAtBooking)}</td><td><span className={`status-pill status-${item.status}`}>{item.status === 'confirmed' ? 'Confirmado' : item.status === 'completed' ? 'Concluído' : 'Cancelado'}</span></td><td>{item.status === 'confirmed' && <div className="table-actions"><button title="Marcar como concluído" onClick={() => onStatus(item, 'completed')}><Check size={15} /></button><button title="Cancelar" onClick={() => onStatus(item, 'cancelled')}><X size={15} /></button></div>}</td></tr>)}</tbody></table></div>;
}
