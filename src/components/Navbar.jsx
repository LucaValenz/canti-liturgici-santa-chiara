import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation()

    const closeSidebar = () => setIsOpen(false)

    const navItems = [
        { label: 'Tutti i Canti', path: '/' },
        { label: 'Canti del Giorno', path: '/daily' },
        { label: 'Suggerisci Canto', path: '/suggest' },
    ]

    return (
        <>
            <header className="navbar">
                <button
                    type="button"
                    className="menu-button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Apri menu di navigazione"
                >
                    ☰
                </button>
                <div className="navbar-titles">
                    <h1>Canti Liturgici</h1>
                    <span>Parrocchia Santa Chiara</span>
                </div>
            </header>

            {/* Sfondo oscurato quando la sidebar è aperta */}
            {isOpen && <div className="backdrop" onClick={closeSidebar} />}

            {/* Menu laterale a comparsa */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Menu</h3>
                    <button type="button" className="close-button" onClick={closeSidebar}>✕</button>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={closeSidebar}
                            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>
        </>
    )
}