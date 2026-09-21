import { useSongs } from '../context/SongsContext'

export default function HomePage() {
    const { songs, loading, error } = useSongs()

    if (loading) return <p className="status-message">Caricamento canti...</p>
    if (error) return <p className="status-message">{error}</p>

    return (
        <section>
            <h2>Catalogo ({songs.length} canti)</h2>
        </section>
    )
}