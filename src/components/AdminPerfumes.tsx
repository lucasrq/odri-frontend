import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  Classificacao, ehAdmin, listarCatalogoAdmin, listarPendentes, NOME_CLIMA, PerfumeAdmin, recusarPerfume, salvarPerfume,
} from '../lib/admin'
import { ErroApi } from '../lib/api'
import { NOME_FAIXA, NOME_GENERO } from '../lib/loja'
import type { FaixaPreco, Genero, LojaParceira } from '../lib/loja'
import { NOME_FAMILIA, NOME_INTENSIDADE } from '../lib/painel'
import Frasco from './Frasco'

type Aba = 'pendentes' | 'catalogo'

/**
 * Tela do admin (/app/admin): aprova sugestões pendentes e corrige o catálogo
 * (família, intensidade, clima, gênero, faixa de preço, loja e link).
 */
export default function AdminPerfumes() {
  const [permitido, setPermitido] = useState<boolean | null>(null)
  const [aba, setAba] = useState<Aba>('pendentes')
  const [pendentes, setPendentes] = useState<PerfumeAdmin[] | null>(null)
  const [catalogo, setCatalogo] = useState<PerfumeAdmin[] | null>(null)
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState(false)

  useEffect(() => {
    ehAdmin().then(setPermitido).catch(() => setErro(true))
  }, [])

  const carregarPendentes = useCallback(async () => {
    try { setPendentes(await listarPendentes()) } catch { setErro(true) }
  }, [])

  useEffect(() => { if (permitido) carregarPendentes() }, [permitido, carregarPendentes])

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

  const lista = aba === 'pendentes' ? pendentes : catalogo
  const trocar = (p: PerfumeAdmin) => {
    if (aba === 'pendentes') setPendentes((l) => l?.filter((x) => x.id !== p.id) ?? null)
    else setCatalogo((l) => l?.map((x) => (x.id === p.id ? p : x)) ?? null)
  }
  const tirar = (id: number) => setPendentes((l) => l?.filter((x) => x.id !== id) ?? null)

  return (
    <section className="painel-pagina admin" aria-labelledby="titulo-admin">
      <h2 id="titulo-admin" className="painel-titulo-pagina">Admin</h2>

      <div className="colecao-filtros" role="tablist" aria-label="Admin">
        <button type="button" role="tab" className="colecao-filtro" aria-pressed={aba === 'pendentes'} aria-selected={aba === 'pendentes'} onClick={() => setAba('pendentes')}>
          Pendentes{pendentes ? ` (${pendentes.length})` : ''}
        </button>
        <button type="button" role="tab" className="colecao-filtro" aria-pressed={aba === 'catalogo'} aria-selected={aba === 'catalogo'} onClick={() => setAba('catalogo')}>
          Catálogo
        </button>
      </div>

      {aba === 'catalogo' && (
        <label className="campo">
          <span className="sr-only">Buscar no catálogo</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou marca" autoComplete="off" />
        </label>
      )}

      {erro && <p className="conta-erro" role="alert">Não deu para carregar. Recarregue a página.</p>}
      {!erro && (permitido === null || lista === null) && <p className="painel-dica">Carregando…</p>}
      {lista?.length === 0 && (
        <p className="painel-dica">{aba === 'pendentes' ? 'Nenhuma sugestão esperando. Tudo em dia.' : 'Nada encontrado.'}</p>
      )}

      {lista && lista.length > 0 && (
        <ul className="admin-lista">
          {lista.map((p) => <ItemAdmin key={p.id} perfume={p} aoSalvar={trocar} aoRecusar={tirar} />)}
        </ul>
      )}
    </section>
  )
}

const FAMILIAS = Object.keys(NOME_FAMILIA)
const INTENSIDADES = Object.keys(NOME_INTENSIDADE)
const CLIMAS = Object.keys(NOME_CLIMA)
const GENEROS = Object.keys(NOME_GENERO) as Genero[]
const FAIXAS = Object.keys(NOME_FAIXA) as FaixaPreco[]
const LOJAS: [LojaParceira, string][] = [['MERCADO_LIVRE', 'Mercado Livre'], ['AMAZON', 'Amazon']]

function ItemAdmin({ perfume: p, aoSalvar, aoRecusar }: {
  perfume: PerfumeAdmin
  aoSalvar: (p: PerfumeAdmin) => void
  aoRecusar: (id: number) => void
}) {
  const pendente = p.status === 'PENDENTE'
  const [aberto, setAberto] = useState(pendente)
  const [f, setF] = useState({
    familia: p.familia ?? '', intensidade: p.intensidade ?? '', clima: p.clima ?? '',
    genero: p.genero ?? '', faixa: p.faixa ?? '', loja: p.loja ?? '', link: p.link ?? '',
  })
  const [salvando, setSalvando] = useState(false)
  const [recado, setRecado] = useState<{ ok: boolean; texto: string } | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const muda = (campo: keyof typeof f, valor: string) => { setF((x) => ({ ...x, [campo]: valor })); setRecado(null) }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!f.familia || !f.intensidade || !f.clima) return setRecado({ ok: false, texto: 'Escolha família, intensidade e clima.' })
    const link = f.link.trim()
    if (link && !link.startsWith('https://')) return setRecado({ ok: false, texto: 'O link precisa começar com https://' })
    if (link && (!f.faixa || !f.loja)) return setRecado({ ok: false, texto: 'Com link, escolha também a faixa de preço e a loja.' })
    const dados: Classificacao = { familia: f.familia, intensidade: f.intensidade, clima: f.clima }
    if (f.genero) dados.genero = f.genero as Genero
    if (f.faixa) dados.faixa = f.faixa as FaixaPreco
    if (f.loja) dados.loja = f.loja as LojaParceira
    if (link || p.link) dados.link = link // vazio = tira da Loja
    setSalvando(true)
    try {
      const novo = await salvarPerfume(p.id, dados)
      setRecado({ ok: true, texto: pendente ? 'Aprovado.' : 'Salvo.' })
      if (pendente) setTimeout(() => aoSalvar(novo), 600)
      else { aoSalvar(novo); setAberto(false) }
    } catch (e2) {
      setRecado({ ok: false, texto: e2 instanceof ErroApi && e2.status === 400 ? 'Algum campo está inválido.' : 'Não deu para salvar. Tente de novo.' })
    } finally {
      setSalvando(false)
    }
  }

  async function recusar() {
    try { await recusarPerfume(p.id); aoRecusar(p.id) } catch { setRecado({ ok: false, texto: 'Não deu para recusar.' }) }
  }

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
          <span className="apagado">{p.marca}{!pendente && ` · ${resumo}`}</span>
        </span>
        {!pendente && (
          <button type="button" className="adesivo-fechar" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
            {aberto ? 'Fechar' : 'Editar'}
          </button>
        )}
      </div>

      {aberto && (
        <form className="admin-form" onSubmit={salvar} noValidate>
          <Grupo rotulo="Família" valores={FAMILIAS} nomes={NOME_FAMILIA} atual={f.familia} aoEscolher={(v) => muda('familia', v)} />
          <Grupo rotulo="Intensidade" valores={INTENSIDADES} nomes={NOME_INTENSIDADE} atual={f.intensidade} aoEscolher={(v) => muda('intensidade', v)} />
          <Grupo rotulo="Clima" valores={CLIMAS} nomes={NOME_CLIMA} atual={f.clima} aoEscolher={(v) => muda('clima', v)} />
          <Grupo rotulo="Gênero" valores={GENEROS} nomes={NOME_GENERO} atual={f.genero} aoEscolher={(v) => muda('genero', v)} />
          <Grupo rotulo="Faixa de preço" valores={FAIXAS} nomes={Object.fromEntries(FAIXAS.map((x) => [x, NOME_FAIXA[x].preco]))} atual={f.faixa} aoEscolher={(v) => muda('faixa', v)} />
          <Grupo rotulo="Loja" valores={LOJAS.map(([v]) => v)} nomes={Object.fromEntries(LOJAS)} atual={f.loja} aoEscolher={(v) => muda('loja', v)} />
          <label className="campo">
            <span>Link (vazio = fora da Loja)</span>
            <input type="url" inputMode="url" value={f.link} onChange={(e) => muda('link', e.target.value)} placeholder="https://" />
          </label>

          {recado && <p className={recado.ok ? 'conta-aviso' : 'conta-erro'} role="status">{recado.texto}</p>}

          <div className="admin-acoes">
            <button type="submit" className="botao botao-escuro botao-mini" disabled={salvando}>
              {salvando ? 'Salvando…' : pendente ? 'Aprovar' : 'Salvar'}
            </button>
            {pendente && (confirmando ? (
              <span className="colecao-confirma">
                <span>Recusar mesmo?</span>
                <button type="button" className="botao botao-contorno botao-mini" onClick={() => setConfirmando(false)}>Não</button>
                <button type="button" className="botao botao-perigo botao-mini" onClick={recusar}>Sim, recusar</button>
              </span>
            ) : (
              <button type="button" className="colecao-tirar" onClick={() => setConfirmando(true)}>Recusar</button>
            ))}
          </div>
        </form>
      )}
    </li>
  )
}

function Grupo({ rotulo, valores, nomes, atual, aoEscolher }: {
  rotulo: string
  valores: string[]
  nomes: Record<string, string>
  atual: string
  aoEscolher: (v: string) => void
}) {
  return (
    <fieldset className="admin-grupo">
      <legend>{rotulo}</legend>
      <div className="colecao-filtros">
        {valores.map((v) => (
          <button key={v} type="button" className="colecao-filtro" aria-pressed={atual === v} onClick={() => aoEscolher(v)}>
            {nomes[v] ?? v}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
