import { api } from './api'
import type { ItemColecao } from './colecao'

/** Um perfume na aba Análise (AnaliseItemDTO do back-end). */
export type ItemAnalise = {
  id: number
  nome: string
  marca: string
  pendente: boolean
  nota: number | null
  selo: 'COMBINA' | 'PODE_IR' | 'EVITE' | 'EM_ANALISE'
  familia: string | null
  intensidade: string | null
  motivo: string
  /** Quando rende melhor hoje, se não combina agora (previsão do dia). FRIO = só em dia frio. */
  melhorHorario?: 'MANHA' | 'TARDE' | 'NOITE' | 'FRIO' | null
  melhorGraus?: number | null
  melhorNota?: number | null
}

/** Selo de quem não combina agora mas tem horário melhor hoje. */
export const NOME_MELHOR_HORARIO = {
  MANHA: 'Melhor de manhã', TARDE: 'Melhor à tarde', NOITE: 'Melhor à noite', FRIO: 'Só no frio',
} as const
const QUANDO_HORARIO = { MANHA: 'De manhã', TARDE: 'À tarde', NOITE: 'À noite' } as const

/**
 * "À noite (24 °C) o Portinari rende mais." — o perfume da coleção que mais melhora mais tarde.
 * null quando nenhum tem horário melhor hoje.
 */
export function dicaMaisTarde(analise: ItemAnalise[]): string | null {
  const candidatos = analise.filter(
    (a) => a.melhorHorario && a.melhorHorario !== 'FRIO' && a.melhorNota != null,
  )
  if (candidatos.length === 0) return null
  const melhor = candidatos.reduce((a, b) => ((b.melhorNota ?? 0) > (a.melhorNota ?? 0) ? b : a))
  const quando = QUANDO_HORARIO[melhor.melhorHorario as 'MANHA' | 'TARDE' | 'NOITE']
  const graus = melhor.melhorGraus != null ? ` (${Math.round(melhor.melhorGraus)} °C)` : ''
  return `${quando}${graus} o ${melhor.nome} rende mais.`
}

/** Resposta de GET /sugestao (SugestaoDTO). */
export type Sugestao = {
  local: string | null
  temperatura: number | null
  tempo: 'CALOR' | 'AMENO' | 'FRIO' | 'DESCONHECIDO'
  periodo: 'MANHA' | 'TARDE' | 'NOITE'
  perfume: ItemColecao | null
  segundaOpcao: ItemColecao | null
  motivo: string
  creditoClima: string
  nadaCombina: boolean
  analise: ItemAnalise[]
  chuva?: string | null // ex.: "Chuva às 15h", "Chovendo agora"; null = sem chuva
  ocasiao?: string | null // nome da ocasião que entrou na conta (Plus)
  /** Só Plus: a sugestão pronta de cada ocasião (chave = id; "" = sem ocasião). Troca na hora, sem esperar o servidor. */
  porOcasiao?: Record<string, Sugestao> | null
}

/** Sem coordenadas = o back usa a cidade fixa do cliente. */
export function buscarSugestao(coords?: { lat: number; lon: number }) {
  const busca = coords ? `?lat=${coords.lat}&lon=${coords.lon}` : ''
  return api<Sugestao>(`/sugestao${busca}`)
}

/** Localização do celular (para quem escolheu "automático"). */
export function pegarLocalizacao(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolver, recusar) => {
    if (!('geolocation' in navigator)) return recusar(new Error('sem geolocalização'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ lat: p.coords.latitude, lon: p.coords.longitude }),
      recusar,
      { timeout: 10000, maximumAge: 30 * 60 * 1000 },
    )
  })
}

export const NOME_FAMILIA: Record<string, string> = {
  FRESCO: 'Fresco', CITRICO: 'Cítrico', FLORAL: 'Floral',
  DOCE: 'Doce', AMADEIRADO: 'Amadeirado', ORIENTAL: 'Oriental',
}
export const NOME_INTENSIDADE: Record<string, string> = { LEVE: 'Leve', MEDIA: 'Média', FORTE: 'Forte' }
export const NOME_PERIODO = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' } as const
export const SAUDACAO = { MANHA: 'Bom dia', TARDE: 'Boa tarde', NOITE: 'Boa noite' } as const
export const NOME_SELO = { COMBINA: 'Combina', PODE_IR: 'Pode ir', EVITE: 'Evite hoje', EM_ANALISE: 'Em análise' } as const

/** Cor da bolinha: frio azul → ameno verde-água → quente laranja → muito quente vermelho. */
export function corDaTemperatura(t: number | null) {
  if (t === null) return 'var(--apagado)'
  if (t <= 15) return '#3B7DD8'
  if (t <= 22) return '#2A9D8F'
  if (t <= 29) return '#D08A2E'
  return '#D9542B'
}
