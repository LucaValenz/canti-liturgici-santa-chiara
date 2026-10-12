import { useState, useMemo } from 'react'
import { useSongs } from '../context/SongsContext'
import SongCard from '../components/SongCard'

// Rimuove accenti e converte in minuscolo per ricerca flessibile
function normalizeText(text) {
    if (!text) return ''
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

export default function HomePage() {
    const { songs, loading, error } = useSongs()
    const [search, setSearch] = useState('')
    const [selectedTag, setSelectedTag] = useState('tutti')

    // Estrai tutti i tag distinti e ordinali semplicemente in ordine alfabetico
    const availableTags = useMemo(() => {
        const set = new Set()
        songs.forEach((song) => {
            song.tags.forEach((tag) => {
                if (tag) set.add(tag)
            })
        })
        return ['tutti', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
    }, [songs])

    // Filtra e ordina canti per ricerca multi-parola e tag selezionato
    const filteredSongs = useMemo(() => {
        const normalizedQuery = normalizeText(search.trim())
        const tokens = normalizedQuery.split(/\s+/).filter(Boolean)

        // 1. Filtraggio per tag
        const tagFiltered = songs.filter((song) => {
            if (selectedTag === 'tutti') return true
            return song.tags.some((tag) => normalizeText(tag) === normalizeText(selectedTag))
        })

        // Se non c'è ricerca testuale, ritorna semplicemente i canti filtrati per tag
        if (tokens.length === 0) {
            return tagFiltered
        }

        // 2. Ricerca multi-termine con logica AND e calcolo pertinenza (ranking)
        const results = []

        tagFiltered.forEach((song) => {
            const normTitle = normalizeText(song.title)
            const normAuthor = normalizeText(song.author)
            const normId = normalizeText(song.id)
            const normTags = song.tags.map(normalizeText).join(' ')
            const normLyrics = normalizeText(song.lyrics)

            const fullText = `${normTitle} ${normAuthor} ${normId} ${normTags} ${normLyrics}`

            // Ogni parola cercata deve essere presente in almeno uno dei campi
            const matchesAllTokens = tokens.every((token) => fullText.includes(token))

            if (matchesAllTokens) {
                // Calcola il punteggio di pertinenza
                let score = 0

                // Match perfetto o parziale dell'intera frase nel titolo
                if (normTitle === normalizedQuery) {
                    score += 120
                } else if (normTitle.includes(normalizedQuery)) {
                    score += 60
                }

                // Match dei singoli token nei vari campi (più peso a Titolo e Autore)
                tokens.forEach((token) => {
                    if (normId === token) score += 40
                    if (normTitle.includes(token)) score += 25
                    if (normAuthor.includes(token)) score += 20
                    if (normTags.includes(token)) score += 10
                    if (normLyrics.includes(token)) score += 2
                })

                results.push({ song, score })
            }
        })

        // 3. Ordina per pertinenza decrescente, e in caso di parità alfabeticamente per titolo
        results.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score
            }
            return a.song.title.localeCompare(b.song.title, 'it')
        })

        return results.map((r) => r.song)
    }, [songs, search, selectedTag])

    if (loading) {
        return <p className="status-message">Caricamento dell'archivio canti...</p>
    }

    if (error) {
        return <p className="status-message error">{error}</p>
    }

    return (
        <section className="home-page">
            <div className="search-bar-wrapper">
                <input
                    type="text"
                    className="main-search-input"
                    placeholder="Cerca per titolo, autore, ID (es. A1) o parole del testo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        type="button"
                        className="clear-search-btn"
                        onClick={() => setSearch('')}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="tags-scroll-container">
                {availableTags.map((tag) => (
                    <button
                        key={tag}
                        type="button"
                        className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
                        onClick={() => setSelectedTag(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            <div className="results-header">
                <span>
                    {filteredSongs.length} {filteredSongs.length === 1 ? 'canto trovato' : 'canti trovati'}
                </span>
                {selectedTag !== 'tutti' && (
                    <button
                        type="button"
                        className="reset-filter-btn"
                        onClick={() => setSelectedTag('tutti')}
                    >
                        Rimuovi filtro: <strong>{selectedTag}</strong> ✕
                    </button>
                )}
            </div>

            <div className="songs-list">
                {filteredSongs.map((song) => (
                    <SongCard key={song.id || song.title} song={song} />
                ))}

                {filteredSongs.length === 0 && (
                    <div className="empty-results">
                        <p>Nessun canto corrisponde ai criteri di ricerca.</p>
                    </div>
                )}
            </div>
        </section>
    )
}