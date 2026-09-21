import { useParams, Link } from 'react-router-dom'

export default function SongPage() {
    const { id } = useParams()

    return (
        <section className="page-content">
            <Link to="/" className="back-link">← Torna all'elenco</Link>
            <h2>Dettaglio Canto: {id}</h2>
            <p>Qui visualizzeremo il testo completo e lo spartito incorporato.</p>
        </section>
    )
}