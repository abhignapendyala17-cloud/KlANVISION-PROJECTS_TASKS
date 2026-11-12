import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const blank = { name: '', email: '', password: '', phone: '', address: '' };

export default function AuthPage() {
  const [params] = useSearchParams();
  const [registering, setRegistering] = useState(params.get('mode') === 'register');
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, authLoading, login, register } = useApp();
  const navigate = useNavigate();
  const rawNext = params.get('next') || '';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/login') ? rawNext : '';

  if (authLoading) return <div className="page-shell"><div className="loading"><span className="spinner" />Checking your session…</div></div>;
  if (user) return <Navigate to={next || (user.role === 'admin' ? '/admin/products' : '/')} replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (registering && (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.password.length < 10 || !/^\d{10}$/.test(form.phone) || !form.address.trim())) {
      setError('Complete each field. Use a valid email, a 10-character password, and a 10-digit phone.');
      return;
    }
    setSubmitting(true);
    try {
      const signedInUser = registering ? await register(form) : await login({ email: form.email, password: form.password });
      navigate(next || (signedInUser.role === 'admin' ? '/admin/products' : '/'), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  }
  function switchMode(nextRegistering) {
    setRegistering(nextRegistering);
    setError('');
    setForm(blank);
  }
  return <div className="page-shell auth-page">
    <div className="auth-art"><span className="eyebrow">WELCOME TO SHOPEASE</span><div className="auth-art-object">S<span>.</span></div><p>Good things,<br /><em>better living.</em></p><span className="auth-art-note">EVERYDAY FINDS · MEMBER ACCESS</span></div>
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-tabs"><button type="button" className={!registering ? 'active' : ''} onClick={() => switchMode(false)}>Sign in</button><button type="button" className={registering ? 'active' : ''} onClick={() => switchMode(true)}>Create account</button></div>
      <span className="eyebrow">{registering ? 'A MORE PERSONAL EDIT' : 'WELCOME BACK'}</span>
      <h1>{registering ? 'Make yourself at home.' : 'Good to see you.'}</h1>
      <p className="auth-intro">{registering ? 'Create a customer account to keep your bag and delivery details together.' : 'Sign in to continue to your bag and account.'}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {registering && <label className="auth-field">Full name<input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>}
      <label className="auth-field">Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
      <label className="auth-field">Password<input type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 10 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
      {registering && <>
        <label className="auth-field">10-digit phone<input type="tel" autoComplete="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></label>
        <label className="auth-field">Delivery address<textarea autoComplete="street-address" rows="2" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required /></label>
      </>}
      <button className="button button-dark button-wide auth-submit" disabled={submitting}>{submitting ? 'One moment…' : registering ? 'Create customer account' : 'Sign in'} <span>↗</span></button>
      <p className="auth-switch">{registering ? 'Already a member?' : 'New around here?'} <button type="button" onClick={() => switchMode(!registering)}>{registering ? 'Sign in' : 'Create an account'}</button></p>
    </form>
  </div>;
}
