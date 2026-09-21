export default function SongLyrics({ rawLyrics, fontSize }) {
    if (!rawLyrics) {
        return <p className="no-lyrics">Testo non disponibile per questo canto.</p>
    }

    // Divide il testo per doppi a capo (blocchi/strofe)
    const blocks = rawLyrics
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)

    const isChorus = (block) => {
        const clean = block.trim()
        const startsWithRit = /^(rit\.?|ritornello)/i.test(clean)
        // Controlla se il blocco ha abbastanza lettere ed è tutto in maiuscolo
        const letters = clean.replace(/[^a-zA-ZàèéìòùÀÈÉÌÒÙ]/g, '')
        const isAllUpper = letters.length > 10 && letters === letters.toUpperCase()

        return startsWithRit || isAllUpper
    }

    return (
        <div className="lyrics-wrapper" style={{ fontSize: `${fontSize}px` }}>
            {blocks.map((block, idx) => {
                const chorus = isChorus(block)
                return (
                    <div
                        key={idx}
                        className={`lyrics-stanza ${chorus ? 'chorus' : ''}`}
                    >
                        {block.split('\n').map((line, lineIdx) => (
                            <p key={lineIdx} className="lyrics-line">
                                {line}
                            </p>
                        ))}
                    </div>
                )
            })}
        </div>
    )
}