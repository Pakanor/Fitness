import React from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .vp-page {
          min-height: 100vh;
          background: #0d0d0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }

        .vp-card {
          width: 100%;
          max-width: 440px;
          background: #16161a;
          border: 1px solid #1e1e22;
          border-radius: 16px;
          padding: 48px 36px;
          text-align: center;
        }

        .vp-icon {
          font-size: 52px;
          margin-bottom: 20px;
        }

        .vp-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #f0ede8;
          margin-bottom: 12px;
        }

        .vp-desc {
          font-size: 14px;
          color: #555;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .vp-btn {
          padding: 14px 28px;
          background: #c8f542;
          color: #0d0d0f;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .vp-btn:hover { background: #d4f55a; transform: translateY(-1px); }
        .vp-btn:active { transform: translateY(0); }
      `}</style>

      <div className="vp-page">
        <div className="vp-card">
          <div className="vp-icon">✉️</div>
          <div className="vp-title">Sprawdź skrzynkę</div>
          <div className="vp-desc">
            Na Twój adres e-mail został wysłany link weryfikacyjny. Kliknij w niego, aby aktywować konto.
          </div>
          <button className="vp-btn" onClick={() => navigate('/')}>
            Powrót na stronę główną
          </button>
        </div>
      </div>
    </>
  );
};

export default VerifyPage;