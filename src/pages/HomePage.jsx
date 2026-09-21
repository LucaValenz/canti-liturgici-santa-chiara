export default function HomePage({ songs, loading, error }) {
    return (
        <section className="page-content">
            <h2>Catalogo Canti</h2>
            {loading && <p>Caricamento canti in corso...</p>}
            {error && <p>{error}</p>}
            {!loading && !error && <p>Canti pronti: {songs.length}</p>}
        </section>
    )
}