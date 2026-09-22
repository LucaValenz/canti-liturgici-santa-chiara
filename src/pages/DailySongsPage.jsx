import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Papa from 'papaparse'
import { useSongs } from '../context/SongsContext'
import SongLyrics from '../components/SongLyrics'
import FontSizeControls from '../components/FontSizeControls'

const SCALETTA_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuSn2F5KZV-TYnF3yS92H_nEFYCPX_v-VmLtR4nqNXkh6tls7E94FP0ciMGomsPh5H-YBc4lBGFLH/pub?gid=1649967796&single=true&output=csv'

export default function DailySongsPage() {
    const { songs, loading: songsLoading } = useSongs()
    const [schedule, setSchedule] = useState([])
    const [loadingSchedule, setLoadingSchedule] = useState(true)
    const [errorSchedule, setErrorSchedule] = useState(null)
    const [copied, setCopied] = useState(false)

    // Dimensione font sincronizzata con localStorage
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('hymn_font_size')
        return saved ? Number(saved) : 17
    })

    // Gestione Wake Lock per lo schermo sempre attivo
    const [wakeLockActive, setWakeLockActive] = useState(false)
    const wakeLockRef = useRef(null)

    const [expandedLyrics, setExpandedLyrics] = useState({})

    useEffect(() => {
        Papa.parse(SCALETTA_CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const activeRows = results.data
                    .filter((item) => item.Canto_ID && item.Canto_ID.trim() !== '')
                    .map((item, index) => ({
                        keyId: `${item.Momento || 'momento'}-${index}`,
                        moment: (item.Momento || '').trim(),
                        songId: item.Canto_ID.trim(),
                        notes: (item.Note || '').trim()
                    }))

                setSchedule(activeRows)

                const initialOpen = {}
                activeRows.forEach((row) => {
                    initialOpen[row.keyId] = true
                })
                setExpandedLyrics(initialOpen)

                setLoadingSchedule(false)
            },
            error: (err) => {
                console.error(err)
                setErrorSchedule('Impossibile caricare la scaletta del giorno.')
                setLoadingSchedule(false)
            }
        })
    }, [])

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

    const toggleLyrics = (keyId) => {
        setExpandedLyrics((prev) => ({
            ...prev,
            [keyId]: !prev[keyId]
        }))
    }

    const matchedSchedule = schedule.map((item) => {
        const fullSong = songs.find(
            (s) => s.id.toLowerCase() === item.songId.toLowerCase()
        )
        return {
            ...item,
            song: fullSong || null
        }
    })

    const handleShareSchedule = async () => {
        const url = window.location.href
        const shareText = `🎶 *Canti della Celebrazione - Parrocchia Santa Chiara*\nEcco la scaletta aggiornata con testi e spartiti:\n${url}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Scaletta Canti - Parrocchia Santa Chiara',
                    text: '🎶 Canti della Celebrazione - Parrocchia Santa Chiara\nEcco la scaletta con testi e spartiti:',
                    url: url,
                })
                return
            } catch (err) {
                if (err.name === 'AbortError') return
            }
        }

        navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    if (songsLoading || loadingSchedule) {
        return <p className="status-message">Caricamento della scaletta...</p>
    }

    if (errorSchedule) {
        return <p className="status-message error">{errorSchedule}</p>
    }

    return (
        <section className="daily-page-container">
            <header className="daily-header">
                <div>
                    <h2>Canti della Celebrazione</h2>
                    <p className="daily-subtitle">Scaletta musicale completa di testi per la Messa</p>
                </div>

                <div className="daily-header-actions">
                    <FontSizeControls fontSize={fontSize} setFontSize={setFontSize} />

                    <button
                        type="button"
                        className={`tool-button ${wakeLockActive ? 'active' : ''}`}
                        onClick={toggleWakeLock}
                        title="Mantieni lo schermo acceso durante la celebrazione"
                    >
                        {wakeLockActive ? '☀️ Schermo Attivo (ON)' : '🌙 Schermo Normale'}
                    </button>

                    {matchedSchedule.length > 0 && (
                        <button
                            type="button"
                            className="whatsapp-copy-btn"
                            onClick={handleShareSchedule}
                            title="Condividi il link della scaletta"
                        >
                            {copied ? '✓ Link Copiato!' : '🔗 Condividi Scaletta'}
                        </button>
                    )}
                </div>
            </header>

            {matchedSchedule.length === 0 ? (
                <div className="empty-schedule">
                    <p>Nessun canto programmato al momento per questa celebrazione.</p>
                </div>
            ) : (
                <div className="schedule-timeline">
                    {matchedSchedule.map((item) => {
                        const isOpen = expandedLyrics[item.keyId]

                        return (
                            <article key={item.keyId} className="timeline-item">
                                <div className="timeline-badge-moment">
                                    <span>{item.moment}</span>
                                </div>

                                <div className="timeline-content-card">
                                    <div className="timeline-card-header">
                                        <div className="timeline-title-wrap">
                                            {item.song?.id && (
                                                <span className="card-id">{item.song.id}</span>
                                            )}
                                            <h3>{item.song ? item.song.title : `Canto ${item.songId}`}</h3>
                                        </div>
                                        {item.song?.author && (
                                            <span className="timeline-author">{item.song.author}</span>
                                        )}
                                    </div>

                                    {item.notes && (
                                        <div className="timeline-notes">
                                            <strong>Note:</strong> {item.notes}
                                        </div>
                                    )}

                                    <div className="timeline-card-controls">
                                        <button
                                            type="button"
                                            className="toggle-lyrics-btn"
                                            onClick={() => toggleLyrics(item.keyId)}
                                        >
                                            {isOpen ? '▲ Nascondi Testo' : '▼ Mostra Testo'}
                                        </button>

                                        <div className="timeline-right-links">
                                            {item.song?.youtube && (
                                                <a
                                                    href={item.song.youtube}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="youtube-badge"
                                                >
                                                    ▶ YouTube
                                                </a>
                                            )}
                                            {/* Passaggio di state: { from: 'daily' } */}
                                            <Link
                                                to={`/song/${item.songId}`}
                                                state={{ from: 'daily' }}
                                                className="details-btn"
                                            >
                                                Spartiti ↗
                                            </Link>
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="timeline-lyrics-box">
                                            {item.song?.lyrics ? (
                                                <SongLyrics rawLyrics={item.song.lyrics} fontSize={fontSize} />
                                            ) : (
                                                <p className="no-lyrics">Testo non ancora inserito per questo canto.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}