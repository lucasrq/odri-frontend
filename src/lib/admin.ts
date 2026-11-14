import { api, ErroApi } from './api'
import type { FaixaPreco, Genero, LojaParceira } from './loja'

/** Perfume com tudo, só pro admin (PerfumeAdminDTO do back-end). */
export type PerfumeAdmin = {
  id: number
  nome: string
  marca: string
  familia: string | null
  intensidade: string | null
  clima: string | null
  genero: Genero | null
  faixa: FaixaPreco | null
  loja: LojaParceira | null
  link: string | null
  status: 'PENDENTE' | 'APROVADO'
  criadoEm: string
}

/** O que o admin salva. link "" = tira da Loja; campo ausente = não mexe. */
export type Classificacao = {
  familia: string
  intensidade: string
  clima: string
  genero?: Genero
  faixa?: FaixaPreco
  loja?: LojaParceira
  link?: string
}

/** GET /admin/numeros (NumerosDTO). semana = últimos 7 dias. */
export type Numeros = {
  cadastrosTotal: number
  cadastrosSemana: number
  cadastrosHoje: number
  assinantes: number
  adesivoDiaTotal: number
  adesivoDiaSemana: number
  adesivoColecaoTotal: number
  adesivoColecaoSemana: number
  cliquesLojaTotal: number
  cliquesLojaSemana: number
  pendentes: number
  naLoja: number
  maisClicados: { nome: string; marca: string; cliques: number }[]
}

export const buscarNumeros = () => api<Numeros>('/admin/numeros')

/**
 * Texto pronto pra colar no Claude: as regras, o formato do SQL e a lista de pendentes.
 * O Claude devolve os updates; o Lucas cola no SQL Editor do Supabase.
 */
export function textoPendentes(lista: PerfumeAdmin[], hoje = new Date()) {
  const data = hoje.toLocaleDateString('pt-BR')
  return `PERFUMES PENDENTES DA ODRI (${lista.length}) - ${data}

Você é especialista em perfumaria no Brasil. Classifique os perfumes da lista no fim e me devolva SÓ um bloco SQL (PostgreSQL) pronto pra rodar no SQL Editor do Supabase.

Para cada perfume, escolha:
- familia: FRESCO, CITRICO, FLORAL, DOCE, AMADEIRADO ou ORIENTAL
- intensidade: LEVE, MEDIA ou FORTE
- clima (onde ele funciona melhor): CALOR, FRIO ou TODOS
- genero: MASCULINO, FEMININO ou UNISSEX
- faixa_preco (frasco de 100 ml, preço médio no Brasil): ATE_150, DE_150_A_400 ou ACIMA_400
- loja: MERCADO_LIVRE (nacionais e árabes) ou AMAZON (importados)
- link_afiliado: link de BUSCA na loja. Exemplos:
  https://lista.mercadolivre.com.br/kaiak-natura
  https://www.amazon.com.br/s?k=Sauvage+Dior

Regras:
- Um update por perfume, exatamente neste formato (não mude nome nem marca):
  update perfumes set familia = 'FRESCO', intensidade = 'LEVE', clima = 'CALOR', genero = 'MASCULINO', faixa_preco = 'ATE_150', loja = 'MERCADO_LIVRE', link_afiliado = 'https://...', status = 'APROVADO' where id = 123 and status = 'PENDENTE';
- Aspas simples dentro de texto viram duas aspas simples ('').
- Se um item NÃO for um perfume real, estiver com o nome errado ou for repetido, NÃO crie update pra ele: liste no fim, em comentários SQL (linhas começando com --), com o id e o motivo. Eu resolvo pelo Admin do site.
- Se não tiver certeza de algum campo, escolha o mais provável e avise num comentário -- na linha de cima.

Perfumes pendentes (id | nome | marca):
${lista.map((p) => `${p.id} | ${p.nome} | ${p.marca}`).join('\n')}
`
}

export const NOME_CLIMA: Record<string, string> = { CALOR: 'Calor', FRIO: 'Frio', TODOS: 'Qualquer clima' }

/** Só o admin recebe 200 em /admin/**; o resto recebe 403. */
export async function ehAdmin() {
  try {
    await api('/admin/pendentes')
    return true
  } catch (e) {
    if (e instanceof ErroApi && (e.status === 403 || e.status === 401)) return false
    throw e
  }
}

export const listarPendentes = () => api<PerfumeAdmin[]>('/admin/pendentes')

export const listarCatalogoAdmin = (busca: string) =>
  api<PerfumeAdmin[]>(`/admin/perfumes?busca=${encodeURIComponent(busca.trim())}`)

export const salvarPerfume = (id: number, dados: Classificacao) =>
  api<PerfumeAdmin>(`/admin/perfumes/${id}`, { method: 'PATCH', body: JSON.stringify(dados) })

export const recusarPerfume = (id: number) => api<void>(`/admin/perfumes/${id}`, { method: 'DELETE' })
