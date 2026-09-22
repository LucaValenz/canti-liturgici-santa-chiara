import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { SongsProvider } from './context/SongsContext'
import { AdminProvider } from './context/AdminContext'

import Navbar from './components/Navbar'
import AdminModal from './components/AdminModal'
import HomePage from './pages/HomePage'
import SongPage from './pages/SongPage'
import DailySongsPage from './pages/DailySongsPage'
import SuggestPage from './pages/SuggestPage'
import './App.css'

export default function App() {
  return (
    <SongsProvider>
      <AdminProvider>
        <Router>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/song/:id" element={<SongPage />} />
                <Route path="/daily" element={<DailySongsPage />} />
                <Route path="/suggest" element={<SuggestPage />} />
              </Routes>
            </main>
            <AdminModal />
          </div>
        </Router>
      </AdminProvider>
    </SongsProvider>
  )
}