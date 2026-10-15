import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Papa from 'papaparse'
import { useSongs } from '../context/SongsContext'
import SongLyrics from '../components/SongLyrics'
import FontSizeControls from '../components/FontSizeControls'

const CELEBRAZIONI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuSn2F5KZV-TYnF3yS92H_nEFYCPX_v-VmLtR4nqNXkh6tls7E94FP0ciMGomsPh5H-YBc4lBGFLH/pub?gid=1649967796&single=true&output=csv'
const CELEBRAZIONI_CACHE_KEY = 'cached_celebrations_schedule_csv'

function getCelebrationIcon(name) {
    const lower = (name || '').toLowerCase()
    if (lower.includes('adorazion') || lower.includes('gioved')) return '🕯️'
    if (lower.includes('fanciull') || lower.includes('bambin') || lower.includes('10:30')) return '👦'
    if (lower.includes('veglia') || lower.includes('notte')) return '✨'
    return '⛪'
}

function parseCelebrationCsv(csvText) {
    const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
    })

    if (!results.data || results.data.length === 0) {
        return { parsedRows: [], uniqueCelebs: [] }
    }

    const firstRow = results.data[0] || {}
    const keys = Object.keys(firstRow)

    const celebCol = keys.find((k) => /^(celebrazione|evento|gruppo)/i.test(k.trim()))
    const momentCol = keys.find((k) => /^momento/i.test(k.trim())) || 'Momento'
    const songCol = keys.find((k) => /^(canto_id|canto|id)/i.test(k.trim())) || 'Canto_ID'
    const noteCol = keys.find((k) => /^note/i.test(k.trim())) || 'Note'

    const parsedRows = []
    let runningCelebration = 'Generale'

    // 1. Formato Verticale principale (colonna Celebrazione presente)
    if (celebCol) {
        results.data.forEach((item, index) => {
            const rawCeleb = (item[celebCol] || '').trim()
            if (rawCeleb) {
                runningCelebration = rawCeleb
            }

            const songId = (item[songCol] || '').trim()
            const moment = (item[momentCol] || '').trim()
            const notes = (item[noteCol] || '').trim()

            if (songId) {
                parsedRows.push({
                    keyId: `${runningCelebration}-${moment || 'momento'}-${index}`,
                    celebration: runningCelebration,
                    moment: moment || 'Momento',
                    songId,
                    notes
                })
            }
        })
    } else {
        // 2. Fallback per colonne orizzontali precedenti (Messa 10:30, Messa 12:15, Adorazione...)
        const celebrationColumns = keys.filter((k) =>
            /^(messa|adorazione|veglia)/i.test(k.trim())
        )

        if (celebrationColumns.length > 0) {
            celebrationColumns.forEach((colName) => {
                const trimmedCol = colName.trim()
                results.data.forEach((item, index) => {
                    const songId = (item[colName] || '').trim()
                    const moment = (item[momentCol] || '').trim()
                    const notes = (item[noteCol] || '').trim()

                    if (songId) {
                        parsedRows.push({
                            keyId: `${trimmedCol}-${moment || 'momento'}-${index}`,
                            celebration: trimmedCol,
                            moment: moment || 'Momento',
                            songId,
                            notes
                        })
                    }
                })
            })
        } else {
            // 3. Fallback standard
            results.data.forEach((item, index) => {
                const songId = (item[songCol] || '').trim()
                if (songId) {
                    parsedRows.push({
                        keyId: `generale-${item[momentCol] || 'momento'}-${index}`,
                        celebration: 'Celebrazione',
                        moment: (item[momentCol] || '').trim() || 'Momento',
                        songId,
                        notes: (item[noteCol] || '').trim()
                    })
                }
            })
        }
    }

    const uniqueCelebs = []
    parsedRows.forEach((r) => {
        if (!uniqueCelebs.includes(r.celebration)) {
            uniqueCelebs.push(r.celebration)
        }
    })

    return { parsedRows, uniqueCelebs }
}

export default function DailySongsPage() {
    const { songs, loading: songsLoading } = useSongs()
    const [searchParams, setSearchParams] = useSearchParams()
    const [allScheduleRows, setAllScheduleRows] = useState([])
    const [celebrations, setCelebrations] = useState([])
    const [activeCelebration, setActiveCelebration] = useState('')
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
        let isMounted = true
        let hasLoadedCache = false

        const applyParsedData = (parsedRows, uniqueCelebs) => {
            setAllScheduleRows(parsedRows)
            setCelebrations(uniqueCelebs)

            const urlParam = searchParams.get('celebrazione') || searchParams.get('messa')
            const savedCeleb = localStorage.getItem('active_celebration')

            setActiveCelebration((prev) => {
                if (urlParam && uniqueCelebs.some((c) => c.toLowerCase() === urlParam.toLowerCase())) {
                    return uniqueCelebs.find((c) => c.toLowerCase() === urlParam.toLowerCase())
                }
                if (prev && uniqueCelebs.includes(prev)) {
                    return prev
                }
                if (savedCeleb && uniqueCelebs.includes(savedCeleb)) {
                    return savedCeleb
                }
                return uniqueCelebs[0] || ''
            })

            setExpandedLyrics((prevOpen) => {
                const newOpen = { ...prevOpen }
                parsedRows.forEach((row) => {
                    if (newOpen[row.keyId] === undefined) {
                        newOpen[row.keyId] = true
                    }
                })
                return newOpen
            })

            setLoadingSchedule(false)
        }

        // 1. Tenta subito il caricamento istantaneo dalla memoria locale
        const cachedCsv = localStorage.getItem(CELEBRAZIONI_CACHE_KEY)
        if (cachedCsv) {
            try {
                const { parsedRows, uniqueCelebs } = parseCelebrationCsv(cachedCsv)
                if (parsedRows.length > 0) {
                    applyParsedData(parsedRows, uniqueCelebs)
                    hasLoadedCache = true
                }
            } catch (err) {
                console.warn('Errore lettura cache celebrazioni:', err)
            }
        }

        // 2. Scarica la versione più recente in background
        fetch(CELEBRAZIONI_CSV_URL)
            .then((res) => {
                if (!res.ok) throw new Error('Risposta di rete non valida')
                return res.text()
            })
            .then((freshCsv) => {
                if (!isMounted) return
                if (freshCsv && freshCsv !== cachedCsv) {
                    localStorage.setItem(CELEBRAZIONI_CACHE_KEY, freshCsv)
                    const { parsedRows, uniqueCelebs } = parseCelebrationCsv(freshCsv)
                    if (parsedRows.length > 0) {
                        applyParsedData(parsedRows, uniqueCelebs)
                    }
                }
                setLoadingSchedule(false)
                setErrorSchedule(null)
            })
            .catch((err) => {
                if (!isMounted) return
                if (!hasLoadedCache) {
                    console.error(err)
                    setErrorSchedule('Impossibile caricare i canti della celebrazione.')
                }
                setLoadingSchedule(false)
            })

        return () => {
            isMounted = false
        }
    }, [searchParams])

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

    const handleSelectCelebration = (celeb) => {
        setActiveCelebration(celeb)
        localStorage.setItem('active_celebration', celeb)
        setSearchParams({ celebrazione: celeb }, { replace: true })
    }

    // Filtra per celebrazione attiva
    const currentSchedule = useMemo(() => {
        if (!activeCelebration) return allScheduleRows
        return allScheduleRows.filter((r) => r.celebration === activeCelebration)
    }, [allScheduleRows, activeCelebration])

    const matchedSchedule = useMemo(() => {
        return currentSchedule.map((item) => {
            const fullSong = songs.find(
                (s) => s.id.toLowerCase() === item.songId.toLowerCase()
            )
            return {
                ...item,
                song: fullSong || null
            }
        })
    }, [currentSchedule, songs])

    const handleShareSchedule = async () => {
        const titleText = activeCelebration
            ? `Canti: ${activeCelebration}`
            : 'Canti per la Celebrazione'

        const base = window.location.origin + window.location.pathname
        const shareUrl = `${base}#/daily?celebrazione=${encodeURIComponent(activeCelebration)}`
        const shareText = `🎶 *${titleText} — Parrocchia Santa Chiara*\nEcco i canti scelti con testi e spartiti:\n${shareUrl}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${titleText} — Parrocchia Santa Chiara`,
                    text: `🎶 ${titleText} — Parrocchia Santa Chiara\nEcco i canti scelti con testi e spartiti:`,
                    url: shareUrl,
                })
                return
            } catch (err) {
                if (err.name === 'AbortError') return
            }
        }

        try {
            await navigator.clipboard.writeText(shareText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch (err) {
            console.error('Errore copia link:', err)
        }
    }

    if (songsLoading || loadingSchedule) {
        return <p className="status-message">Caricamento dei canti per la celebrazione...</p>
    }

    if (errorSchedule) {
        return <p className="status-message error">{errorSchedule}</p>
    }

    return (
        <section className="daily-page-container">
            <header className="daily-header">
                <div>
                    <h2>{activeCelebration || 'Canti per la Celebrazione'}</h2>
                    <p className="daily-subtitle">Guida musicale e testi per la liturgia</p>
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
                            title="Condividi i canti di questa celebrazione"
                        >
                            {copied ? '✓ Link Copiato!' : '🔗 Condividi Canti'}
                        </button>
                    )}
                </div>
            </header>

            {/* Selettore a schede per le celebrazioni */}
            {celebrations.length > 1 && (
                <div className="celebration-tabs-nav" role="tablist" aria-label="Seleziona celebrazione">
                    {celebrations.map((celeb) => (
                        <button
                            key={celeb}
                            type="button"
                            role="tab"
                            aria-selected={activeCelebration === celeb}
                            className={`celebration-tab-btn ${activeCelebration === celeb ? 'active' : ''}`}
                            onClick={() => handleSelectCelebration(celeb)}
                        >
                            <span className="tab-icon">{getCelebrationIcon(celeb)}</span>
                            <span className="tab-label">{celeb}</span>
                        </button>
                    ))}
                </div>
            )}

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