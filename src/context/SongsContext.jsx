import { createContext, useContext, useState, useEffect } from 'react'
import Papa from 'papaparse'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuSn2F5KZV-TYnF3yS92H_nEFYCPX_v-VmLtR4nqNXkh6tls7E94FP0ciMGomsPh5H-YBc4lBGFLH/pub?gid=0&single=true&output=csv'
const CACHE_KEY = 'cached_songs_catalog_csv'

function parseCsvData(csvText) {
    const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
    })
    return (results.data || [])
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
}

const SongsContext = createContext()

export function SongsProvider({ children }) {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let isMounted = true
        let hasLoadedCache = false

        // 1. Tenta subito il caricamento istantaneo dalla memoria locale
        const cachedCsv = localStorage.getItem(CACHE_KEY)
        if (cachedCsv) {
            try {
                const parsed = parseCsvData(cachedCsv)
                if (parsed.length > 0) {
                    setSongs(parsed)
                    setLoading(false)
                    hasLoadedCache = true
                }
            } catch (err) {
                console.warn('Errore lettura cache canti:', err)
            }
        }

        // 2. Scarica la versione più recente in background
        fetch(CSV_URL)
            .then((res) => {
                if (!res.ok) throw new Error('Risposta di rete non valida')
                return res.text()
            })
            .then((freshCsv) => {
                if (!isMounted) return
                // Aggiorna silenziosamente se i dati sono cambiati o se non c'era cache
                if (freshCsv && freshCsv !== cachedCsv) {
                    localStorage.setItem(CACHE_KEY, freshCsv)
                    const parsed = parseCsvData(freshCsv)
                    if (parsed.length > 0) {
                        setSongs(parsed)
                    }
                }
                setLoading(false)
                setError(null)
            })
            .catch((err) => {
                if (!isMounted) return
                // Se non c'era nemmeno la cache, mostra errore; altrimenti silenzioso
                if (!hasLoadedCache) {
                    console.error('Impossibile caricare i canti:', err)
                    setError('Errore durante il caricamento dei canti.')
                }
                setLoading(false)
            })

        return () => {
            isMounted = false
        }
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