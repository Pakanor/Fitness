import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/authAPI';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';

const RegisterForm = () => {
  const [form, setForm] = useState({
    username: '', email: '', password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password
      };
      const res = await registerUser(payload);
      toast('Rejestracja udana: ' + res.message);
      window.location.href = '/verify';
    } catch (err) {
      setError(err.response?.data?.message || 'Nieznany błąd');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .rf-page { min-height: 100vh; background: #0d0d0f; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; padding: 20px; }
        .rf-card { width: 100%; max-width: 420px; background: #16161a; border: 1px solid #1e1e22; border-radius: 16px; padding: 36px 32px; }
        .rf-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #f0ede8; margin-bottom: 6px; letter-spacing: -0.5px; }
        .rf-subtitle { font-size: 13px; color: #555; margin-bottom: 28px; }
        .rf-field { margin-bottom: 16px; }
        .rf-label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #444; margin-bottom: 6px; font-weight: 500; }
        .rf-input { width: 100%; padding: 12px 14px; background: #0d0d0f; border: 1px solid #2a2a30; border-radius: 10px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
        .rf-input::placeholder { color: #333; }
        .rf-input:focus { border-color: #c8f542; }
        .rf-select { width: 100%; padding: 12px 14px; background: #0d0d0f; border: 1px solid #2a2a30; border-radius: 10px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; box-sizing: border-box; }
        .rf-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 12px 14px; color: #ef4444; font-size: 13px; margin-bottom: 16px; }
        .rf-submit { width: 100%; padding: 14px; background: #c8f542; color: #0d0d0f; border: none; border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s, transform 0.1s; margin-top: 8px; }
        .rf-submit:hover { background: #d4f55a; transform: translateY(-1px); }
        .rf-submit:active { transform: translateY(0); }
        .rf-login { text-align: center; margin-top: 20px; font-size: 13px; color: #555; }
        .rf-login a { color: #c8f542; text-decoration: none; font-weight: 500; }
        .rf-login a:hover { text-decoration: underline; }
        .rf-row { display: flex; gap: 12px; }
        .rf-row > * { flex: 1; }
      `}</style>

      <div className="rf-page">
        <div className="rf-card">
          <div className="rf-title">Fitness<span style={{ color: '#c8f542' }}>App</span></div>
          <div className="rf-subtitle">Utwórz nowe konto</div>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="rf-error">{error}</div>}

            <div className="rf-field">
              <label className="rf-label">Nazwa użytkownika</label>
              <input className="rf-input" name="username" value={form.username} onChange={handleChange} placeholder="np. jan_kowalski" required />
            </div>

            <div className="rf-field">
              <label className="rf-label">Email</label>
              <input className="rf-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="jan@example.com" required />
            </div>

            <div className="rf-field">
              <label className="rf-label">Hasło</label>
              <input className="rf-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>

            <button type="submit" className="rf-submit">Zarejestruj się</button>
          </form>

          <div className="rf-login">Masz już konto? <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#c8f542', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>Zaloguj się</button></div>
        </div>
      </div>
    </>
  );
};

export default RegisterForm;