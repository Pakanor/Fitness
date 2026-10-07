import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../api/authAPI';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from '../../components/common/Toast';

const HeaderStyles = `
  .header {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    height: var(--header-height);
    background: color-mix(in srgb, var(--color-bg-base) 88%, transparent);
    backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4);
    width: 100%;
    box-sizing: border-box;
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: var(--container-wide);
    margin: 0 auto;
  }

  .header-logo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.5px;
    color: var(--color-fg-primary);
    text-decoration: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 2px;
    transition: opacity var(--transition-fast);
  }

  .header-logo:hover {
    opacity: 0.8;
  }

  .header-logo-accent {
    color: var(--color-accent);
  }

  .header-nav {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .nav-link {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-fg-muted);
    text-decoration: none;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    border: none;
    background: none;
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
    white-space: nowrap;
  }

  .nav-link:hover {
    color: var(--color-fg-primary);
    background: var(--color-bg-input);
  }

  .nav-link--active {
    color: var(--color-accent);
    background: var(--color-accent-dim);
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--color-fg-muted);
  }

  .theme-toggle:hover {
    color: var(--color-accent);
  }

  .theme-toggle svg {
    display: block;
  }

  .account-wrap {
    position: relative;
  }

  .account-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-fg-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    transition: color var(--transition-fast), background var(--transition-fast);
  }

  .account-btn:hover {
    color: var(--color-fg-primary);
    background: var(--color-bg-input);
  }

  .chevron {
    font-size: 9px;
    color: var(--color-fg-disabled);
    transition: transform var(--transition-base);
    line-height: 1;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .account-dropdown {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-2);
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    animation: dropdownIn var(--transition-base) ease-out;
  }

  @keyframes dropdownIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-item {
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--color-fg-secondary);
    text-decoration: none;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: color var(--transition-fast), background var(--transition-fast);
    display: block;
    width: 100%;
  }

  .dropdown-item:hover {
    color: var(--color-fg-primary);
    background: var(--color-bg-input);
  }

  .dropdown-item--danger {
    color: var(--color-error);
  }

  .dropdown-item--danger:hover {
    background: var(--color-error-dim);
  }

  .dropdown-divider {
    height: 1px;
    background: var(--color-border-subtle);
    margin: var(--space-2) 0;
  }

  .hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2);
  }

  .hamburger-line {
    width: 24px;
    height: 2px;
    background: var(--color-fg-primary);
    border-radius: 2px;
    transition: transform var(--transition-base), opacity var(--transition-base);
    display: block;
  }

  .hamburger-line.open-1 {
    transform: rotate(45deg) translate(5px, 5px);
  }

  .hamburger-line.open-2 {
    opacity: 0;
  }

  .hamburger-line.open-3 {
    transform: rotate(-45deg) translate(5px, -5px);
  }

  .mobile-menu {
    display: none;
    flex-direction: column;
    background: var(--color-bg-base);
    border-top: 1px solid var(--color-border-subtle);
    padding: var(--space-3) var(--space-4);
    gap: var(--space-1);
    position: sticky;
    top: var(--header-height);
    z-index: calc(var(--z-sticky) - 1);
  }

  .mobile-menu.open {
    display: flex;
    animation: slideDown var(--transition-base) ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mobile-menu .nav-link {
    justify-content: flex-start;
    text-align: left;
    width: 100%;
  }

  @media (max-width: 600px) {
    .header-nav {
      display: none;
    }
    .hamburger {
      display: flex;
    }
  }
`;

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    toast('Wylogowano');
    navigate('/login');
  };

  const handleDropdownClick = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate(user ? '/dashboard' : '/');
  };

  const currentPath = window.location.pathname;
  const isActive = (path) => currentPath === path || (path !== '/' && currentPath.startsWith(path));

  const logoHref = user ? '/dashboard' : '/';

  return (
    <>
      <style>{HeaderStyles}</style>
      <header className="header" role="banner">
        <div className="header-inner">
          <a href={logoHref} className="header-logo" onClick={handleLogoClick} aria-label="FitnessApp - Strona główna">
            Fitness<span className="header-logo-accent">App</span>
          </a>
          <nav className="header-nav" role="navigation" aria-label="Główna nawigacja">
            <button
              className={`nav-link ${isActive('/exercises') ? 'nav-link--active' : ''}`}
              onClick={() => navigate('/exercises')}
              aria-current={isActive('/exercises') ? 'page' : undefined}
            >
              Ćwiczenia
            </button>
            <button
              className={`nav-link ${isActive('/calorie-tracker') ? 'nav-link--active' : ''}`}
              onClick={() => navigate('/calorie-tracker')}
              aria-current={isActive('/calorie-tracker') ? 'page' : undefined}
            >
              Kalorie
            </button>
            <button
              className={`nav-link ${isActive('/records') ? 'nav-link--active' : ''}`}
              onClick={() => navigate('/records')}
              aria-current={isActive('/records') ? 'page' : undefined}
            >
              Analityka Treningowa
            </button>
            <button
              className={`nav-link ${isActive('/templates') ? 'nav-link--active' : ''}`}
              onClick={() => navigate('/templates')}
              aria-current={isActive('/templates') ? 'page' : undefined}
            >
              Szablony
            </button>
            <div className="account-wrap" ref={dropdownRef}>
              <button
                className="account-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Menu konta"
              >
                Konto
                <span className={`chevron ${dropdownOpen ? 'open' : ''}`} aria-hidden="true">▾</span>
              </button>
              {dropdownOpen && (
                <div className="account-dropdown" role="menu">
                  <button
                    className="dropdown-item"
                    onClick={() => handleDropdownClick('/profile?view=settings')}
                    role="menuitem"
                  >
                    Ustawienia konta
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => handleDropdownClick('/profile?view=measurements')}
                    role="menuitem"
                  >
                    Dziennik pomiarów
                  </button>
                  <div className="dropdown-divider" role="separator" />
                  <button
                    className="dropdown-item dropdown-item--danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    Wyloguj się
                  </button>
                </div>
              )}
            </div>
            <button
              className="nav-link theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Włącz motyw jasny' : 'Włącz motyw ciemny'}
              title="Zmień motyw"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </nav>
          <button
            className="hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className={`hamburger-line ${menuOpen ? 'open-1' : ''}`} aria-hidden="true" />
            <span className={`hamburger-line ${menuOpen ? 'open-2' : ''}`} aria-hidden="true" />
            <span className={`hamburger-line ${menuOpen ? 'open-3' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${menuOpen ? 'open' : ''}`} role="navigation" aria-label="Menu mobilne">
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/exercises'); }}>Ćwiczenia</button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/calorie-tracker'); }}>Kalorie</button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/records'); }}>Analityka Treningowa</button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/templates'); }}>Szablony</button>
        <button className="nav-link theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Włącz motyw jasny' : 'Włącz motyw ciemny'}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />} <span style={{ marginLeft: 8 }}>Zmień motyw</span>
        </button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/profile?view=settings'); }}>Ustawienia konta</button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/profile?view=measurements'); }}>Dziennik pomiarów</button>
        <button className="nav-link dropdown-item--danger" onClick={() => { setMenuOpen(false); handleLogout(); }}>Wyloguj się</button>
      </div>
    </>
  );
}

export default Header;