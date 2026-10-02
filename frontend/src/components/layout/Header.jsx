import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../common/Toast';
import { logoutUser } from '../../api/authAPI';
import { useAuth } from '../../context/AuthContext';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .site-header { display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 56px; background: #0d0d0f; border-bottom: 1px solid #1e1e22; position: sticky; top: 0; z-index: 100; width: 100%; box-sizing: border-box; }
        .header-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; letter-spacing: -0.5px; color: #f0ede8; text-decoration: none; cursor: pointer; }
        .header-logo span { color: #c8f542; }
        .header-nav { display: flex; align-items: center; gap: 4px; }
        .nav-link { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #666; text-decoration: none; padding: 6px 12px; border-radius: 8px; border: none; background: none; cursor: pointer; transition: color 0.15s, background 0.15s; white-space: nowrap; }
        .nav-link:hover { color: #f0ede8; background: #1e1e22; }
        .account-wrap { position: relative; }
        .account-btn { display: flex; align-items: center; gap: 6px; }
        .chevron { font-size: 9px; color: #444; transition: transform 0.2s; }
        .chevron.open { transform: rotate(180deg); }
        .account-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: #16161a; border: 1px solid #1e1e22; border-radius: 10px; padding: 6px; min-width: 160px; display: flex; flex-direction: column; gap: 2px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 200; }
        .dropdown-item { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #aaa; text-decoration: none; padding: 8px 12px; border-radius: 7px; border: none; background: none; cursor: pointer; text-align: left; transition: color 0.15s, background 0.15s; display: block; width: 100%; }
        .dropdown-item:hover { color: #f0ede8; background: #1e1e22; }
        .dropdown-item.logout { color: #ff8a80; }
        .dropdown-item.logout:hover { background: #2a1a1a; }
        .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
        .hamburger-line { width: 24px; height: 2px; background: #f0ede8; border-radius: 2px; transition: 0.3s; display: block; }
        .hamburger-line.open-1 { transform: rotate(45deg) translate(5px, 5px); }
        .hamburger-line.open-2 { opacity: 0; }
        .hamburger-line.open-3 { transform: rotate(-45deg) translate(5px, -5px); }
        .mobile-menu { display: none; flex-direction: column; background: #0d0d0f; border-top: 1px solid #1e1e22; padding: 12px 16px; gap: 4px; position: sticky; top: 56px; z-index: 99; }
        .mobile-menu.open { display: flex; }
        @media (max-width: 600px) { .header-nav { display: none; } .hamburger { display: flex; } }
      `}</style>

      <header className="site-header">
        <span className="header-logo" onClick={() => navigate('/')} role="link" tabIndex={0}>Fitness<span>App</span></span>
        <nav className="header-nav">
          <button className="nav-link" onClick={() => navigate('/exercises')}>Ćwiczenia</button>
          <button className="nav-link" onClick={() => navigate('/calorie-tracker')}>Kalorie</button>
          <button className="nav-link" onClick={() => navigate('/records')}>Rekordy Życiowe</button>
          <div className="account-wrap" ref={dropdownRef}>
            <button className="nav-link account-btn" onClick={() => setDropdownOpen(o => !o)}>
              Konto
              <span className={`chevron ${dropdownOpen ? 'open' : ''}`}>▾</span>
            </button>
            {dropdownOpen && (
              <div className="account-dropdown">
                <button className="dropdown-item" onClick={() => handleDropdownClick('/profile?view=settings')}>
                  Ustawienia konta
                </button>
                <button className="dropdown-item" onClick={() => handleDropdownClick('/profile?view=measurements')}>
                  Dziennik pomiarów
                </button>
                <div style={{ height: 1, background: '#1e1e22', margin: '4px 0' }} />
                <button className="dropdown-item logout" onClick={handleLogout}>
                  Wyloguj się
                </button>
              </div>
            )}
          </div>
        </nav>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span className={`hamburger-line ${menuOpen ? 'open-1' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open-2' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open-3' : ''}`} />
        </button>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/exercises'); }}>Ćwiczenia</button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/calorie-tracker'); }}>Kalorie</button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/records'); }}>Rekordy Życiowe</button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/profile?view=settings'); }}>Ustawienia konta</button>
        <button className="nav-link" onClick={() => { setMenuOpen(false); navigate('/profile?view=measurements'); }}>Dziennik pomiarów</button>
        <button className="nav-link" style={{ textAlign: 'left', color: '#ff8a80' }} onClick={() => { setMenuOpen(false); handleLogout(); }}>Wyloguj się</button>
      </div>
    </>
  );
}

export default Header;