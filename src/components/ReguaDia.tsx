/** Um ponto na régua: posição de 0 a 100 (manhã → noite). */
export type MarcaRegua = {
  pos: number
  rotulo: string
  /** desenha a bolinha em cima da faixa */
  ponto?: boolean
  /** rótulo em negrito (a hora de agora) */
  ativo?: boolean
}

/**
 * Régua do dia: uma faixa que vai do amanhecer (claro) à noite (escuro).
 * Usada na página inicial, no celular de exemplo e na tela Hoje.
 * Com "aoEscolher", os rótulos viram botões (celular de exemplo).
 */
export default function ReguaDia({ marcas, aoEscolher, rotuloGrupo }: {
  marcas: MarcaRegua[]
  aoEscolher?: (i: number) => void
  rotuloGrupo?: string
}) {
  return (
    <div className="regua">
      <div className="regua-trilho" aria-hidden="true">
        <span className="regua-faixa" />
        {marcas.map((m) => m.ponto && (
          <span key={m.rotulo} className="regua-ponto" style={{ left: `${m.pos}%` }} />
        ))}
      </div>
      <div className="regua-rotulos" role={aoEscolher ? 'group' : undefined} aria-label={rotuloGrupo}>
        {marcas.map((m, i) => aoEscolher ? (
          <button
            key={m.rotulo} type="button" className={`regua-rotulo toque ${m.ativo ? 'ativo' : ''}`}
            style={{ left: `${m.pos}%` }} aria-pressed={!!m.ativo} onClick={() => aoEscolher(i)}
          >
            {m.rotulo}
          </button>
        ) : (
          <span key={m.rotulo} className={`regua-rotulo ${m.ativo ? 'ativo' : ''}`} style={{ left: `${m.pos}%` }}>
            {m.rotulo}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Posição de cada período na régua (manhã, tarde, noite). */
export const POS_PERIODO = [16, 50, 84] as const
