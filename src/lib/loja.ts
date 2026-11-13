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
  genero: Genero | null
  naColecao: boolean
}

export type Genero = 'MASCULINO' | 'FEMININO' | 'UNISSEX'
export type OrdemPreco = 'menor' | 'maior'

/** Resposta de GET /loja (LojaDTO): até 3 ofertas, barato → médio → caro. */
export type RespostaLoja = { tempo: string; titulo: string; ofertas: Oferta[] }

/** tempo = o mesmo da sugestão do dia (CALOR, AMENO, FRIO). Sem tempo = qualquer clima. */
export const buscarLoja = (tempo?: string) =>
  api<RespostaLoja>(`/loja${tempo ? `?tempo=${encodeURIComponent(tempo)}` : ''}`)

/** Catálogo inteiro da Loja (GET /loja/catalogo). genero vazio = todos. */
export function buscarCatalogo(filtro: { busca?: string; genero?: Genero | ''; ordem?: OrdemPreco }) {
  const q = new URLSearchParams()
  if (filtro.busca?.trim()) q.set('busca', filtro.busca.trim())
  if (filtro.genero) q.set('genero', filtro.genero)
  if (filtro.ordem) q.set('ordem', filtro.ordem)
  const texto = q.toString()
  return api<Oferta[]>(`/loja/catalogo${texto ? `?${texto}` : ''}`)
}

export const NOME_GENERO: Record<Genero, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  UNISSEX: 'Unissex',
}

/** Dica da Loja no Hoje: no máximo 1 vez a cada 3 dias por pessoa (fica no navegador). */
const TRES_DIAS = 3 * 24 * 60 * 60 * 1000
export function podeMostrarDica(clienteId: string) {
  try {
    const ultima = Number(localStorage.getItem(`odri-dica-${clienteId}`) ?? 0)
    return Date.now() - ultima > TRES_DIAS
  } catch {
    return false
  }
}
export function marcarDicaMostrada(clienteId: string) {
  try {
    localStorage.setItem(`odri-dica-${clienteId}`, String(Date.now()))
  } catch {
    // sem localStorage: só não guarda
  }
}

export const NOME_FAIXA: Record<FaixaPreco, { nivel: string; preco: string }> = {
  ATE_150: { nivel: 'Barato', preco: 'até R$150' },
  DE_150_A_400: { nivel: 'Médio', preco: 'R$150 a R$400' },
  ACIMA_400: { nivel: 'Caro', preco: 'acima de R$400' },
}

export const NOME_LOJA: Record<LojaParceira, string> = {
  AMAZON: 'na Amazon',
  MERCADO_LIVRE: 'no Mercado Livre',
}

/** 1, 2 ou 3 "cifras" na vitrine. */
export const ORDEM_FAIXA: Record<FaixaPreco, number> = { ATE_150: 1, DE_150_A_400: 2, ACIMA_400: 3 }
