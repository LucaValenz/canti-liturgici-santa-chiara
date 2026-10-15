export default function SongLyrics({ rawLyrics, fontSize }) {
    if (!rawLyrics) {
        return <p className="no-lyrics">Testo non disponibile per questo canto.</p>
    }

    // Gestione tollerante di tutte le varianti di tag:
    // 1. Coppie ritornello con testo: <RIT> ... </RIT> oppure <RIT> ... <RIT/>
    // 2. Segnaposto isolati: <RIT/> oppure </RIT>
    let text = rawLyrics

    // Estrae i blocchi ritornello completi racchiusi tra <RIT> e </RIT> o <RIT/>
    text = text.replace(/<RIT>([\s\S]*?)<\/?RIT\s*\/?>/gi, (_, p1) => {
        return `\n\n[[CHORUS]]\n${p1.trim()}\n[[/CHORUS]]\n\n`
    })

    // Eventuali tag rimasti isolati diventano segnaposto "— Rit. —"
    text = text.replace(/<\/?RIT\s*\/?>/gi, '\n\n[[MARKER]]\n\n')

    // Suddivide in blocchi per righe vuote
    const rawBlocks = text
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)

    const parsedBlocks = []

    rawBlocks.forEach((block) => {
        if (block === '[[MARKER]]') {
            parsedBlocks.push({ type: 'marker' })
            return
        }

        if (block.startsWith('[[CHORUS]]')) {
            const clean = block
                .replace(/^\[\[CHORUS\]\]\s*/, '')
                .replace(/\s*\[\[\/CHORUS\]\]$/, '')
                .trim()
            const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean)
            if (lines.length > 0) {
                parsedBlocks.push({ type: 'chorus', lines })
            }
            return
        }

        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        if (lines.length > 0) {
            parsedBlocks.push({ type: 'verse', lines })
        }
    })

    return (
        <div className="lyrics-wrapper" style={{ fontSize: `${fontSize}px` }}>
            {parsedBlocks.map((block, idx) => {
                if (block.type === 'marker') {
                    return (
                        <div key={idx} className="lyrics-stanza chorus-marker">
                            <span>— Rit. —</span>
                        </div>
                    )
                }

                const isChorus = block.type === 'chorus'

                return (
                    <div
                        key={idx}
                        className={`lyrics-stanza ${isChorus ? 'chorus' : ''}`}
                    >
                        {block.lines.map((line, lineIdx) => (
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