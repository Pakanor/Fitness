import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/tokens.css';

const HomePageStyles = `
  .hp-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--color-bg-deep) 0%, var(--color-bg-base) 100%);
  }

  .hp-hero {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-16) var(--space-4) var(--space-12);
    position: relative;
    overflow: hidden;
  }

  .hp-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 20% 30%, rgba(252, 76, 2, 0.03) 0%, transparent 40%);
    pointer-events: none;
  }

  .hp-hero-inner {
    max-width: 600px;
    text-align: center;
    z-index: 1;
  }

  .hp-logo {
    font-family: var(--font-display);
    font-size: 48px;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: var(--space-4);
    line-height: 1;
    background: linear-gradient(90deg, var(--color-fg-primary), var(--color-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hp-logo span {
    color: var(--color-accent);
  }

  .hp-tagline {
    font-size: 18px;
    color: var(--color-fg-secondary);
    margin-bottom: var(--space-8);
    line-height: 1.6;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .hp-btns {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
  }

  .hp-btn-primary {
    padding: var(--space-3) var(--space-8);
    background: var(--color-accent);
    color: var(--color-bg-deep);
    border: none;
    border-radius: var(--radius-lg);
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
    letter-spacing: -0.2px;
  }

  .hp-btn-primary:hover {
    background: var(--color-accent-hover);
    box-shadow: 0 4px 16px rgba(252, 76, 2, 0.15);
    transform: translateY(-2px);
  }

  .hp-btn-primary:active {
    transform: translateY(0);
  }

  .hp-btn-secondary {
    padding: var(--space-3) var(--space-8);
    background: transparent;
    color: var(--color-fg-secondary);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
  }

  .hp-btn-secondary:hover {
    color: var(--color-fg-primary);
    background: var(--color-bg-input);
    border-color: var(--color-border-default);
  }

  .hp-section {
    padding: var(--space-16) var(--space-4);
  }

  .hp-section--spacious {
    padding: var(--space-20) var(--space-4) var(--space-16);
  }

  .hp-section-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    text-align: center;
    margin-bottom: var(--space-12);
    color: var(--color-fg-primary);
  }

  .hp-testimonials {
    margin-top: var(--space-4);
  }

  .hp-testimonial {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    margin-bottom: var(--space-4);
    transition: border-color var(--transition-base), box-shadow var(--transition-base);
  }

  .hp-testimonial:last-child {
    margin-bottom: 0;
  }

  .hp-testimonial-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }

  .hp-testimonial-avatar {
    width: 44px;
    height: 44px;
    background: var(--color-accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 16px;
    color: var(--color-bg-deep);
  }

  .hp-testimonial-name {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-fg-primary);
  }

  .hp-testimonial-quote {
    font-size: 15px;
    color: var(--color-fg-secondary);
    line-height: 1.6;
  }

  .hp-features .hp-feature {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    transition: transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
  }

  .hp-features .hp-feature:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-border-default);
  }

  .hp-feature-icon {
    font-size: 32px;
    margin-bottom: var(--space-2);
  }

  .hp-feature-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-fg-primary);
  }

  .hp-feature-desc {
    font-size: 13px;
    color: var(--color-fg-muted);
    line-height: 1.5;
  }

  @media (max-width: 700px) {
    .hp-hero {
      padding: var(--space-8) var(--space-4) var(--space-8);
    }

    .hp-logo {
      font-size: 36px;
    }

    .hp-tagline {
      font-size: 16px;
    }

    .hp-btns {
      flex-direction: column;
      gap: var(--space-3);
    }
  }
`;

const testimonials = [
  { name: 'Michał K.', quote: 'Świetna aplikacja! W końcu mam porządek w ćwiczeniach.' },
  { name: 'Kasia Z.', quote: 'Prosta, ale mega funkcjonalna. Licznik kalorii to sztos.' },
  { name: 'Tomek L.', quote: 'Zmotywowałem się do regularnych treningów. Polecam każdemu!' },
];

const features = [
  { icon: '🏆', title: 'Historia treningów', desc: 'Zapisuj i przeglądaj wszystkie swoje treningi w jednym miejscu.' },
  { icon: '📊', title: 'Statystyki i cele', desc: 'Śledź swoje postępy i osiągaj wyznaczone cele.' },
  { icon: '💡', title: 'Motywacja i przypomnienia', desc: 'Codzienna motywacja i przypomnienia o aktywności.' },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{HomePageStyles}</style>
      <div className="hp-page">
        <div className="hp-hero">
          <motion.div
            className="hp-hero-inner"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="hp-logo">
              Fitness<span>App</span>
            </div>
            <div className="hp-tagline">
              Aplikacja, która pomoże Ci osiągnąć formę życia.
            </div>
            <div className="hp-btns">
              <motion.button
                className="hp-btn-primary"
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                Rozpocznij
              </motion.button>
              <motion.button
                className="hp-btn-secondary"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                Mam już konto
              </motion.button>
            </div>
          </motion.div>
        </div>

        <section className="hp-section hp-section--spacious hp-testimonials">
          <div className="hp-section-title">Opinie użytkowników</div>
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="hp-testimonial hp-testimonial--card">
                <div className="hp-testimonial-header">
                  <div className="hp-testimonial-avatar">{t.name[0]}</div>
                  <span className="hp-testimonial-name">{t.name}</span>
                </div>
                <p className="hp-testimonial-quote">"{t.quote}"</p>
              </div>
            </motion.div>
          ))}
        </section>

        <section className="hp-section hp-features">
          <div className="hp-section-title">Dlaczego warto?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
              >
                <div className="hp-feature">
                  <div className="hp-feature-icon">{f.icon}</div>
                  <div className="hp-feature-title">{f.title}</div>
                  <div className="hp-feature-desc">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;