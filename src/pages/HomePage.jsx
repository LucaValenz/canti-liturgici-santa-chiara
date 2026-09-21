import { useState, useMemo } from 'react'
import { useSongs } from '../context/SongsContext'
import SongCard from '../components/SongCard'

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

    // Filtra canti per ricerca libera e tag selezionato
    const filteredSongs = useMemo(() => {
        const query = search.trim().toLowerCase()
        return songs.filter((song) => {
            const matchesSearch =
                !query ||
                song.title.toLowerCase().includes(query) ||
                song.author.toLowerCase().includes(query) ||
                song.id.toLowerCase().includes(query) ||
                song.lyrics.toLowerCase().includes(query)

            const matchesTag =
                selectedTag === 'tutti' ? true : song.tags.includes(selectedTag)

            return matchesSearch && matchesTag
        })
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