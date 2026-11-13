import { useId } from 'react'

/** Quanto do frasco fica cheio: mostra a intensidade sem precisar ler. */
const NIVEL: Record<string, number> = { LEVE: 0.42, MEDIA: 0.64, FORTE: 0.88 }

/**
 * Frasco de perfume desenhado. A cor do líquido é a da família (CSS: .frasco-fresco, .frasco-citrico…)
 * e a altura do líquido é a intensidade. Pendente = frasco tracejado, vazio (ainda em análise).
 */
export default function Frasco({ familia, intensidade, pendente = false, tamanho = 72 }: {
  familia?: string | null
  intensidade?: string | null
  pendente?: boolean
  tamanho?: number
}) {
  const id = useId().replace(/:/g, '')
  const nivel = pendente ? 0 : NIVEL[intensidade ?? ''] ?? 0.6
  // Corpo do frasco: de y=34 a y=118 (84 de altura)
  const topoLiquido = 118 - 84 * nivel
  const classe = pendente ? 'frasco frasco-pendente' : `frasco frasco-${(familia ?? 'nenhuma').toLowerCase()}`

  return (
    <svg className={classe} width={tamanho} height={tamanho * 1.4} viewBox="0 0 100 140" aria-hidden="true">
      <defs>
        <clipPath id={`corpo-${id}`}>
          <rect x="16" y="34" width="68" height="84" rx="16" />
        </clipPath>
      </defs>
      {/* Tampa e gargalo */}
      <rect className="frasco-tampa" x="36" y="4" width="28" height="18" rx="5" />
      <rect className="frasco-gargalo" x="42" y="22" width="16" height="12" rx="2" />
      {/* Vidro */}
      <rect className="frasco-vidro" x="16" y="34" width="68" height="84" rx="16" />
      {/* Líquido */}
      {nivel > 0 && (
        <g clipPath={`url(#corpo-${id})`}>
          <rect className="frasco-liquido" x="16" y={topoLiquido} width="68" height={118 - topoLiquido} />
          <rect className="frasco-superficie" x="16" y={topoLiquido} width="68" height="3" />
        </g>
      )}
      {/* Brilho do vidro */}
      <rect className="frasco-brilho" x="25" y="44" width="7" height="44" rx="3.5" />
      <rect className="frasco-contorno" x="16" y="34" width="68" height="84" rx="16" />
    </svg>
  )
}
