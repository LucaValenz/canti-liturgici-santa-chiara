import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import './App.css'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuSn2F5KZV-TYnF3yS92H_nEFYCPX_v-VmLtR4nqNXkh6tls7E94FP0ciMGomsPh5H-YBc4lBGFLH/pub?gid=0&single=true&output=csv'

export default function App() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('tutti')
  const [openLyricsId, setOpenLyricsId] = useState(null)

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Pulizia dati e filtri per righe vuote
        const parsedSongs = results.data
          .filter((item) => item.Titolo && item.Titolo.trim() !== '')
          .map((item) => ({
            id: item.ID || '',
            title: item.Titolo ? item.Titolo.trim() : '',
            author: item.Autori ? item.Autori.trim() : '',
            tags: item.Tag ? item.Tag.split(',').map((t) => t.trim().toLowerCase()) : [],
            youtube: item['Link Youtube'] ? item['Link Youtube'].trim() : '',
            sheetOriginal: item['Spartito Originale'] ? item['Spartito Originale'].trim() : '',
            sheetModified: item['Spartito Modificato'] ? item['Spartito Modificato'].trim() : '',
            lyrics: item.Testo ? item.Testo.trim() : '',
            notes: item.Note ? item.Note.trim() : ''
          }))
        setSongs(parsedSongs)
        setLoading(false)
      },
      error: (err) => {
        console.error(err)
        setError('Errore durante il caricamento del foglio.')
        setLoading(false)
      }
    })
  }, [])

  // Estrai tutti i tag distinti presenti nel foglio
  const allTags = useMemo(() => {
    const set = new Set()
    songs.forEach((song) => {
      song.tags.forEach((tag) => {
        if (tag) set.add(tag)
      })
    })
    return ['tutti', ...Array.from(set).sort()]
  }, [songs])

  // Filtra canti per testo inserito (titolo, autori, testo) e per tag
  const filteredSongs = useMemo(() => {
    const query = search.toLowerCase()
    return songs.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(query) ||
        song.author.toLowerCase().includes(query) ||
        song.id.toLowerCase().includes(query) ||
        song.lyrics.toLowerCase().includes(query)

      const matchesTag =
        selectedTag === 'tutti' ? true : song.tags.includes(selectedTag)

      return matchesSearch && matchesTag
    })
  }, [songs, search, selectedTag])

  const toggleLyrics = (id) => {
    setOpenLyricsId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="container">
      <header>
        <h1>Canti Liturgici</h1>
        <p>Parrocchia Santa Chiara</p>
      </header>

      <section className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Cerca per titolo, autore, ID o parole del testo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="tag-bar">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {loading && <p className="status-message">Caricamento canti in corso...</p>}
      {error && <p className="status-message">{error}</p>}

      {!loading && !error && (
        <>
          <div className="songs-count">
            {filteredSongs.length} {filteredSongs.length === 1 ? 'canto trovato' : 'canti trovati'}
          </div>

          <main className="cards-grid">
            {filteredSongs.map((song) => (
              <article key={song.id || song.title} className="card">
                <div className="card-header">
                  <div>
                    {song.id && <span className="song-id">{song.id}</span>}
                    <h2 className="song-title">{song.title}</h2>
                    {song.author && <p className="song-author">{song.author}</p>}
                  </div>
                </div>

                {song.tags.length > 0 && (
                  <div className="card-tags">
                    {song.tags.map((tag, idx) => (
                      <span key={idx} className="badge">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="card-actions">
                  {song.youtube && (
                    <a
                      href={song.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link youtube"
                    >
                      ▶ YouTube
                    </a>
                  )}

                  {song.sheetOriginal && (
                    <a
                      href={song.sheetOriginal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                    >
                      📄 Spartito
                    </a>
                  )}

                  {song.sheetModified && (
                    <a
                      href={song.sheetModified}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                    >
                      📝 Spartito Mod.
                    </a>
                  )}

                  {song.lyrics && (
                    <button
                      type="button"
                      onClick={() => toggleLyrics(song.id)}
                      className="btn-link lyrics"
                    >
                      {openLyricsId === song.id ? 'Nascondi Testo' : 'Mostra Testo'}
                    </button>
                  )}
                </div>

                {openLyricsId === song.id && song.lyrics && (
                  <div className="lyrics-drawer">{song.lyrics}</div>
                )}
              </article>
            ))}

            {filteredSongs.length === 0 && (
              <p className="status-message">Nessun canto trovato per i criteri selezionati.</p>
            )}
          </main>
        </>
      )}
    </div>
  )
}