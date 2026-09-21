import { createContext, useContext, useState, useEffect } from 'react'
import Papa from 'papaparse'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuSn2F5KZV-TYnF3yS92H_nEFYCPX_v-VmLtR4nqNXkh6tls7E94FP0ciMGomsPh5H-YBc4lBGFLH/pub?gid=0&single=true&output=csv'

const SongsContext = createContext()

export function SongsProvider({ children }) {
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
                setError('Errore durante il caricamento dei canti.')
                setLoading(false)
            }
        })
    }, [])

    return (
        <SongsContext.Provider value={{ songs, loading, error }}>
            {children}
        </SongsContext.Provider>
    )
}

// Hook personalizzato per usare il contesto ovunque
export function useSongs() {
    return useContext(SongsContext)
}