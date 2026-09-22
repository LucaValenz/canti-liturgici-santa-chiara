import { useState } from 'react'
import { Link } from 'react-router-dom'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzbGK0hPvNUNyq5cLUWC9vb11Nm3S0jVGx9fXBvYk2Pp5mUdp7ozzsQbRp0mwrnMX9/exec'

export default function SuggestPage() {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        link: '',
        notes: '',
        name: ''
    })

    const [status, setStatus] = useState({
        submitting: false,
        success: false,
        error: null
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            setStatus({ submitting: false, success: false, error: 'Il titolo del canto è obbligatorio.' })
            return
        }

        setStatus({ submitting: true, success: false, error: null })

        try {
            // Usiamo mode 'no-cors' per evitare blocchi cross-origin dal redirect di Google Apps Script
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(formData)
            })

            setStatus({
                submitting: false,
                success: true,
                error: null
            })

            // Svuota il modulo
            setFormData({
                title: '',
                author: '',
                link: '',
                notes: '',
                name: ''
            })
        } catch (err) {
            console.error('Errore invio suggerimento:', err)
            setStatus({
                submitting: false,
                success: false,
                error: "Si è verificato un errore durante l'invio. Riprova più tardi."
            })
        }
    }

    return (
        <section className="suggest-page-container">
            <Link to="/" className="back-link">← Torna all'elenco</Link>

            <header className="suggest-header">
                <h2>Suggerisci un Canto </h2>
                <p className="suggest-subtitle">
                    Proponi un brano per arricchire il repertorio del coro e le celebrazioni parrocchiali.
                </p>
            </header>

            {status.success ? (
                <div className="suggest-success-card">
                    <div className="success-icon">✓</div>
                    <h3>Grazie per la proposta!</h3>
                    <p>Il canto è stato inviato e salvato nell'archivio delle proposte.</p>
                    <button
                        type="button"
                        className="btn-new-suggestion"
                        onClick={() => setStatus({ submitting: false, success: false, error: null })}
                    >
                        Suggerisci un altro canto
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="suggest-form">
                    {status.error && (
                        <div className="suggest-error-banner">
                            {status.error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="title">
                            Titolo del canto <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="es. Frutto della nostra terra"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="author">Autore o Gruppo (opzionale)</label>
                        <input
                            type="text"
                            id="author"
                            name="author"
                            placeholder="es. Buttazzo, RnS, Frisina..."
                            value={formData.author}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="link">Link YouTube (opzionale)</label>
                        <input
                            type="url"
                            id="link"
                            name="link"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.link}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Aggiungi un commento (opzionale)</label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            placeholder="es. Adatto per l'Offertorio nel tempo ordinario, strofe facili per l'assemblea..."
                            value={formData.notes}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Il tuo nome (opzionale)</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Chi suggerisce il canto?"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit-suggestion-btn"
                        disabled={status.submitting}
                    >
                        {status.submitting ? 'Invio in corso...' : 'Invia Proposta'}
                    </button>
                </form>
            )}
        </section>
    )
}