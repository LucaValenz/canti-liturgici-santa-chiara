import { Link } from 'react-router-dom'

export default function SongCard({ song }) {
    return (
        <article className="song-card">
            <div className="card-top">
                {song.id && <span className="card-id">{song.id}</span>}
                {song.youtube && (
                    <a
                        href={song.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="youtube-badge"
                        title="Ascolta su YouTube"
                    >
                        ▶ YouTube
                    </a>
                )}
            </div>

            <h3 className="card-title">{song.title}</h3>
            {song.author && <p className="card-author">{song.author}</p>}

            {song.tags.length > 0 && (
                <div className="card-tags">
                    {song.tags.map((tag, idx) => (
                        <span key={idx} className="tag-pill">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="card-footer">
                <Link to={`/song/${song.id}`} className="details-btn">
                    Vedi Canto e Testo →
                </Link>
            </div>
        </article>
    )
}