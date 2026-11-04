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
