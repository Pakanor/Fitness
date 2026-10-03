import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import BodyMeasurementForm from '../features/measurements/BodyMeasurementForm';
import { useAuth } from '../context/AuthContext';
import '../styles/tokens.css';

const DashboardStyles = `
  .dashboard-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-base);
  }

  .dashboard-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .dashboard-container {
    max-width: var(--container-wide);
    margin: 0 auto;
    padding: var(--space-6) var(--space-4);
    width: 100%;
  }

  .welcome-header {
    margin-bottom: var(--space-8);
  }

  .welcome-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--color-fg-primary);
    margin-bottom: var(--space-1);
  }

  .welcome-title-accent {
    color: var(--color-accent);
  }

  .welcome-subtitle {
    font-size: 14px;
    color: var(--color-fg-muted);
  }

  .measurements-required {
    max-width: var(--container-narrow);
    margin: 0 auto;
    width: 100%;
  }

  .measurements-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  .measurements-header {
    background: var(--color-bg-elevated);
    border-bottom: 1px solid var(--color-border-subtle);
    padding: var(--space-5) var(--space-6);
  }

  .measurements-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-fg-primary);
    margin-bottom: var(--space-1);
  }

  .measurements-description {
    font-size: 13px;
    color: var(--color-fg-secondary);
    line-height: 1.5;
  }

  .measurements-form-wrapper {
    padding: var(--space-6);
  }

  .quick-actions {
    max-width: var(--container-medium);
    margin: var(--space-10) auto 0;
    width: 100%;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-4);
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-5) var(--space-4);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: border-color var(--transition-base), background var(--transition-base), transform var(--transition-fast), box-shadow var(--transition-base);
    text-align: center;
    text-decoration: none;
    color: var(--color-fg-primary);
  }

  .action-btn:hover {
    border-color: var(--color-border-default);
    background: var(--color-bg-elevated);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .action-btn--primary {
    background: var(--color-accent);
    color: var(--color-bg-deep);
    border-color: transparent;
  }

  .action-btn--primary:hover {
    background: var(--color-accent-hover);
    box-shadow: 0 4px 16px rgba(252, 76, 2, 0.15);
  }

  .action-icon {
    font-size: 28px;
  }

  .action-title {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
  }

  .action-desc {
    font-size: 12px;
    color: var(--color-fg-muted);
  }

  .action-btn--primary .action-desc {
    color: rgba(13, 13, 15, 0.6);
  }

  @media (max-width: 600px) {
    .welcome-title {
      font-size: 22px;
    }

    .measurements-form-wrapper {
      padding: var(--space-4);
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function DashboardPage() {
  const navigate = useNavigate();
  const { hasMeasurements, refreshMeasurementStatus } = useAuth();

  if (!hasMeasurements) {
    return (
      <>
        <style>{DashboardStyles}</style>
        <div className="dashboard-page">
          <Header />
          <main className="dashboard-main" role="main">
            <div className="dashboard-container">
              <div className="welcome-header">
                <h1 className="welcome-title">
                  Uzupełnij pomiary, by spersonalizować <span className="welcome-title-accent">FitnessApp</span>
                </h1>
                <p className="welcome-subtitle">
                  Potrzebujemy wagi, wzrostu, wieku i celu, aby obliczyć zapotrzebowanie kaloryczne i przygotować plan treningowy.
                </p>
              </div>
              <div className="measurements-required">
                <div className="measurements-card">
                  <div className="measurements-header">
                    <div className="measurements-title">Pomiary ciała</div>
                    <p className="measurements-description">
                      Wypełnij poniższe dane. Wymagane pola są oznaczone gwiazdką. Pozostałe pomiary są opcjonalne — możesz je dodać później.
                    </p>
                  </div>
                  <div className="measurements-form-wrapper">
                    <BodyMeasurementForm
                      onSave={async () => { await refreshMeasurementStatus(); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{DashboardStyles}</style>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main" role="main">
          <div className="dashboard-container">
            <div className="welcome-header">
              <h1 className="welcome-title">
                Witaj w <span className="welcome-title-accent">FitnessApp</span>
              </h1>
              <p className="welcome-subtitle">Wybierz sekcję, aby rozpocząć</p>
            </div>

            <div className="quick-actions">
              <div className="actions-grid">
                <a
                  href="/exercises"
                  className="action-btn action-btn--primary"
                  onClick={(e) => { e.preventDefault(); navigate('/exercises'); }}
                >
                  <span className="action-icon" aria-hidden="true">🏋️</span>
                  <span className="action-title">Ćwiczenia</span>
                  <span className="action-desc">Rozpocznij trening</span>
                </a>
                <a
                  href="/calorie-tracker"
                  className="action-btn"
                  onClick={(e) => { e.preventDefault(); navigate('/calorie-tracker'); }}
                >
                  <span className="action-icon" aria-hidden="true">🍎</span>
                  <span className="action-title">Kalorie</span>
                  <span className="action-desc">Śledź spożycie</span>
                </a>
                <a
                  href="/records"
                  className="action-btn"
                  onClick={(e) => { e.preventDefault(); navigate('/records'); }}
                >
                  <span className="action-icon" aria-hidden="true">🏆</span>
                  <span className="action-title">Rekordy</span>
                  <span className="action-desc">Twoje osobiste besty</span>
                </a>
                <a
                  href="/exercises/history"
                  className="action-btn"
                  onClick={(e) => { e.preventDefault(); navigate('/exercises/history'); }}
                >
                  <span className="action-icon" aria-hidden="true">📋</span>
                  <span className="action-title">Historia</span>
                  <span className="action-desc">Przeglądaj treningi</span>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default DashboardPage;