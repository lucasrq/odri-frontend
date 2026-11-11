import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErroApi } from '../lib/api'
import { apagarConta, Cliente, garantirCadastro, jaComecou, marcarComecou, mudarNome } from '../lib/cadastro'
import { ItemColecao, listarColecao, mensagemColecao, tirarDaColecao } from '../lib/colecao'
import {
  buscarSugestao, corDaTemperatura, ItemAnalise, NOME_FAMILIA, NOME_INTENSIDADE,
  NOME_PERIODO, NOME_SELO, pegarLocalizacao, SAUDACAO, Sugestao,
} from '../lib/painel'
import { useTema } from '../lib/useTema'
import BuscaPerfume from '../components/BuscaPerfume'
import { Logo, Lua, Seta, Sol } from '../components/Icones'

type Tela = 'hoje' | 'colecao' | 'loja' | 'conta'
type Estado = 'carregando' | 'pronto' | 'semLocal' | 'erro'

const LIMITE_GRATIS = 8

/**
 * Painel do app (/app, /app/colecao, /app/loja, /app/conta).
 * Topo: logo, menu (computador), tema e foto da conta.
 * Embaixo (celular): Hoje · Coleção · Loja.
 */
export default function Painel({ tela }: { tela: Tela }) {
  const navegar = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [sugestao, setSugestao] = useState<Sugestao | null>(null)
  const [estado, setEstado] = useState<Estado>('carregando')

  // Busca o perfume do dia: cidade fixa (no back) ou localização do celular
  const carregar = useCallback(async (c: Cliente) => {
    try {
      let coords
      if (!c.cidade) {
        try {
          coords = await pegarLocalizacao()
        } catch {
          return setEstado('semLocal')
        }
      }
      setSugestao(await buscarSugestao(coords))
      setEstado('pronto')
    } catch (e) {
      setEstado(e instanceof ErroApi && e.status === 400 ? 'semLocal' : 'erro')
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return navegar('/entrar', { replace: true })
      try {
        const c = await garantirCadastro()
        setCliente(c)
        // Primeira vez neste aparelho e coleção vazia: passo a passo
        if (!jaComecou(c.id)) {
          const colecao = await listarColecao()
          if (colecao.length === 0) return navegar('/app/comecar', { replace: true })
          marcarComecou(c.id)
        }
        await carregar(c)
      } catch {
        setEstado('erro')
      }
    })
  }, [navegar, carregar])

  const periodo = sugestao?.periodo ?? periodoAgora()

  return (
    <div className="painel">
      <Topo cliente={cliente} />

      <main className="painel-conteudo">
        <div className="painel-cabeca">
          <h1>
            {SAUDACAO[periodo]}
            {cliente && <>, <span className="serif destaque">{primeiroNome(cliente.nome)}.</span></>}
          </h1>
          <ChipClima sugestao={sugestao} estado={estado} />
        </div>

        {tela === 'hoje' && (
          <Hoje
            estado={estado}
            sugestao={sugestao}
            cliente={cliente}
            recarregar={() => cliente && carregar(cliente)}
          />
        )}
        {tela === 'loja' && <LojaEmBreve sugestao={sugestao} />}
        {tela === 'colecao' && (
          <Colecao
            cliente={cliente}
            sugestao={sugestao}
            aoMudar={() => cliente && carregar(cliente)}
          />
        )}

        {tela === 'conta' && <Conta cliente={cliente} aoMudarCliente={setCliente} />}

        {sugestao && <p className="painel-credito">{sugestao.creditoClima}</p>}
      </main>

      <nav className="painel-menu-baixo" aria-label="Menu do app">
        <ItensMenu />
      </nav>
    </div>
  )
}

/* ---------- Topo ---------- */

function Topo({ cliente }: { cliente: Cliente | null }) {
  const { tema, alternar } = useTema()
  const escuro = tema === 'escuro'
  const navegar = useNavigate()
  const [menu, setMenu] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!menu) return
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [menu])

  async function sair() {
    await supabase.auth.signOut()
    navegar('/', { replace: true })
  }

  return (
    <header className="painel-topo">
      <div className="painel-topo-dentro">
        <Link to="/app" className="painel-logo" aria-label="odri, início do app"><Logo largura={68} /></Link>

        <nav className="painel-menu-cima" aria-label="Menu do app">
          <ItensMenu />
        </nav>

        <div className="painel-acoes" ref={caixa} onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}>
          <button
            type="button" className="botao-tema" onClick={alternar}
            aria-label={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'} aria-pressed={escuro}
          >
            <span key={tema} className="botao-tema-icone">{escuro ? <Sol /> : <Lua />}</span>
          </button>
          <button
            type="button" className="painel-foto" onClick={() => setMenu(!menu)}
            aria-label="Sua conta" aria-haspopup="menu" aria-expanded={menu}
          >
            {cliente ? primeiroNome(cliente.nome).charAt(0).toUpperCase() : ''}
          </button>

          {menu && (
            <div className="painel-conta" role="menu" aria-label="Sua conta">
              <div className="painel-conta-quem">
                <strong>{cliente?.nome}</strong>
                <span>{cliente?.plus ? 'Plano Plus' : 'Plano grátis'}</span>
              </div>
              <Link role="menuitem" to="/app/conta">Minha conta</Link>
              <Link role="menuitem" to="/app/comecar">Cidade: {cliente?.cidade ?? 'automática'}</Link>
              <a role="menuitem" href="/#planos" className="destaque-texto">Conhecer o Plus</a>
              <button type="button" role="menuitem" onClick={sair}>Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function ItensMenu() {
  return (
    <>
      <NavLink to="/app" end className="painel-item-menu">
        <IconeHoje />Hoje
      </NavLink>
      <NavLink to="/app/colecao" className="painel-item-menu">
        <IconeFrasco />Coleção
      </NavLink>
      <NavLink to="/app/loja" className="painel-item-menu">
        <IconeSacola />Loja
      </NavLink>
    </>
  )
}

/* ---------- Bolinha da temperatura ---------- */

function ChipClima({ sugestao, estado }: { sugestao: Sugestao | null; estado: Estado }) {
  const t = sugestao?.temperatura ?? null
  const cor = corDaTemperatura(t)
  return (
    <p className="chip-clima" aria-live="polite">
      <span className="chip-bolinha" style={{ ['--cor' as string]: cor }} aria-hidden="true" />
      {t !== null ? (
        <>
          <strong>{Math.round(t)} °C</strong>
          <span className="apagado">agora · {sugestao?.local}</span>
        </>
      ) : (
        <span className="apagado">
          {estado === 'carregando' ? 'Vendo o clima…' : 'Clima indisponível'}
        </span>
      )}
    </p>
  )
}

/* ---------- Tela Hoje (abas Hoje e Análise) ---------- */

function Hoje({ estado, sugestao, cliente, recarregar }: {
  estado: Estado
  sugestao: Sugestao | null
  cliente: Cliente | null
  recarregar: () => void
}) {
  const [aba, setAba] = useState<'hoje' | 'analise'>('hoje')

  if (estado === 'carregando') {
    return <div className="cartao-tinta cartao-carregando" aria-busy="true"><p>Escolhendo seu perfume…</p></div>
  }
  if (estado === 'semLocal') {
    return (
      <Aviso titulo="Onde você está?" texto="Para ver o clima, escolha uma cidade ou permita a localização no navegador.">
        <Link to="/app/comecar" className="botao botao-destaque botao-campo">Escolher cidade</Link>
      </Aviso>
    )
  }
  if (estado === 'erro' || !sugestao) {
    return (
      <Aviso titulo="Não deu para carregar" texto="Confira sua internet e tente de novo.">
        <button type="button" className="botao botao-escuro botao-campo" onClick={recarregar}>Tentar de novo</button>
      </Aviso>
    )
  }

  const idsColecao = sugestao.analise.map((p) => p.id)
  const adicionar = (
    <AdicionarPerfume cliente={cliente} total={idsColecao.length} ids={idsColecao} aoAdicionar={recarregar} />
  )

  // Coleção vazia
  if (sugestao.analise.length === 0) {
    return (
      <section className="painel-vazio">
        <h2>Cadastre seu primeiro <span className="serif destaque">perfume.</span></h2>
        <p className="texto-2">
          {sugestao.temperatura !== null && `Com ${Math.round(sugestao.temperatura)} °C agora, a odri já sabe o que o dia pede. `}
          Falta saber o que você tem no armário.
        </p>
        <BuscaPerfume naColecao={[]} aoAdicionar={recarregar} />
      </section>
    )
  }

  return (
    <>
      <div className="painel-abas" role="tablist" aria-label="Painel">
        <button type="button" role="tab" aria-selected={aba === 'hoje'} onClick={() => setAba('hoje')}>Hoje</button>
        <button type="button" role="tab" aria-selected={aba === 'analise'} onClick={() => setAba('analise')}>Análise</button>
      </div>

      <div className="painel-grade" data-aba={aba}>
        <div className="painel-col painel-col-hoje">
          <MelhorDoDia sugestao={sugestao} />
          {sugestao.nadaCombina ? <FaltaNaColecao sugestao={sugestao} /> : <OutraOpcao sugestao={sugestao} />}
          {adicionar}
        </div>

        <div className="painel-col painel-col-analise">
          <Analise sugestao={sugestao} />
        </div>
      </div>
    </>
  )
}

function MelhorDoDia({ sugestao }: { sugestao: Sugestao }) {
  const { perfume, nadaCombina } = sugestao
  if (!perfume) {
    return (
      <section className="cartao-tinta">
        <span className="cartao-rotulo">Quase lá</span>
        <p className="cartao-texto">{sugestao.motivo}</p>
      </section>
    )
  }
  const item = sugestao.analise.find((a) => a.id === perfume.id)
  return (
    <section className="cartao-tinta" aria-label={nadaCombina ? 'O melhor da sua coleção' : 'Melhor pra hoje'}>
      <div className="cartao-linha">
        <span className="cartao-rotulo">{nadaCombina ? 'O melhor da sua coleção' : 'Melhor pra hoje'}</span>
        {item?.nota != null && (
          <span className={nadaCombina ? 'cartao-nota cartao-nota-fraca' : 'cartao-nota'}>{item.nota}% combina</span>
        )}
      </div>
      <div>
        <p className="cartao-nome">{perfume.nome}</p>
        <p className="cartao-marca">{perfume.marca}</p>
      </div>
      <p className="cartao-texto">
        {nadaCombina ? `${item?.motivo ?? ''} Hoje, use pouco: 1 borrifada no pescoço.` : sugestao.motivo}
      </p>
      <div className="cartao-chips">
        {item?.familia && <span>{NOME_FAMILIA[item.familia]}</span>}
        {item?.intensidade && <span>{NOME_INTENSIDADE[item.intensidade]}</span>}
        <span>{NOME_PERIODO[sugestao.periodo]}</span>
      </div>
    </section>
  )
}

function OutraOpcao({ sugestao }: { sugestao: Sugestao }) {
  const outra = sugestao.segundaOpcao
  if (!outra) return null
  const item = sugestao.analise.find((a) => a.id === outra.id)
  if (!item || item.selo === 'EVITE') return null
  return (
    <section className="painel-bloco">
      <p className="painel-rotulo">{item.selo === 'COMBINA' ? 'Também combina' : 'Outra opção'}</p>
      <div className="linha-perfume">
        <span><strong>{outra.nome}</strong> <span className="apagado">{outra.marca}</span></span>
        {item.nota != null && <span className="numero">{item.nota}%</span>}
      </div>
    </section>
  )
}

function FaltaNaColecao({ sugestao }: { sugestao: Sugestao }) {
  const pede = sugestao.tempo === 'FRIO' ? 'pra dias frios' : 'pra dias quentes'
  return (
    <Link to="/app/loja" className="cartao-falta">
      <span>
        <span className="painel-rotulo destaque-texto">Falta na sua coleção</span>
        <strong>Um perfume {pede}</strong>
        <span className="apagado">Ver sugestões · links de parceiros</span>
      </span>
      <Seta />
    </Link>
  )
}

function AdicionarPerfume({ cliente, total, ids, aoAdicionar }: {
  cliente: Cliente | null
  total: number
  ids: number[]
  aoAdicionar: () => void
}) {
  return (
    <section className="painel-bloco painel-adicionar">
      <h2 className="painel-subtitulo">Adicionar perfume</h2>
      <BuscaPerfume naColecao={ids} aoAdicionar={aoAdicionar} placeholder="Busque: Acqua di Giò, Kaiak…" />
      {cliente && !cliente.plus && (
        <p className="painel-dica">{total} de {LIMITE_GRATIS} perfumes no plano grátis</p>
      )}
    </section>
  )
}

/* ---------- Aba Análise ---------- */

function Analise({ sugestao }: { sugestao: Sugestao }) {
  const lista = sugestao.analise
  const combinam = lista.filter((p) => p.selo === 'COMBINA').length
  const emAnalise = lista.filter((p) => p.selo === 'EM_ANALISE').length
  const t = sugestao.temperatura

  return (
    <section className="painel-analise" aria-labelledby="titulo-analise">
      <h2 id="titulo-analise" className="painel-subtitulo">Análise da coleção</h2>
      <div className="painel-resumo">
        <div><strong>{lista.length}</strong><span>na coleção</span></div>
        <div><strong className="destaque-texto">{combinam}</strong><span>combinam hoje</span></div>
        <div><strong>{emAnalise}</strong><span>em análise</span></div>
      </div>

      {t !== null && <p className="painel-rotulo">Sua coleção com {Math.round(t)} °C</p>}

      <ul className="painel-lista">
        {lista.map((p) => <LinhaAnalise key={p.id} item={p} />)}
      </ul>

      <Link to="/app/loja" className="cartao-loja-discreto">
        <span>
          <strong>Sugestões pra sua coleção</strong>
          <span className="apagado">Ver na Loja · links de parceiros</span>
        </span>
        <Seta />
      </Link>
    </section>
  )
}

function LinhaAnalise({ item }: { item: ItemAnalise }) {
  return (
    <li className="analise-item">
      <div className="analise-topo">
        <span><strong>{item.nome}</strong> <span className="apagado">{item.marca}</span></span>
        <span className={`selo-analise selo-${item.selo.toLowerCase()}`}>{NOME_SELO[item.selo]}</span>
      </div>
      {item.nota != null && (
        <div className="analise-barra" role="img" aria-label={`${item.nota}% combina`}>
          <div className={`analise-barra-cheia barra-${item.selo.toLowerCase()}`} style={{ width: `${item.nota}%` }} />
        </div>
      )}
      <p className="analise-motivo">{item.motivo}</p>
    </li>
  )
}

/* ---------- Coleção ---------- */

type Filtro = 'todos' | 'combinam' | 'analise'
const FILTROS: [Filtro, string][] = [['todos', 'Todos'], ['combinam', 'Combinam hoje'], ['analise', 'Em análise']]

/**
 * Tela Coleção (/app/colecao): lista os perfumes da pessoa, adiciona e tira.
 * A lista vem de GET /colecao; família, intensidade e selo de hoje vêm da análise
 * da sugestão (quando ela já carregou).
 */
function Colecao({ cliente, sugestao, aoMudar }: {
  cliente: Cliente | null
  sugestao: Sugestao | null
  aoMudar: () => void
}) {
  const [itens, setItens] = useState<ItemColecao[] | null>(null)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [confirmando, setConfirmando] = useState<number | null>(null)
  const [tirando, setTirando] = useState<number | null>(null)

  const carregarLista = useCallback(async () => {
    try {
      setItens(await listarColecao())
      setErro('')
    } catch (e) {
      setErro(mensagemColecao(e))
    }
  }, [])

  useEffect(() => { carregarLista() }, [carregarLista])

  async function tirar(id: number) {
    setTirando(id)
    setErro('')
    try {
      await tirarDaColecao(id)
      setItens((atual) => atual?.filter((p) => p.id !== id) ?? null)
      setConfirmando(null)
      aoMudar() // a sugestão de hoje pode mudar
    } catch (e) {
      setErro(mensagemColecao(e))
    } finally {
      setTirando(null)
    }
  }

  function depoisDeAdicionar() {
    carregarLista()
    aoMudar()
  }

  const analise = new Map((sugestao?.analise ?? []).map((a) => [a.id, a]))
  const total = itens?.length ?? 0
  const gratis = !!cliente && !cliente.plus
  const cheia = gratis && total >= LIMITE_GRATIS
  const lista = (itens ?? []).filter((p) => {
    if (filtro === 'combinam') return analise.get(p.id)?.selo === 'COMBINA'
    if (filtro === 'analise') return p.pendente
    return true
  })

  return (
    <section className="painel-pagina colecao" aria-labelledby="titulo-colecao">
      <div className="colecao-cabeca">
        <h2 id="titulo-colecao" className="painel-titulo-pagina">Sua coleção</h2>
        {gratis && itens && (
          <div className="colecao-limite">
            <div className="analise-barra" role="img" aria-label={`${total} de ${LIMITE_GRATIS} perfumes`}>
              <div className="colecao-limite-cheia" style={{ width: `${Math.min(100, (total / LIMITE_GRATIS) * 100)}%` }} />
            </div>
            <p className="painel-dica">{total} de {LIMITE_GRATIS} perfumes no plano grátis</p>
          </div>
        )}
      </div>

      {cheia ? (
        <div className="cartao-suave">
          <span className="painel-rotulo">Coleção cheia</span>
          <strong>Os {LIMITE_GRATIS} lugares do grátis estão ocupados</strong>
          <p>Tire um perfume para colocar outro. No Plus, que chega em breve, a coleção não tem limite.</p>
        </div>
      ) : (
        <div className="painel-bloco">
          <h3 className="painel-subtitulo">Adicionar perfume</h3>
          <BuscaPerfume
            naColecao={(itens ?? []).map((p) => p.id)}
            aoAdicionar={depoisDeAdicionar}
            placeholder="Busque: Acqua di Giò, Kaiak…"
          />
        </div>
      )}

      {itens && itens.length > 0 && (
        <div className="colecao-filtros" role="group" aria-label="Filtrar coleção">
          {FILTROS.map(([valor, nome]) => (
            <button
              key={valor} type="button" className="colecao-filtro"
              aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}
            >
              {nome}
            </button>
          ))}
        </div>
      )}

      {itens === null && !erro && <p className="painel-dica">Carregando sua coleção…</p>}
      {itens?.length === 0 && <p className="texto-2">Sua coleção está vazia. Busque um perfume acima para começar.</p>}
      {itens && itens.length > 0 && lista.length === 0 && <p className="painel-dica">Nenhum perfume neste filtro.</p>}

      {lista.length > 0 && (
        <ul className="painel-lista">
          {lista.map((p) => {
            const a = analise.get(p.id)
            const selo = p.pendente ? 'EM_ANALISE' : a?.selo
            const detalhes = [
              a?.familia ? NOME_FAMILIA[a.familia] : null,
              a?.intensidade ? NOME_INTENSIDADE[a.intensidade] : null,
            ].filter(Boolean).join(' · ')

            return (
              <li key={p.id} className="analise-item colecao-item">
                <div className="analise-topo">
                  <span><strong>{p.nome}</strong> <span className="apagado">{p.marca}</span></span>
                  {selo && <span className={`selo-analise selo-${selo.toLowerCase()}`}>{NOME_SELO[selo]}</span>}
                </div>
                {p.pendente
                  ? <p className="analise-motivo">A gente está classificando este perfume.</p>
                  : detalhes && <p className="analise-motivo">{detalhes}</p>}

                {confirmando === p.id ? (
                  <div className="colecao-confirma">
                    <span>Tirar da coleção?</span>
                    <button type="button" className="botao botao-contorno botao-mini" onClick={() => setConfirmando(null)}>
                      Não
                    </button>
                    <button
                      type="button" className="botao botao-escuro botao-mini"
                      disabled={tirando === p.id} onClick={() => tirar(p.id)}
                    >
                      {tirando === p.id ? 'Tirando…' : 'Sim, tirar'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button" className="colecao-tirar"
                    onClick={() => setConfirmando(p.id)} aria-label={`Tirar ${p.nome} da coleção`}
                  >
                    Tirar
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {erro && <p className="conta-erro" role="alert">{erro}</p>}
    </section>
  )
}

/* ---------- Loja (em breve) ---------- */

function LojaEmBreve({ sugestao }: { sugestao: Sugestao | null }) {
  const pede = sugestao?.tempo === 'FRIO' ? 'frio' : 'calor'
  return (
    <section className="painel-pagina">
      <h2 className="painel-titulo-pagina">Loja</h2>
      <p className="texto-2">Perfumes escolhidos a partir da sua coleção e do clima.</p>
      <div className="cartao-suave">
        <span className="painel-rotulo">Em breve</span>
        <strong>Sugestões que completam sua coleção</strong>
        <p>
          A odri vai olhar o que falta no seu armário (por exemplo, um perfume pra {pede}) e mostrar 3 opções,
          de preços diferentes, nas lojas parceiras.
        </p>
      </div>
      <p className="painel-dica">Links de parceiros: a odri pode ganhar comissão, sem mudar o seu preço.</p>
    </section>
  )
}

/* ---------- Minha conta ---------- */

type Recado = { tipo: 'ok' | 'erro'; texto: string } | null
const SENHA_MINIMA = 8

function Conta({ cliente, aoMudarCliente }: {
  cliente: Cliente | null
  aoMudarCliente: (c: Cliente) => void
}) {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')

  // Nome
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [recadoNome, setRecadoNome] = useState<Recado>(null)

  // Senha
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [recadoSenha, setRecadoSenha] = useState<Recado>(null)

  // Apagar conta
  const [confirmando, setConfirmando] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [erroApagar, setErroApagar] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  // O cliente chega depois da tela abrir: preenche o campo quando chegar
  useEffect(() => {
    if (cliente) setNome(cliente.nome)
  }, [cliente])

  async function salvarNome(e: FormEvent) {
    e.preventDefault()
    setRecadoNome(null)
    if (nome.trim().length < 2) return setRecadoNome({ tipo: 'erro', texto: 'Escreva seu nome.' })
    setSalvandoNome(true)
    try {
      aoMudarCliente(await mudarNome(nome.trim()))
      setRecadoNome({ tipo: 'ok', texto: 'Nome salvo.' })
    } catch {
      setRecadoNome({ tipo: 'erro', texto: 'Não deu para salvar agora. Tente de novo.' })
    } finally {
      setSalvandoNome(false)
    }
  }

  async function salvarSenha(e: FormEvent) {
    e.preventDefault()
    setRecadoSenha(null)
    if (senha.length < SENHA_MINIMA) {
      return setRecadoSenha({ tipo: 'erro', texto: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` })
    }
    setSalvandoSenha(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvandoSenha(false)
    if (error) return setRecadoSenha({ tipo: 'erro', texto: erroSenha(error.message) })
    setSenha('')
    setRecadoSenha({ tipo: 'ok', texto: 'Senha trocada. Use a nova na próxima vez que entrar.' })
  }

  async function apagar() {
    if (!cliente) return
    setApagando(true)
    setErroApagar('')
    try {
      await apagarConta(cliente.id)
      navegar('/', { replace: true })
    } catch {
      setErroApagar('Não deu para apagar agora. Tente de novo em instantes.')
      setApagando(false)
    }
  }

  return (
    <section className="painel-pagina conta-pagina" aria-labelledby="titulo-conta">
      <h2 id="titulo-conta" className="painel-titulo-pagina">Minha conta</h2>

      <div className="painel-bloco">
        <div className="conta-linha">
          <span>
            <span className="painel-rotulo">Plano</span>
            <strong>{cliente?.plus ? 'Plus' : 'Grátis'}</strong>
          </span>
          {!cliente?.plus && <a href="/#planos">Conhecer o Plus</a>}
        </div>
        <div className="conta-linha">
          <span>
            <span className="painel-rotulo">Cidade</span>
            <strong>{cliente?.cidade ?? 'Automática (localização)'}</strong>
          </span>
          <Link to="/app/comecar">Trocar</Link>
        </div>
        <div className="conta-linha">
          <span>
            <span className="painel-rotulo">E-mail</span>
            <strong>{email || '…'}</strong>
          </span>
        </div>
      </div>

      <form className="painel-bloco" onSubmit={salvarNome} noValidate>
        <h3 className="painel-subtitulo">Seu nome</h3>
        <label className="campo">
          <span className="so-leitor">Nome</span>
          <input
            type="text" autoComplete="given-name" maxLength={100}
            value={nome} onChange={(e) => setNome(e.target.value)}
          />
        </label>
        {recadoNome && <p className={recadoNome.tipo === 'ok' ? 'conta-aviso' : 'conta-erro'} role="status">{recadoNome.texto}</p>}
        <button
          type="submit" className="botao botao-escuro botao-campo conta-botao"
          disabled={salvandoNome || !cliente || nome.trim() === cliente.nome}
        >
          {salvandoNome ? 'Salvando…' : 'Salvar nome'}
        </button>
      </form>

      <form className="painel-bloco" onSubmit={salvarSenha} noValidate>
        <h3 className="painel-subtitulo">Trocar senha</h3>
        <label className="campo">
          <span className="so-leitor">Senha nova</span>
          <div className="campo-senha">
            <input
              type={mostrarSenha ? 'text' : 'password'} autoComplete="new-password"
              minLength={SENHA_MINIMA} placeholder={`Senha nova (pelo menos ${SENHA_MINIMA} caracteres)`}
              value={senha} onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button" className="campo-mostrar"
              onClick={() => setMostrarSenha(!mostrarSenha)} aria-pressed={mostrarSenha}
            >
              {mostrarSenha ? 'Esconder' : 'Mostrar'}
            </button>
          </div>
        </label>
        {recadoSenha && <p className={recadoSenha.tipo === 'ok' ? 'conta-aviso' : 'conta-erro'} role="status">{recadoSenha.texto}</p>}
        <button
          type="submit" className="botao botao-escuro botao-campo conta-botao"
          disabled={salvandoSenha || senha === ''}
        >
          {salvandoSenha ? 'Trocando…' : 'Trocar senha'}
        </button>
      </form>

      <div className="painel-bloco conta-perigo">
        <h3 className="painel-subtitulo">Apagar conta</h3>
        <p className="texto-2">
          Apaga seu login, sua coleção e todos os seus dados da odri. Não tem como desfazer.
        </p>
        {confirmando ? (
          <div className="colecao-confirma">
            <span>Tem certeza?</span>
            <button type="button" className="botao botao-contorno botao-mini" onClick={() => setConfirmando(false)}>
              Não
            </button>
            <button type="button" className="botao botao-perigo botao-mini" disabled={apagando} onClick={apagar}>
              {apagando ? 'Apagando…' : 'Sim, apagar tudo'}
            </button>
          </div>
        ) : (
          <button type="button" className="colecao-tirar" onClick={() => setConfirmando(true)}>
            Apagar minha conta
          </button>
        )}
        {erroApagar && <p className="conta-erro" role="alert">{erroApagar}</p>}
      </div>
    </section>
  )
}

/** Mensagens do Supabase vêm em inglês: aqui viram português. */
function erroSenha(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes('different from the old')) return 'A senha nova precisa ser diferente da atual.'
  if (m.includes('reauthentication') || m.includes('nonce')) {
    return 'Por segurança, saia e entre de novo antes de trocar a senha.'
  }
  if (m.includes('rate limit') || m.includes('security purposes')) {
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  }
  if (m.includes('password')) return 'Essa senha é fraca. Use letras e números.'
  return 'Não deu para trocar a senha agora. Tente de novo em instantes.'
}

function Aviso({ titulo, texto, children }: { titulo: string; texto: string; children: ReactNode }) {
  return (
    <section className="painel-aviso">
      <h2 className="painel-subtitulo">{titulo}</h2>
      <p className="texto-2">{texto}</p>
      {children}
    </section>
  )
}

/* ---------- Ajudantes ---------- */

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0]
}

function periodoAgora(): Sugestao['periodo'] {
  const hora = new Date().getHours()
  if (hora >= 5 && hora < 12) return 'MANHA'
  if (hora >= 12 && hora < 18) return 'TARDE'
  return 'NOITE'
}

function IconeHoje() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function IconeFrasco() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3h6v3H9z" />
      <path d="M7 6h10l1 4v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9z" />
    </svg>
  )
}

function IconeSacola() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8h14l-1.2 12H6.2z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}
