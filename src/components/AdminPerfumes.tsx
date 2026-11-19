import { useCallback, useEffect, useState } from 'react'
import {
  buscarNumeros, ehAdmin, listarCatalogoAdmin, listarSugestoes, Numeros, PerfumeAdmin, recusarPerfume, SugestaoAdmin,
  textoPendentes,
} from '../lib/admin'
import { NOME_FAIXA, NOME_GENERO } from '../lib/loja'
import { NOME_FAMILIA, NOME_INTENSIDADE } from '../lib/painel'
import Frasco from './Frasco'
import AdminDarPlus from './AdminDarPlus'

type Aba = 'cadastros' | 'catalogo' | 'plus'

/**
 * Tela do admin (/app/admin). Aqui ninguém classifica nada à mão:
 * - Cadastros: os perfumes que os clientes cadastraram, com ✅ cadastrado ou ⏳ ainda não.
 *   A classificação é feita pelo SQL (o Claude gera); quando vira APROVADO,
 *   o back-end manda sozinho o e-mail "seu perfume já está na odri".
 * - Catálogo: só pra consultar como um perfume está classificado.
 */
export default function AdminPerfumes() {
  const [permitido, setPermitido] = useState<boolean | null>(null)
  const [aba, setAba] = useState<Aba>('cadastros')
  const [cadastros, setCadastros] = useState<SugestaoAdmin[] | null>(null)
  const [catalogo, setCatalogo] = useState<PerfumeAdmin[] | null>(null)
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState(false)

  useEffect(() => {
    ehAdmin().then(setPermitido).catch(() => setErro(true))
  }, [])

  const carregarCadastros = useCallback(async () => {
    try { setCadastros(await listarSugestoes()) } catch { setErro(true) }
  }, [])

  useEffect(() => { if (permitido) carregarCadastros() }, [permitido, carregarCadastros])

  // Catálogo: espera parar de digitar
  useEffect(() => {
    if (!permitido || aba !== 'catalogo') return
    const espera = setTimeout(async () => {
      try { setCatalogo(await listarCatalogoAdmin(busca)) } catch { setErro(true) }
    }, busca ? 300 : 0)
    return () => clearTimeout(espera)
  }, [permitido, aba, busca])

  if (permitido === false) {
    return (
      <section className="painel-pagina">
        <h2 className="painel-titulo-pagina">Admin</h2>
        <p className="texto-2">Só o admin da odri vê esta página.</p>
      </section>
    )
  }

  const pendentes = cadastros?.filter((c) => c.status === 'PENDENTE') ?? []
  const tirar = (id: number) => setCadastros((l) => l?.filter((x) => x.id !== id) ?? null)

  return (
    <section className="painel-pagina admin" aria-labelledby="titulo-admin">
      <h2 id="titulo-admin" className="painel-titulo-pagina">Admin</h2>

      {permitido && <PainelNumeros />}

      <div className="colecao-filtros" role="tablist" aria-label="Admin">
        <button type="button" role="tab" className="colecao-filtro" aria-pressed={aba === 'cadastros'} aria-selected={aba === 'cadastros'} onClick={() => setAba('cadastros')}>
          Cadastros dos clientes{pendentes.length ? ` (${pendentes.length} ⏳)` : ''}
        </button>
        <button type="button" role="tab" className="colecao-filtro" aria-pressed={aba === 'catalogo'} aria-selected={aba === 'catalogo'} onClick={() => setAba('catalogo')}>
          Catálogo
        </button>
        <button type="button" role="tab" className="colecao-filtro" aria-pressed={aba === 'plus'} aria-selected={aba === 'plus'} onClick={() => setAba('plus')}>
          Dar Plus
        </button>
      </div>

      {aba === 'plus' && permitido && <AdminDarPlus />}

      {aba === 'cadastros' && pendentes.length > 0 && (
        <div className="admin-exportar">
          <button type="button" className="botao botao-escuro botao-mini" onClick={() => baixarTexto(pendentes)}>
            Baixar pendentes (.txt)
          </button>
          <span className="painel-dica">Mande pro Claude: ele devolve o SQL pra rodar no Supabase.</span>
        </div>
      )}

      {aba === 'catalogo' && (
        <label className="campo">
          <span className="sr-only">Buscar no catálogo</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou marca" autoComplete="off" />
        </label>
      )}

      {erro && <p className="conta-erro" role="alert">Não deu para carregar. Recarregue a página.</p>}

      {aba === 'cadastros' && !erro && (
        cadastros === null || permitido === null
          ? <p className="painel-dica">Carregando…</p>
          : cadastros.length === 0
            ? <p className="painel-dica">Nenhum cliente cadastrou perfume ainda.</p>
            : (
              <ul className="admin-lista">
                {cadastros.map((c) => <ItemCadastro key={c.id} item={c} aoRecusar={tirar} />)}
              </ul>
            )
      )}

      {aba === 'catalogo' && !erro && (
        catalogo === null
          ? <p className="painel-dica">Carregando…</p>
          : catalogo.length === 0
            ? <p className="painel-dica">Nada encontrado.</p>
            : (
              <ul className="admin-lista">
                {catalogo.map((p) => <ItemCatalogo key={p.id} perfume={p} />)}
              </ul>
            )
      )}
    </section>
  )
}

/** Baixa o .txt com as regras + lista, pra mandar pro Claude. */
function baixarTexto(lista: SugestaoAdmin[]) {
  const hoje = new Date()
  const blob = new Blob([textoPendentes(lista, hoje)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  // data local (a de toISOString é UTC: depois das 21h já vira o dia seguinte)
  const dia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
  link.download = `odri-pendentes-${dia}.txt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/** Cadastros, assinantes, adesivos baixados e cliques na Loja. */
function PainelNumeros() {
  const [n, setN] = useState<Numeros | null>(null)
  const [erro, setErro] = useState(false)
  useEffect(() => { buscarNumeros().then(setN).catch(() => setErro(true)) }, [])

  if (erro) return <p className="painel-dica">Não deu para carregar os números agora.</p>
  if (!n) return <p className="painel-dica">Carregando números…</p>

  const origens = (n.origensSemana ?? []).slice(0, 3).map((o) => `${o.origem} ${o.visitas}`).join(' · ')
  const caixas: [string, number, string][] = [
    ['Visitas no site (7 dias)', n.visitasSemana ?? 0, `${n.visitasHoje ?? 0} hoje${origens ? ' · ' + origens : ''}`],
    ['Viram a sugestão (7 dias)', n.viramSugestaoSemana ?? 0, `${n.viramSugestaoHoje ?? 0} pessoas hoje`],
    ['Cadastros', n.cadastrosTotal, `+${n.cadastrosSemana} na semana · ${n.cadastrosHoje} hoje`],
    ['Plus valendo', n.assinantes, `${n.testesPlus ?? 0} testes começados · ${n.presentesPlus ?? 0} presentes`],
    ['Abriram o Plus', n.plusAbriuTotal ?? 0, `+${n.plusAbriuSemana ?? 0} na semana · ${n.ocasioesSemana ?? 0} ocasiões`],
    ['Adesivo do dia', n.adesivoDiaTotal, `+${n.adesivoDiaSemana} na semana`],
    ['Adesivo da coleção', n.adesivoColecaoTotal, `+${n.adesivoColecaoSemana} na semana`],
    ['Cliques na Loja', n.cliquesLojaTotal, `+${n.cliquesLojaSemana} na semana`],
    ['Perfumes na Loja', n.naLoja, `${n.pendentes} pendente${n.pendentes === 1 ? '' : 's'}`],
  ]
  return (
    <div className="admin-numeros">
      <ul className="admin-caixas">
        {caixas.map(([rotulo, valor, sub]) => (
          <li key={rotulo} className="admin-caixa">
            <span className="painel-rotulo">{rotulo}</span>
            <strong className="numero">{valor.toLocaleString('pt-BR')}</strong>
            <span className="apagado">{sub}</span>
          </li>
        ))}
      </ul>
      {n.maisClicados.length > 0 && (
        <div className="painel-bloco">
          <span className="painel-rotulo">Mais clicados na Loja (30 dias)</span>
          <ol className="admin-ranking">
            {n.maisClicados.map((p) => (
              <li key={p.nome + p.marca}>
                <span><strong>{p.nome}</strong> <span className="apagado">{p.marca}</span></span>
                <span className="numero">{p.cliques}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

/** Um perfume cadastrado por cliente: ✅ cadastrado ou ⏳ ainda não (com Recusar pra lixo). */
function ItemCadastro({ item: c, aoRecusar }: { item: SugestaoAdmin; aoRecusar: (id: number) => void }) {
  const pendente = c.status === 'PENDENTE'
  const [confirmando, setConfirmando] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const data = new Date(c.criadoEm + 'Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  async function recusar() {
    try { await recusarPerfume(c.id); aoRecusar(c.id) } catch { setFalhou(true) }
  }

  return (
    <li className="painel-bloco admin-item">
      <div className="admin-cabeca">
        <span className="admin-status" aria-hidden="true">{pendente ? '⏳' : '✅'}</span>
        <span className="admin-nome">
          <strong>{c.nome}</strong>
          <span className="apagado">
            {c.marca} · {data} · {pendente ? 'ainda não cadastrado' : c.avisado ? 'cadastrado · cliente avisado' : 'cadastrado · e-mail saindo'}
          </span>
        </span>
        {pendente && !confirmando && (
          <button type="button" className="colecao-tirar" onClick={() => setConfirmando(true)}>Recusar</button>
        )}
      </div>
      {confirmando && (
        <span className="colecao-confirma">
          <span>Recusar? Some da coleção do cliente.</span>
          <button type="button" className="botao botao-contorno botao-mini" onClick={() => setConfirmando(false)}>Não</button>
          <button type="button" className="botao botao-perigo botao-mini" onClick={recusar}>Sim, recusar</button>
        </span>
      )}
      {falhou && <p className="conta-erro" role="alert">Não deu para recusar. Tente de novo.</p>}
    </li>
  )
}

/** Catálogo só pra consulta: como o perfume está classificado. */
function ItemCatalogo({ perfume: p }: { perfume: PerfumeAdmin }) {
  const resumo = [
    p.familia && NOME_FAMILIA[p.familia], p.intensidade && NOME_INTENSIDADE[p.intensidade],
    p.genero && NOME_GENERO[p.genero], p.faixa ? NOME_FAIXA[p.faixa].preco : 'fora da Loja',
  ].filter(Boolean).join(' · ')

  return (
    <li className="painel-bloco admin-item">
      <div className="admin-cabeca">
        {p.familia && <Frasco familia={p.familia} intensidade={p.intensidade ?? 'MEDIA'} tamanho={34} />}
        <span className="admin-nome">
          <strong>{p.nome}</strong>
          <span className="apagado">{p.marca} · {resumo}</span>
        </span>
      </div>
    </li>
  )
}
