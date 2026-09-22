export default function FontSizeControls({ fontSize, setFontSize }) {
    const changeFontSize = (delta) => {
        setFontSize((prev) => {
            const next = Math.min(Math.max(prev + delta, 14), 28)
            localStorage.setItem('hymn_font_size', next)
            return next
        })
    }

    return (
        <div className="font-controls">
            <span className="toolbar-label">Testo:</span>
            <button
                type="button"
                onClick={() => changeFontSize(-2)}
                title="Rimpicciolisci font"
                aria-label="Rimpicciolisci carattere"
            >
                A-
            </button>
            <span className="font-size-indicator">{fontSize}px</span>
            <button
                type="button"
                onClick={() => changeFontSize(2)}
                title="Ingrandisci font"
                aria-label="Ingrandisci carattere"
            >
                A+
            </button>
        </div>
    )
}