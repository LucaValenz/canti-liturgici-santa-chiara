import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'

export default function AdminModal() {
    const { showLoginModal, setShowLoginModal, loginWithPin } = useAdmin()
    const [pin, setPin] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    if (!showLoginModal) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        const result = loginWithPin(pin)
        if (!result.success) {
            setErrorMessage(result.error)
            setPin('')
        } else {
            setErrorMessage('')
            setPin('')
        }
    }

    const handleClose = () => {
        setErrorMessage('')
        setPin('')
        setShowLoginModal(false)
    }

    return (
        <div className="admin-modal-overlay" onClick={handleClose}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="admin-modal-close"
                    onClick={handleClose}
                    aria-label="Chiudi"
                >
                    ✕
                </button>

                <div className="admin-modal-header">
                    <h3>Sei Luca? 👋</h3>
                    <p>Inserisci il PIN per visualizzare gli spartiti personali con le tue note.</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => {
                            setErrorMessage('')
                            setPin(e.target.value)
                        }}
                        autoFocus
                        className="admin-pin-input"
                    />

                    {errorMessage && <p className="admin-error-msg">{errorMessage}</p>}

                    <div className="admin-modal-actions">
                        <button type="button" className="btn-cancel" onClick={handleClose}>
                            Annulla
                        </button>
                        <button type="submit" className="btn-confirm">
                            Sblocca
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}