export default function SongLyrics({ rawLyrics, fontSize }) {
    if (!rawLyrics) {
        return <p className="no-lyrics">Testo non disponibile per questo canto.</p>
    }

    // Isola i blocchi <RIT>...</RIT> e <RIT/> mantenendo le strofe separate
    // Inserisce newline di sicurezza attorno ai tag per garantire la divisione pulita
    const normalized = rawLyrics
        .replace(/<RIT\s*\/>/gi, '\n\n<RIT/>\n\n')
        .replace(/<RIT>/gi, '\n\n<RIT>\n')
        .replace(/<\/RIT>/gi, '\n</RIT>\n\n')

    // Divide per doppi a capo
    const rawBlocks = normalized
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)

    // Parsing dei blocchi
    const parsedBlocks = []
    let inChorus = false
    let currentChorusLines = []

    rawBlocks.forEach((block) => {
        if (/^<RIT\/>$/i.test(block)) {
            parsedBlocks.push({ type: 'marker' })
            return
        }

        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)

        lines.forEach((line) => {
            if (/^<RIT>$/i.test(line)) {
                inChorus = true
                currentChorusLines = []
            } else if (/^<\/RIT>$/i.test(line)) {
                inChorus = false
                if (currentChorusLines.length > 0) {
                    parsedBlocks.push({ type: 'chorus', lines: [...currentChorusLines] })
                    currentChorusLines = []
                }
            } else {
                if (inChorus) {
                    currentChorusLines.push(line)
                } else {
                    // Riga di strofa normale
                    // Se l'ultimo blocco inserito è una strofa, accoda la riga, altrimenti crea nuova strofa
                    const last = parsedBlocks[parsedBlocks.length - 1]
                    if (last && last.type === 'verse' && last._fromSameBlock) {
                        last.lines.push(line)
                    } else {
                        parsedBlocks.push({ type: 'verse', lines: [line], _fromSameBlock: true })
                    }
                }
            }
        })

        // Segna concluso il raggruppamento del blocco corrente per le strofe
        const last = parsedBlocks[parsedBlocks.length - 1]
        if (last && last.type === 'verse') {
            delete last._fromSameBlock
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