import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, LockKeyhole, Scissors, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(form, mode) {
  const errors = {};
  if (mode === 'register' && form.name.trim().length < 2) errors.name = 'Informe seu nome (mínimo de 2 letras).';
  if (!form.email.trim()) errors.email = 'Informe seu e-mail.';
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'E-mail inválido. Use o formato nome@exemplo.com.';
  if (mode === 'register' && form.phone.trim()) {
    const digits = form.phone.replace(/\D/g, '').length;
    if (digits < 10 || digits > 11) errors.phone = 'Celular inválido. Use DDD + número, ex.: (95) 99999-9999.';
  }
  if (!form.password) errors.password = 'Informe sua senha.';
  else if (mode === 'register' && form.password.length < 8) errors.password = 'A senha precisa ter pelo menos 8 caracteres.';
  return errors;
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const { signIn, signUp, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = location.state?.from?.pathname ? `${location.state.from.pathname}${location.state.from.search || ''}` : '/minha-conta';

  async function submit(event) {
    event.preventDefault(); setError('');
    const errors = validateForm(form, mode);
    setFieldErrors(errors);
    if (Object.keys(errors).length) { setError('Confira os campos destacados abaixo.'); return; }
    setBusy(true);
    try {
      const user = mode === 'login' ? await signIn({ email: form.email, password: form.password }) : await signUp(form);
      const redirect = nextPath === '/minha-conta' && user.role === 'admin' ? '/admin' : nextPath;
      navigate(redirect, { replace: true });
    } catch (issue) {
      setError(issue.message);
      if (issue.details?.length) setFieldErrors(Object.fromEntries(issue.details.map((item) => [item.field, item.message])));
    } finally { setBusy(false); }
  }

  function update(field, value) {
    setForm({ ...form, [field]: value });
    if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: undefined });
  }
  function switchMode(next) { setMode(next); setError(''); setFieldErrors({}); }
  const fieldError = (field) => fieldErrors[field] && <small className="field-error" id={`${field}-error`} role="alert">{fieldErrors[field]}</small>;
  const invalidProps = (field) => (fieldErrors[field] ? { 'aria-invalid': true, 'aria-describedby': `${field}-error`, className: 'input-invalid' } : {});

  return <main className="auth-page"><div className="auth-visual"><img className="auth-photo" src="/images/estudio-interior.webp" alt="" aria-hidden="true" /><Link to="/" className="auth-brand"><Brand /></Link><div className="auth-visual-art"><span className="auth-big-type">STREET<br /><em>095</em></span></div><div className="auth-visual-foot"><span>CORTE NA RUA. ESTILO NA VIDA.</span><span>BOA VISTA · RR</span></div></div>
    <div className="auth-form-side"><Link to="/" className="auth-back"><ArrowLeft size={16} /> Voltar ao início</Link><div className="auth-form-wrap"><span className="eyebrow"><Scissors size={14} /> SUA CREW, SEU HORÁRIO</span><h1>{mode === 'login' ? <>Chega <em>junto.</em></> : <>Vem pra <em>crew.</em></>}</h1><p>{mode === 'login' ? 'Entre na sua conta para reservar seu próximo corte.' : 'Crie sua conta e deixe o próximo corte marcado.'}</p>
      <div className="auth-tabs"><button className={mode === 'login' ? 'auth-tab-active' : ''} onClick={() => switchMode('login')}>Entrar</button><button className={mode === 'register' ? 'auth-tab-active' : ''} onClick={() => switchMode('register')}>Criar conta</button></div>
      {!error && sessionExpired && <div className="notice notice-error" role="alert">Sua sessão expirou. Entre novamente para continuar.</div>}
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <form onSubmit={submit} className="auth-form" noValidate>
        {mode === 'register' && <label>Seu nome<input {...invalidProps('name')} autoComplete="name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Como a crew te chama?" maxLength="80" />{fieldError('name')}</label>}
        <label>E-mail<input {...invalidProps('email')} type="email" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="voce@email.com" />{fieldError('email')}</label>
        {mode === 'register' && <label>Celular <span className="optional-label">opcional</span><input {...invalidProps('phone')} type="tel" autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(95) 99999-9999" maxLength="20" />{fieldError('phone')}</label>}
        <label>Senha<div className={`password-wrap ${fieldErrors.password ? 'input-invalid' : ''}`}><LockKeyhole size={16} /><input aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mínimo de 8 caracteres" maxLength="72" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{fieldError('password')}</label>
        <button className="button button-primary button-full button-large" disabled={busy}>{busy ? <><span className="spinner spinner-dark" /> Aguarda aí...</> : <>{mode === 'login' ? 'Entrar na conta' : 'Criar minha conta'} <ArrowUpRight size={17} /></>}</button>
      </form><div className="auth-safe"><UserRound size={15} /><span>Seus dados ficam protegidos. A senha é armazenada com segurança.</span></div>
    </div></div></main>;
}
