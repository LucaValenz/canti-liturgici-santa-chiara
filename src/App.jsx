import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Papa from 'papaparse'

import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import SongPage from './pages/SongPage'
import DailySongsPage from './pages/DailySongsPage'
import SuggestPage from './pages/SuggestPage'
import './App.css'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuSn2F5KZV-TYnF3yS92H_nEFYCPX_v-VmLtR4nqNXkh6tls7E94FP0ciMGomsPh5H-YBc4lBGFLH/pub?gid=0&single=true&output=csv'

export default function App() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedSongs = results.data
          .filter((item) => item.Titolo && item.Titolo.trim() !== '')
          .map((item) => ({
            id: (item.ID || '').trim(),
            title: item.Titolo.trim(),
            author: (item.Autori || '').trim(),
            tags: item.Tag ? item.Tag.split(',').map((t) => t.trim().toLowerCase()) : [],
            youtube: (item['Link Youtube'] || '').trim(),
            sheetOriginal: (item['Spartito Originale'] || '').trim(),
            sheetModified: (item['Spartito Modificato'] || '').trim(),
            lyrics: (item.Testo || '').trim(),
            notes: (item.Note || '').trim()
          }))
        setSongs(parsedSongs)
        setLoading(false)
      },
      error: (err) => {
        console.error(err)
        setError('Errore di connessione al database dei canti.')
        setLoading(false)
      }
    })
  }, [])

  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<HomePage songs={songs} loading={loading} error={error} />}
            />
            <Route
              path="/song/:id"
              element={<SongPage songs={songs} />}
            />
            <Route
              path="/daily"
              element={<DailySongsPage songs={songs} />}
            />
            <Route
              path="/suggest"
              element={<SuggestPage />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}