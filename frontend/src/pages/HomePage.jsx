import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const testimonials = [
  { name: 'Michał K.', quote: 'Świetna aplikacja! W końcu mam porządek w ćwiczeniach.' },
  { name: 'Kasia Z.', quote: 'Prosta, ale mega funkcjonalna. Licznik kalorii to sztos.' },
  { name: 'Tomek L.', quote: 'Zmotywowałem się do regularnych treningów. Polecam każdemu!' },
];

const features = [
  { icon: '📈', title: 'Historia treningów', desc: 'Zapisuj i przeglądaj wszystkie swoje treningi w jednym miejscu.' },
  { icon: '🎯', title: 'Statystyki i cele', desc: 'Śledź swoje postępy i osiągaj wyznaczone cele.' },
  { icon: '⚡', title: 'Motywacja i przypomnienia', desc: 'Codzienna motywacja i przypomnienia o aktywności.' },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .hp-page {
          background: #0d0d0f;
          color: #f0ede8;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        .hp-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 20px;
          border-bottom: 1px solid #1e1e22;
        }

        .hp-hero-inner { max-width: 600px; }

        .hp-logo {
          font-family: 'Syne', sans-serif;
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 16px;
          line-height: 1;
        }

        .hp-logo span { color: #c8f542; }

        .hp-tagline {
          font-size: 17px;
          color: #666;
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .hp-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .hp-btn-primary {
          padding: 14px 32px;
          background: #c8f542;
          color: #0d0d0f;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .hp-btn-primary:hover { background: #d4f55a; transform: translateY(-1px); }

        .hp-btn-secondary {
          padding: 14px 32px;
          background: none;
          color: #888;
          border: 1px solid #2a2a30;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .hp-btn-secondary:hover { color: #f0ede8; border-color: #555; }

        .hp-section {
          max-width: 960px;
          margin: 0 auto;
          padding: 80px 20px;
        }

        .hp-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 48px;
          color: #f0ede8;
        }

        .hp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .hp-testimonial {
          background: #16161a;
          border: 1px solid #1e1e22;
          border-radius: 14px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hp-testimonial-avatar {
          width: 40px;
          height: 40px;
          background: #c8f542;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: #0d0d0f;
        }

        .hp-testimonial-quote {
          font-size: 14px;
          color: #aaa;
          line-height: 1.6;
          flex: 1;
        }

        .hp-testimonial-name {
          font-size: 12px;
          color: #555;
          font-weight: 500;
        }

        .hp-features-section {
          border-top: 1px solid #1e1e22;
          background: #0d0d0f;
        }

        .hp-feature {
          background: #16161a;
          border: 1px solid #1e1e22;
          border-radius: 14px;
          padding: 32px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .hp-feature-icon {
          font-size: 36px;
          margin-bottom: 4px;
        }

        .hp-feature-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #f0ede8;
        }

        .hp-feature-desc {
          font-size: 13px;
          color: #555;
          line-height: 1.6;
        }
      `}</style>

      <div className="hp-page">
        <div className="hp-hero">
          <motion.div
            className="hp-hero-inner"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="hp-logo">Fitness<span>App</span></div>
            <div className="hp-tagline">Aplikacja, która pomoże Ci osiągnąć formę życia.</div>
            <div className="hp-btns">
              <button className="hp-btn-primary" onClick={() => navigate('/register')}>Rozpocznij</button>
              <button className="hp-btn-secondary" onClick={() => navigate('/login')}>Mam już konto</button>
            </div>
          </motion.div>
        </div>

        <div className="hp-section">
          <div className="hp-section-title">Opinie użytkowników</div>
          <div className="hp-grid">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="hp-testimonial">
                  <div className="hp-testimonial-avatar">{t.name[0]}</div>
                  <div className="hp-testimonial-quote">"{t.quote}"</div>
                  <div className="hp-testimonial-name">— {t.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="hp-features-section">
          <div className="hp-section">
            <div className="hp-section-title">Dlaczego warto?</div>
            <div className="hp-grid">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                >
                  <div className="hp-feature">
                    <div className="hp-feature-icon">{f.icon}</div>
                    <div className="hp-feature-title">{f.title}</div>
                    <div className="hp-feature-desc">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;