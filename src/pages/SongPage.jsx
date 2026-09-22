import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useSongs } from '../context/SongsContext'
import SongLyrics from '../components/SongLyrics'
import FontSizeControls from '../components/FontSizeControls'

export default function SongPage() {
    const { id } = useParams()
    const location = useLocation()
    const { songs, loading, error } = useSongs()

    // Determinazione del percorso di provenienza
    const isFromDaily = location.state?.from === 'daily'
    const backTo = isFromDaily ? '/daily' : '/'
    const backLabel = isFromDaily ? '← Torna alla Scaletta' : "← Torna all'elenco"

    // Stato admin temporaneamente su true per collaudo
    const [isAdmin] = useState(true)

    // Dimensione font sincronizzata con localStorage
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('hymn_font_size')
        return saved ? Number(saved) : 18
    })

    // Wake Lock per impedire allo schermo di spegnersi durante il canto/suono
    const [wakeLockActive, setWakeLockActive] = useState(false)
    const wakeLockRef = useRef(null)

    // Feedback copia link
    const [copied, setCopied] = useState(false)

    // Gestione Screen Wake Lock API nativa
    const toggleWakeLock = async () => {
        if (!('wakeLock' in navigator)) {
            alert('La funzione di schermo sempre attivo non è supportata dal tuo browser.')
            return
        }

        try {
            if (wakeLockActive && wakeLockRef.current) {
                await wakeLockRef.current.release()
                wakeLockRef.current = null
                setWakeLockActive(false)
            } else {
                wakeLockRef.current = await navigator.wakeLock.request('screen')
                setWakeLockActive(true)
                wakeLockRef.current.addEventListener('release', () => {
                    setWakeLockActive(false)
                })
            }
        } catch (err) {
            console.warn('Errore Wake Lock:', err)
            setWakeLockActive(false)
        }
    }

    useEffect(() => {
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => { })
            }
        }
    }, [])

    const copyShareLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formatDriveUrl = (url, mode = 'preview') => {
        if (!url) return ''
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
        if (match && match[1]) {
            const fileId = match[1]
            return mode === 'preview'
                ? `https://drive.google.com/file/d/${fileId}/preview`
                : `https://drive.google.com/uc?export=download&id=${fileId}`
        }
        return url
    }

    if (loading) return <p className="status-message">Caricamento canto...</p>
    if (error) return <p className="status-message error">{error}</p>

    const song = songs.find((s) => s.id.toLowerCase() === id?.toLowerCase())

    if (!song) {
        return (
            <section className="song-detail-container">
                <Link to={backTo} className="back-link">{backLabel}</Link>
                <p className="status-message">Canto non trovato nel catalogo.</p>
            </section>
        )
    }

    const origPreview = formatDriveUrl(song.sheetOriginal, 'preview')
    const origDownload = formatDriveUrl(song.sheetOriginal, 'download')

    const modPreview = formatDriveUrl(song.sheetModified, 'preview')
    const modDownload = formatDriveUrl(song.sheetModified, 'download')

    return (
        <article className="song-detail-container">
            <header className="song-header">
                <Link to={backTo} className="back-link">{backLabel}</Link>
                <div className="song-title-group">
                    {song.id && <span className="song-badge-id">{song.id}</span>}
                    <h1>{song.title}</h1>
                    {song.author && <p className="song-subtitle">{song.author}</p>}
                </div>

                {song.tags.length > 0 && (
                    <div className="card-tags">
                        {song.tags.map((t, idx) => (
                            <span key={idx} className="tag-pill">{t}</span>
                        ))}
                    </div>
                )}

                {/* Toolbar */}
                <div className="song-toolbar">
                    <FontSizeControls fontSize={fontSize} setFontSize={setFontSize} />

                    <button
                        type="button"
                        className={`tool-button ${wakeLockActive ? 'active' : ''}`}
                        onClick={toggleWakeLock}
                        title="Mantieni lo schermo acceso durante la celebrazione"
                    >
                        {wakeLockActive ? '☀️ Schermo Sempre Attivo (ON)' : '🌙 Schermo Normale'}
                    </button>

                    <button
                        type="button"
                        className="tool-button"
                        onClick={copyShareLink}
                    >
                        {copied ? '✓ Link Copiato!' : '🔗 Copia Link'}
                    </button>
                </div>
            </header>

            {/* SEZIONE TESTO */}
            <section className="song-section">
                <h2 className="section-title">Testo</h2>
                <SongLyrics rawLyrics={song.lyrics} fontSize={fontSize} />
            </section>

            {/* SEZIONE SPARTITO ORIGINALE */}
            {song.sheetOriginal && (
                <section className="song-section">
                    <div className="section-header-flex">
                        <h2 className="section-title">Spartito Originale</h2>
                        <div className="sheet-actions">
                            <a
                                href={origPreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-btn-primary"
                            >
                                ⛶ Schermo Intero
                            </a>
                            <a
                                href={origDownload}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-btn-secondary"
                            >
                                ⬇ Scarica PDF
                            </a>
                        </div>
                    </div>

                    <a
                        href={origPreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-preview-link"
                        title="Clicca per aprire lo spartito a schermo intero"
                    >
                        <iframe
                            src={origPreview}
                            title={`Spartito Originale ${song.title}`}
                            className="pdf-frame static-frame"
                            tabIndex="-1"
                            loading="lazy"
                        />
                        <div className="pdf-click-overlay">
                            <span className="overlay-badge">🔍 Tocca per ingrandire</span>
                        </div>
                    </a>
                </section>
            )}

            {/* SEZIONE SPARTITO MODIFICATO (RISERVATA ADMIN) */}
            {isAdmin && song.sheetModified && (
                <section className="song-section admin-section">
                    <div className="section-header-flex">
                        <h2 className="section-title admin-title">
                            🔒 Spartito Modificato (Note personali)
                        </h2>
                        <div className="sheet-actions">
                            <a
                                href={modPreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-btn-primary"
                            >
                                ⛶ Apri a Schermo Intero
                            </a>
                            <a
                                href={modDownload}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-btn-secondary"
                            >
                                ⬇ Scarica Modificato
                            </a>
                        </div>
                    </div>

                    <a
                        href={modPreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-preview-link"
                        title="Clicca per aprire lo spartito a schermo intero"
                    >
                        <iframe
                            src={modPreview}
                            title={`Spartito Modificato ${song.title}`}
                            className="pdf-frame static-frame"
                            tabIndex="-1"
                            loading="lazy"
                        />
                        <div className="pdf-click-overlay">
                            <span className="overlay-badge">🔍 Tocca per ingrandire</span>
                        </div>
                    </a>
                </section>
            )}

            {/* FOOTER: RISORSE E NOTE */}
            <footer className="song-footer-resources">
                {song.youtube && (
                    <div className="youtube-box">
                        <span>Ascolta il canto:</span>
                        <a
                            href={song.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="youtube-badge"
                        >
                            ▶ Guarda su YouTube
                        </a>
                    </div>
                )}

                {song.notes && (
                    <div className="notes-box">
                        <strong>Note sull'archivio:</strong>
                        <p>{song.notes}</p>
                    </div>
                )}
            </footer>
        </article>
    )
}