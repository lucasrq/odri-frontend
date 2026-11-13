import { api } from './api'

export type FaixaPreco = 'ATE_150' | 'DE_150_A_400' | 'ACIMA_400'
export type LojaParceira = 'AMAZON' | 'MERCADO_LIVRE'

/** Um perfume da Loja (OfertaDTO). */
export type Oferta = {
  id: number
  nome: string
  marca: string
  familia: string
  intensidade: string
  faixa: FaixaPreco
  loja: LojaParceira | null
  link: string
}

/** Resposta de GET /loja (LojaDTO): até 3 ofertas, barato → médio → caro. */
export type RespostaLoja = { tempo: string; titulo: string; ofertas: Oferta[] }

/** tempo = o mesmo da sugestão do dia (CALOR, AMENO, FRIO). Sem tempo = qualquer clima. */
export const buscarLoja = (tempo?: string) =>
  api<RespostaLoja>(`/loja${tempo ? `?tempo=${encodeURIComponent(tempo)}` : ''}`)

export const NOME_FAIXA: Record<FaixaPreco, { nivel: string; preco: string }> = {
  ATE_150: { nivel: 'Barato', preco: 'até R$150' },
  DE_150_A_400: { nivel: 'Médio', preco: 'R$150 a R$400' },
  ACIMA_400: { nivel: 'Caro', preco: 'acima de R$400' },
}

export const NOME_LOJA: Record<LojaParceira, string> = {
  AMAZON: 'na Amazon',
  MERCADO_LIVRE: 'no Mercado Livre',
}
