import { useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()
    const { isAdmin, setShowLoginModal, logout } = useAdmin()

    // Contatore dei 5 tocchi rapidi su "Parrocchia Santa Chiara" (entro 2.5 secondi)
    const tapCountRef = useRef(0)
    const tapTimerRef = useRef(null)

    const handleSecretTap = () => {
        tapCountRef.current += 1

        if (tapTimerRef.current) {
            clearTimeout(tapTimerRef.current)
        }

        if (tapCountRef.current >= 5) {
            tapCountRef.current = 0
            setShowLoginModal(true)
            return
        }

        tapTimerRef.current = setTimeout(() => {
            tapCountRef.current = 0
        }, 2500)
    }

    const closeMenu = () => setMenuOpen(false)

    return (
        <>
            <header className="navbar">
                <button
                    type="button"
                    className="menu-button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Apri menu"
                >
                    ☰
                </button>

                <div className="navbar-titles">
                    <div className="navbar-title-row">
                        <h1>
                            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                                Canti Liturgici
                            </Link>
                        </h1>
                        {isAdmin && <span className="admin-active-badge">Admin</span>}
                    </div>
                    {/* 5 tocchi rapidi qui aprono il modale "Sei Luca?" */}
                    <span
                        className="secret-trigger"
                        onClick={handleSecretTap}
                        title=""
                    >
                        Parrocchia Santa Chiara
                    </span>
                </div>
            </header>

            {/* Sfondo semitrasparente sidebar */}
            {menuOpen && <div className="backdrop" onClick={closeMenu} />}

            {/* Sidebar scorrevole */}
            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Menu</h2>
                    <button type="button" className="close-button" onClick={closeMenu}>
                        ✕
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <Link
                        to="/"
                        className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        📚 Tutti i Canti
                    </Link>
                    <Link
                        to="/daily"
                        className={`sidebar-link ${location.pathname === '/daily' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        📅 Canti del Giorno
                    </Link>
                    <Link
                        to="/suggest"
                        className={`sidebar-link ${location.pathname === '/suggest' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        💡 Suggerisci Canto
                    </Link>
                </nav>

                {isAdmin && (
                    <div className="sidebar-admin-footer">
                        <span className="admin-status-text">Modalità Luca attiva</span>
                        <button
                            type="button"
                            className="admin-logout-btn"
                            onClick={() => {
                                logout()
                                closeMenu()
                            }}
                        >
                            Esci da Admin
                        </button>
                    </div>
                )}
            </aside>
        </>
    )
}