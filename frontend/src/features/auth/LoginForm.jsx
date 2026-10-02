import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, fetchMe } from '../../api/authAPI';
import { toast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const [form, setForm] = useState({ EmailOrLogin: '', Password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loginUser(form);
      const me = await fetchMe();
      setUser(me);
      toast('Logowanie udane!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Nieznany błąd');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .lf-page {
          min-height: 100vh;
          background: #0d0d0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }

        .lf-card {
          width: 100%;
          max-width: 400px;
          background: #16161a;
          border: 1px solid #1e1e22;
          border-radius: 16px;
          padding: 36px 32px;
        }

        .lf-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #f0ede8;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .lf-subtitle {
          font-size: 13px;
          color: #555;
          margin-bottom: 28px;
        }

        .lf-field { margin-bottom: 16px; }

        .lf-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #444;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .lf-input {
          width: 100%;
          padding: 12px 14px;
          background: #0d0d0f;
          border: 1px solid #2a2a30;
          border-radius: 10px;
          color: #f0ede8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .lf-input::placeholder { color: #333; }
        .lf-input:focus { border-color: #c8f542; }

        .lf-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 12px 14px;
          color: #ef4444;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .lf-submit {
          width: 100%;
          padding: 14px;
          background: #c8f542;
          color: #0d0d0f;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          margin-top: 8px;
        }

        .lf-submit:hover { background: #d4f55a; transform: translateY(-1px); }
        .lf-submit:active { transform: translateY(0); }

        .lf-register {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #555;
        }

        .lf-register a {
          color: #c8f542;
          text-decoration: none;
          font-weight: 500;
        }

        .lf-register a:hover { text-decoration: underline; }
      `}</style>

      <div className="lf-page">
        <div className="lf-card">
          <div className="lf-title">Fitness<span style={{ color: '#c8f542' }}>App</span></div>
          <div className="lf-subtitle">Zaloguj się do swojego konta</div>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="lf-error">{error}</div>}

            <div className="lf-field">
              <label className="lf-label">Email lub login</label>
              <input
                className="lf-input"
                type="text"
                value={form.EmailOrLogin}
                onChange={(e) => setForm({ ...form, EmailOrLogin: e.target.value })}
                placeholder="jan@example.com"
                required
              />
            </div>

            <div className="lf-field">
              <label className="lf-label">Hasło</label>
              <input
                className="lf-input"
                type="password"
                value={form.Password}
                onChange={(e) => setForm({ ...form, Password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="lf-submit">
              Zaloguj się
            </button>
          </form>

          <div className="lf-register">
            Nie masz konta? <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: '#c8f542', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>Zarejestruj się</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;