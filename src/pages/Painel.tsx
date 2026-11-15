import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErroApi } from '../lib/api'
import {
  apagarConta, Cliente, garantirCadastro, jaComecou, marcarComecou, mudarNome, mudarPreferencia, Preferencia, PREFERENCIAS,
} from '../lib/cadastro'
import { ItemColecao, listarColecao, mensagemColecao, tirarDaColecao } from '../lib/colecao'
import {
  buscarSugestao, corDaTemperatura, ItemAnalise, NOME_FAMILIA, NOME_INTENSIDADE,
  NOME_PERIODO, NOME_SELO, pegarLocalizacao, SAUDACAO, Sugestao,
} from '../lib/painel'
import {
  buscarCatalogo, buscarLoja, Genero, marcarDicaMostrada, NOME_FAIXA, NOME_LOJA, Oferta, OrdemPreco, podeMostrarDica,
} from '../lib/loja'
import { useTema } from '../lib/useTema'
import BuscaPerfume from '../components/BuscaPerfume'
import Frasco from '../components/Frasco'
import AdesivoStory from '../components/AdesivoStory'
import AdesivoDia from '../components/AdesivoDia'
import AdminPerfumes from '../components/AdminPerfumes'
import ReguaDia, { POS_PERIODO } from '../components/ReguaDia'
import { gerarAdesivoColecao } from '../lib/adesivo'
import { ehAdmin } from '../lib/admin'
import { registrarEvento } from '../lib/eventos'
import { Fechar, Logo, Lua, Mais, Seta, Sol } from '../components/Icones'

type Tela = 'hoje' | 'colecao' | 'loja' | 'conta' | 'admin'
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
          {tela === 'hoje'
            ? <DiaAgora sugestao={sugestao} estado={estado} periodo={periodo} />
            : <ChipClima sugestao={sugestao} estado={estado} />}
        </div>

        {tela === 'hoje' && (
          <Hoje
            estado={estado}
            sugestao={sugestao}
            cliente={cliente}
            recarregar={() => cliente && carregar(cliente)}
          />
        )}
        {tela === 'loja' && <Loja preferencia={cliente?.preferencia ?? null} sugestao={sugestao} />}
        {tela === 'colecao' && (
          <Colecao
            cliente={cliente}
            sugestao={sugestao}
            aoMudar={() => cliente && carregar(cliente)}
          />
        )}

        {tela === 'conta' && <Conta cliente={cliente} aoMudarCliente={setCliente} />}
        {tela === 'admin' && <AdminPerfumes />}

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
  const [admin, setAdmin] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  // Link "Admin" no menu só pra quem é admin (o back responde 403 pro resto)
  const temCliente = !!cliente
  useEffect(() => { if (temCliente) ehAdmin().then(setAdmin).catch(() => {}) }, [temCliente])

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
              {admin && <Link role="menuitem" to="/app/admin">Admin</Link>}
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

/* ---------- Régua do dia com o clima (só na tela Hoje) ---------- */

const PERIODOS_REGUA = ['MANHA', 'TARDE', 'NOITE'] as const

function DiaAgora({ sugestao, estado, periodo }: {
  sugestao: Sugestao | null
  estado: Estado
  periodo: Sugestao['periodo']
}) {
  const t = sugestao?.temperatura ?? null
  return (
    <section className="dia-agora" aria-label="Clima e hora do dia">
      <p className="dia-agora-clima" aria-live="polite">
        <span className="chip-bolinha" style={{ ['--cor' as string]: corDaTemperatura(t) }} aria-hidden="true" />
        {t !== null ? (
          <>
            <strong>{Math.round(t)} °C</strong>
            <span className="apagado">{sugestao?.local ? `${sugestao.local} · agora` : 'agora'}</span>
          </>
        ) : (
          <span className="apagado">{estado === 'carregando' ? 'Vendo o clima…' : 'Clima indisponível'}</span>
        )}
      </p>
      <ReguaDia
        marcas={PERIODOS_REGUA.map((p, i) => ({
          pos: POS_PERIODO[i], rotulo: NOME_PERIODO[p], ponto: p === periodo, ativo: p === periodo,
        }))}
      />
    </section>
  )
}

/* ---------- Tela Hoje ---------- */

function Hoje({ estado, sugestao, cliente, recarregar }: {
  estado: Estado
  sugestao: Sugestao | null
  cliente: Cliente | null
  recarregar: () => void
}) {
  // No celular a análise fica fechada e abre pela linha "Análise da coleção"
  const [verAnalise, setVerAnalise] = useState(false)
  const [adicionando, setAdicionando] = useState(false)
  const analiseRef = useRef<HTMLDivElement>(null)
  const abrirAnalise = () => {
    const abrir = !verAnalise
    setVerAnalise(abrir)
    if (abrir) requestAnimationFrame(() => analiseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  // Dica da Loja num dia normal: decide uma vez ao abrir (no máximo 1 a cada 3 dias)
  const [dicaHoje, setDicaHoje] = useState(false)
  const idCliente = cliente?.id
  useEffect(() => { if (idCliente) setDicaHoje(podeMostrarDica(idCliente)) }, [idCliente])
  const marcarDica = useCallback(() => { if (cliente) marcarDicaMostrada(cliente.id) }, [cliente])

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

  const combinam = sugestao.analise.filter((p) => p.selo === 'COMBINA').length
  const emAnalise = sugestao.analise.filter((p) => p.selo === 'EM_ANALISE').length
  const outra = !sugestao.nadaCombina ? <OutraOpcao sugestao={sugestao} /> : null

  return (
    <div className="painel-grade" data-analise={verAnalise ? 'aberta' : 'fechada'}>
      <div className="painel-col painel-col-hoje">
        <MelhorDoDia sugestao={sugestao} />
        {sugestao.nadaCombina && <DicaLoja tempo={sugestao.tempo} titulo="Falta na sua coleção" />}

        {(outra || sugestao.perfume) && (
          <section aria-labelledby="titulo-pra-hoje">
            <h2 id="titulo-pra-hoje" className="grupo-titulo">Pra hoje também</h2>
            <div className="grupo">
              {outra}
              {sugestao.perfume && <AdesivoDoDia sugestao={sugestao} />}
            </div>
          </section>
        )}

        {!sugestao.nadaCombina && dicaHoje && (
          <DicaLoja tempo={sugestao.tempo} titulo="Uma dica pra sua coleção" aoMostrar={marcarDica} />
        )}

        <section aria-labelledby="titulo-sua-colecao">
          <h2 id="titulo-sua-colecao" className="grupo-titulo">Sua coleção</h2>
          <div className="grupo">
            <button
              type="button" className="grupo-linha grupo-botao" aria-expanded={adicionando}
              onClick={() => setAdicionando(!adicionando)}
            >
              <span className="grupo-icone" aria-hidden="true"><Mais /></span>
              <span className="grupo-texto">
                <strong>Adicionar perfume</strong>
                <small>
                  {cliente && !cliente.plus
                    ? `${idsColecao.length} de ${LIMITE_GRATIS} no plano grátis`
                    : `${idsColecao.length} na coleção`}
                </small>
              </span>
              <span className={`grupo-seta ${adicionando ? 'aberta' : ''}`} aria-hidden="true">›</span>
            </button>
            {adicionando && (
              <div className="grupo-painel">
                <BuscaPerfume
                  naColecao={idsColecao} placeholder="Busque: Acqua di Giò, Kaiak…"
                  aoAdicionar={recarregar}
                />
              </div>
            )}
            <button
              type="button" className="grupo-linha grupo-botao linha-analise" aria-expanded={verAnalise}
              onClick={abrirAnalise}
            >
              <span className="grupo-icone" aria-hidden="true"><IconeBarras /></span>
              <span className="grupo-texto">
                <strong>Análise da coleção</strong>
                <small>
                  {combinam} {combinam === 1 ? 'combina' : 'combinam'} hoje
                  {emAnalise > 0 && ` · ${emAnalise} em análise`}
                </small>
              </span>
              <span className={`grupo-seta ${verAnalise ? 'aberta' : ''}`} aria-hidden="true">›</span>
            </button>
          </div>
        </section>
      </div>

      <div className="painel-col painel-col-analise" ref={analiseRef}>
        <Analise sugestao={sugestao} />
      </div>
    </div>
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
      <div className="cartao-perfume">
        <div>
          <p className="cartao-nome">{perfume.nome}</p>
          <p className="cartao-marca">
            {[perfume.marca, item?.familia && NOME_FAMILIA[item.familia], item?.intensidade && NOME_INTENSIDADE[item.intensidade]]
              .filter(Boolean).join(' · ')}
          </p>
        </div>
        {item?.familia && (
          <Frasco familia={item.familia} intensidade={item.intensidade} tamanho={56} />
        )}
      </div>
      <div className="cartao-motivo">
        {item?.nota != null && (
          <div className="cartao-medidor" aria-hidden="true">
            <i className={nadaCombina ? 'fraco' : ''} style={{ width: `${item.nota}%` }} />
          </div>
        )}
        <p className="cartao-texto">
          {nadaCombina ? `${item?.motivo ?? ''} Hoje, use pouco: 1 borrifada no pescoço.` : sugestao.motivo}
        </p>
      </div>
    </section>
  )
}

function AdesivoDoDia({ sugestao }: { sugestao: Sugestao }) {
  const perfume = sugestao.perfume!
  const item = sugestao.analise.find((a) => a.id === perfume.id)
  return (
    <AdesivoDia
      dados={{
        perfume: perfume.nome,
        marca: perfume.marca,
        familia: item?.familia,
        intensidade: item?.intensidade,
        temperatura: sugestao.temperatura,
        local: sugestao.local,
        periodo: sugestao.periodo,
        tempo: sugestao.tempo,
        motivo: sugestao.nadaCombina ? item?.motivo : sugestao.motivo,
      }}
    />
  )
}

function AdesivoColecao({ perfumes }: { perfumes: { nome: string; familia: string | null }[] }) {
  return (
    <AdesivoStory
      titulo="Mostre sua coleção"
      texto="Um adesivo com os seus perfumes, pra postar no story."
      nomeArquivo="minha-colecao"
      descricao={`Minha coleção: ${perfumes.map((p) => p.nome).join(', ')}`}
      chave={perfumes.map((p) => p.nome + p.familia).join('|')}
      gerar={(cor) => gerarAdesivoColecao(perfumes, cor)}
      evento="ADESIVO_COLECAO"
    />
  )
}

function OutraOpcao({ sugestao }: { sugestao: Sugestao }) {
  const outra = sugestao.segundaOpcao
  if (!outra) return null
  const item = sugestao.analise.find((a) => a.id === outra.id)
  if (!item || item.selo === 'EVITE') return null
  return (
    <div className="grupo-linha">
      <span className="grupo-icone grupo-icone-frasco" aria-hidden="true">
        <Frasco familia={item.familia} intensidade={item.intensidade} pendente={item.pendente} tamanho={20} />
      </span>
      <span className="grupo-texto">
        <strong>{outra.nome}</strong>
        <small>{outra.marca} · {item.selo === 'COMBINA' ? 'também combina' : 'outra opção'}</small>
      </span>
      {item.nota != null && <span className="grupo-numero">{item.nota}%</span>}
    </div>
  )
}

function IconeBarras() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 20V11M12 20V5M19 20v-7" />
    </svg>
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
          <strong>Conhecer a Loja</strong>
          <span className="apagado">Masculinos e femininos · links de parceiros</span>
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

  function focarBusca() {
    const campo = document.querySelector<HTMLInputElement>('.colecao-busca input')
    campo?.focus()
    campo?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
          <p className="painel-dica">{total} de {LIMITE_GRATIS} lugares ocupados no plano grátis</p>
        )}
      </div>

      {cheia ? (
        <div className="cartao-suave">
          <span className="painel-rotulo">Coleção cheia</span>
          <strong>Os {LIMITE_GRATIS} lugares do grátis estão ocupados</strong>
          <p>Tire um perfume para colocar outro. No Plus, que chega em breve, a coleção não tem limite.</p>
        </div>
      ) : (
        <div className="painel-bloco colecao-busca">
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
        <ul className="prateleira">
          {lista.map((p) => {
            const a = analise.get(p.id)
            const selo = p.pendente ? 'EM_ANALISE' : a?.selo
            const detalhes = [
              a?.familia ? NOME_FAMILIA[a.familia] : null,
              a?.intensidade ? NOME_INTENSIDADE[a.intensidade] : null,
            ].filter(Boolean).join(' · ')

            return (
              <li key={p.id} className="prateleira-item">
                <div className={`prateleira-frasco fundo-${(a?.familia ?? 'nenhuma').toLowerCase()}`}>
                  <Frasco familia={a?.familia} intensidade={a?.intensidade} pendente={p.pendente} tamanho={58} />
                </div>
                <div className="prateleira-info">
                  <strong>{p.nome}</strong>
                  <span className="apagado">{p.marca}</span>
                  <span className="prateleira-detalhe">
                    {p.pendente ? 'A gente está classificando' : detalhes}
                  </span>
                  {selo && <span className={`selo-analise selo-${selo.toLowerCase()}`}>{NOME_SELO[selo]}</span>}
                </div>

                {confirmando === p.id ? (
                  <div className="prateleira-confirma">
                    <span>Tirar {p.nome} da coleção?</span>
                    <div>
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
                  </div>
                ) : (
                  <button
                    type="button" className="prateleira-tirar"
                    onClick={() => setConfirmando(p.id)} aria-label={`Tirar ${p.nome} da coleção`}
                  >
                    <Fechar tamanho={16} />
                  </button>
                )}
              </li>
            )
          })}

          {/* Lugares livres do grátis: mostram quanto ainda cabe */}
          {filtro === 'todos' && gratis && !cheia && Array.from({ length: LIMITE_GRATIS - total }, (_, i) => (
            <li key={`livre-${i}`} className="prateleira-livre">
              <button type="button" onClick={focarBusca} aria-label="Adicionar perfume">
                <Mais tamanho={20} />
                <span>Lugar livre</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {itens && itens.some((p) => !p.pendente) && (
        <AdesivoColecao
          perfumes={itens.filter((p) => !p.pendente).map((p) => ({
            nome: p.nome, familia: sugestao?.analise.find((a) => a.id === p.id)?.familia ?? null,
          }))}
        />
      )}

      {itens && itens.length > 0 && sugestao && (
        <DicaLoja tempo={sugestao.tempo} titulo="Combinaria com a sua coleção" />
      )}

      {erro && <p className="conta-erro" role="alert">{erro}</p>}
    </section>
  )
}

/* ---------- Loja ---------- */

const LOJA_CURTA = { AMAZON: 'Amazon', MERCADO_LIVRE: 'Mercado Livre' } as const

/** Quantos perfumes a lista da Loja mostra de cada vez ("Ver mais" soma outro tanto). */
const POR_PAGINA = 10

const GENEROS: [Genero | '', string][] = [['', 'Todos'], ['MASCULINO', 'Masculino'], ['FEMININO', 'Feminino']]

/** A Loja abre filtrada pela preferência da pessoa ("os dois" ou sem resposta = Todos). */
const generoDaPreferencia = (p: Preferencia | null): Genero | '' => (p === 'MASCULINO' || p === 'FEMININO' ? p : '')

function Loja({ preferencia, sugestao }: { preferencia: Preferencia | null; sugestao: Sugestao | null }) {
  const [busca, setBusca] = useState('')
  const [genero, setGenero] = useState<Genero | ''>(generoDaPreferencia(preferencia))
  const mexeuNoFiltro = useRef(false)
  // O cliente pode chegar depois da tela abrir: aplica a preferência se a pessoa ainda não escolheu outro filtro
  useEffect(() => {
    if (!mexeuNoFiltro.current) setGenero(generoDaPreferencia(preferencia))
  }, [preferencia])
  const [ordem, setOrdem] = useState<OrdemPreco>('menor')
  const [itens, setItens] = useState<Oferta[] | null>(null)
  const [erro, setErro] = useState(false)
  const [soCombina, setSoCombina] = useState(false)
  const [limite, setLimite] = useState(POR_PAGINA)
  const tempo = sugestao?.tempo
  const temClima = !!tempo && tempo !== 'DESCONHECIDO'

  const carregar = useCallback(async () => {
    setErro(false)
    try {
      setItens(await buscarCatalogo({ busca, genero, ordem, tempo }))
    } catch {
      setErro(true)
    }
  }, [busca, genero, ordem, tempo])

  // Espera a pessoa parar de digitar (250 ms) antes de buscar
  useEffect(() => {
    const espera = setTimeout(carregar, busca ? 250 : 0)
    return () => clearTimeout(espera)
  }, [carregar, busca])

  // Mudou o filtro: volta a mostrar só a primeira leva
  useEffect(() => { setLimite(POR_PAGINA) }, [busca, genero, ordem, soCombina])

  const lista = itens && (soCombina ? itens.filter((o) => o.combina) : itens)
  const restam = lista ? lista.length - limite : 0

  return (
    <section className="painel-pagina loja" aria-labelledby="titulo-loja">
      <h2 id="titulo-loja" className="painel-titulo-pagina">Loja</h2>

      {sugestao && !busca && <CombinaHoje sugestao={sugestao} />}

      <div className="loja-controles">
        <label className="campo loja-busca">
          <span className="sr-only">Buscar perfume</span>
          <input
            type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou marca" autoComplete="off"
          />
        </label>
        <div className="loja-linha">
          <div className="colecao-filtros" role="group" aria-label="Filtrar por gênero">
            {GENEROS.map(([valor, nome]) => (
              <button
                key={nome} type="button" className="colecao-filtro"
                aria-pressed={genero === valor} onClick={() => { mexeuNoFiltro.current = true; setGenero(valor) }}
              >
                {nome}
              </button>
            ))}
          </div>
          {temClima && (
            <button
              type="button" className="colecao-filtro loja-filtro-combina"
              aria-pressed={soCombina} onClick={() => setSoCombina((v) => !v)}
            >
              <span aria-hidden="true" className="loja-filtro-check">{soCombina ? '✓' : ''}</span>
              Combina hoje
            </button>
          )}
          <button
            type="button" className="loja-ordem"
            onClick={() => setOrdem((o) => (o === 'menor' ? 'maior' : 'menor'))}
            aria-label={`Ordenar por preço: agora ${ordem === 'menor' ? 'menor' : 'maior'} primeiro`}
          >
            <IconeOrdem invertido={ordem === 'maior'} />
            {ordem === 'menor' ? 'Menor preço' : 'Maior preço'}
          </button>
        </div>
      </div>

      {erro && (
        <div className="cartao-suave">
          <strong>Não conseguimos abrir a Loja</strong>
          <button type="button" className="botao botao-escuro botao-mini loja-tentar" onClick={carregar}>
            Tentar de novo
          </button>
        </div>
      )}

      {!erro && itens === null && <p className="painel-dica">Carregando…</p>}

      {!erro && itens?.length === 0 && (
        <div className="cartao-suave">
          <strong>Nenhum perfume encontrado</strong>
          <p>{busca ? `Nada com "${busca}" por enquanto. Tente outro nome ou marca.` : 'Ainda não temos perfumes nessa categoria.'}</p>
          {(busca || genero) && (
            <button
              type="button" className="botao botao-contorno botao-mini loja-tentar"
              onClick={() => { mexeuNoFiltro.current = true; setBusca(''); setGenero('') }}
            >
              Limpar busca
            </button>
          )}
        </div>
      )}

      {!erro && itens && itens.length > 0 && lista?.length === 0 && (
        <div className="cartao-suave">
          <strong>Nenhum desses combina com hoje</strong>
          <p>Tire o filtro "Combina hoje" pra ver todos.</p>
          <button type="button" className="botao botao-contorno botao-mini loja-tentar" onClick={() => setSoCombina(false)}>
            Ver todos
          </button>
        </div>
      )}

      {lista && lista.length > 0 && (
        <div className="loja-todos">
          <p className="grupo-titulo">
            {soCombina ? `${lista.length} combinam com hoje` : busca ? `${lista.length} encontrados` : `Todos os perfumes · ${lista.length}`}
          </p>
          <ul className="grupo loja-lista">
            {lista.slice(0, limite).map((o) => <LinhaOferta key={o.id} oferta={o} />)}
          </ul>
          {restam > 0 && (
            <button type="button" className="botao botao-contorno loja-ver-mais" onClick={() => setLimite((l) => l + POR_PAGINA)}>
              Ver mais <span className="apagado">· faltam {restam}</span>
            </button>
          )}
        </div>
      )}

      <p className="painel-dica">
        Links de parceiros: a odri pode ganhar comissão, sem mudar o seu preço. O preço final aparece na loja.
      </p>
    </section>
  )
}

/** Por que a odri sugere esse perfume agora (uma frase curta, pelo clima). */
const MOTIVO_TEMPO: Record<string, string> = {
  CALOR: 'aguenta o calor', FRIO: 'esquenta o frio', AMENO: 'vai bem hoje', DESCONHECIDO: 'vai bem hoje',
}

/**
 * Topo da Loja: até 3 perfumes que a pessoa não tem e que combinam com o clima de agora
 * (GET /loja, barato → médio → caro). Some se não houver nada.
 */
function CombinaHoje({ sugestao }: { sugestao: Sugestao }) {
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const { tempo, temperatura, periodo, local } = sugestao

  useEffect(() => {
    let ativo = true
    buscarLoja(tempo === 'DESCONHECIDO' ? undefined : tempo)
      .then((r) => { if (ativo) setOfertas(r.ofertas) })
      .catch(() => {})
    return () => { ativo = false }
  }, [tempo])

  if (ofertas.length === 0) return null
  const agora = [
    temperatura !== null && `${Math.round(temperatura)} °C`,
    NOME_PERIODO[periodo].toLowerCase(),
    local,
  ].filter(Boolean).join(' · ')

  return (
    <section className="combina-hoje" aria-labelledby="titulo-combina">
      <div className="combina-topo">
        <h3 id="titulo-combina">Combina com hoje</h3>
        <span>{agora}</span>
      </div>
      <p className="combina-sub">Você ainda não tem. A odri escolheu pelo clima.</p>
      <ul className="combina-trilho">
        {ofertas.map((o) => (
          <li key={o.id}>
            <a
              className={`combina-card fundo-${o.familia.toLowerCase()}`}
              href={o.link} target="_blank" rel="noopener noreferrer sponsored"
              onClick={() => registrarEvento('CLIQUE_LOJA', { perfumeId: o.id, detalhe: 'combina-hoje' })}
              aria-label={`${o.nome}, ${o.marca}, ${NOME_FAIXA[o.faixa].preco}. Ver no Mercado Livre`}
            >
              <Frasco familia={o.familia} intensidade={o.intensidade} tamanho={44} />
              <strong>{o.nome}</strong>
              <small>{MOTIVO_TEMPO[tempo]}</small>
              <span className="combina-preco">{NOME_FAIXA[o.faixa].preco}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Uma linha da lista da Loja: a linha inteira abre o Mercado Livre. */
function LinhaOferta({ oferta: o }: { oferta: Oferta }) {
  const loja = o.loja ? LOJA_CURTA[o.loja] : 'loja'
  return (
    <li>
      <a
        className="grupo-linha loja-item" href={o.link} target="_blank" rel="noopener noreferrer sponsored"
        onClick={() => registrarEvento('CLIQUE_LOJA', { perfumeId: o.id, detalhe: 'loja' })}
        aria-label={`${o.nome}, ${o.marca}, ${NOME_FAIXA[o.faixa].preco}. Ver no ${loja}`}
      >
        <span className={`loja-item-frasco fundo-${o.familia.toLowerCase()}`}>
          <Frasco familia={o.familia} intensidade={o.intensidade} tamanho={30} />
        </span>
        <span className="grupo-texto">
          <strong>{o.nome}</strong>
          <small>
            <span className={`loja-familia fundo-${o.familia.toLowerCase()}`}>{NOME_FAMILIA[o.familia] ?? o.familia}</span>
            {' · '}{o.marca}{o.genero === 'UNISSEX' ? ' · Unissex' : ''}
          </small>
        </span>
        <span className="loja-item-fim">
          <span className="loja-preco">{NOME_FAIXA[o.faixa].preco}</span>
          {o.naColecao
            ? <span className="loja-selo loja-selo-tenho">Você tem</span>
            : o.combina && <span className="loja-selo">Combina hoje</span>}
        </span>
        <Seta tamanho={16} />
      </a>
    </li>
  )
}

/**
 * Uma sugestão da Loja no meio do app (Hoje e Coleção): 1 perfume que a pessoa não tem
 * e que combina com o clima de agora. Some sozinha se não houver nada pra sugerir.
 */
function DicaLoja({ tempo, titulo, aoMostrar }: {
  tempo?: string
  titulo: string
  aoMostrar?: () => void
}) {
  const [oferta, setOferta] = useState<Oferta | null>(null)
  const avisou = useRef(false)

  useEffect(() => {
    let ativo = true
    buscarLoja(tempo)
      .then((r) => {
        if (!ativo || r.ofertas.length === 0) return
        setOferta(r.ofertas[Math.floor(Math.random() * r.ofertas.length)])
      })
      .catch(() => {})
    return () => { ativo = false }
  }, [tempo])

  useEffect(() => {
    if (oferta && !avisou.current) {
      avisou.current = true
      aoMostrar?.()
    }
  }, [oferta, aoMostrar])

  if (!oferta) return null
  const porque = tempo === 'CALOR' ? 'aguenta bem o calor'
    : tempo === 'FRIO' ? 'esquenta nos dias frios'
    : 'vai bem no clima de hoje'

  return (
    <section className="dica-loja" aria-label={titulo}>
      <div className={`vitrine-frasco fundo-${oferta.familia.toLowerCase()}`}>
        <Frasco familia={oferta.familia} intensidade={oferta.intensidade} tamanho={46} />
      </div>
      <div className="dica-loja-texto">
        <h3>{titulo}</h3>
        <p><strong>{oferta.nome}</strong> <span className="apagado">{oferta.marca}</span></p>
        <p className="apagado">
          {NOME_FAMILIA[oferta.familia] ?? oferta.familia}, intensidade {(NOME_INTENSIDADE[oferta.intensidade] ?? '').toLowerCase()}: {porque}.
        </p>
        <div className="dica-loja-acoes">
          <a
            className="botao botao-escuro botao-mini vitrine-ver" href={oferta.link} target="_blank" rel="noopener noreferrer sponsored"
            onClick={() => registrarEvento('CLIQUE_LOJA', { perfumeId: oferta.id, detalhe: 'dica' })}
          >
            Ver {oferta.loja ? NOME_LOJA[oferta.loja] : 'na loja'} <Seta tamanho={16} />
          </a>
          <Link to="/app/loja" className="dica-loja-mais">Ver a Loja</Link>
        </div>
        <span className="dica-loja-parceiro">Link de parceiro</span>
      </div>
    </section>
  )
}

function IconeOrdem({ invertido }: { invertido: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ transform: invertido ? 'scaleY(-1)' : undefined, transition: 'transform 0.3s' }}>
      <path d="M7 4v16M3 8l4-4 4 4M14 8h7M14 13h5M14 18h3" />
    </svg>
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

  // Que perfume usa
  const [salvandoPref, setSalvandoPref] = useState(false)
  const [recadoPref, setRecadoPref] = useState<Recado>(null)

  // Senha
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [recadoSenha, setRecadoSenha] = useState<Recado>(null)

  // Qual linha dos ajustes está aberta (uma por vez)
  const [aberto, setAberto] = useState<'nome' | 'pref' | 'senha' | 'apagar' | null>(null)
  const alternar = (qual: NonNullable<typeof aberto>) => setAberto(aberto === qual ? null : qual)

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

  async function salvarPreferencia(p: Preferencia) {
    if (!cliente || p === cliente.preferencia) return
    setRecadoPref(null)
    setSalvandoPref(true)
    try {
      aoMudarCliente(await mudarPreferencia(p))
      setRecadoPref({ tipo: 'ok', texto: 'Salvo. As dicas da Loja seguem essa escolha.' })
    } catch {
      setRecadoPref({ tipo: 'erro', texto: 'Não deu para salvar agora. Tente de novo.' })
    } finally {
      setSalvandoPref(false)
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

      <div>
        <h3 className="grupo-titulo">Seu plano</h3>
        <div className="grupo">
          <div className="grupo-linha conta-linha-simples">
            <span className="grupo-texto"><small>Plano</small><strong>{cliente?.plus ? 'Plus' : 'Grátis'}</strong></span>
            {!cliente?.plus && <a className="grupo-acao" href="/#planos">Conhecer o Plus</a>}
          </div>
          <div className="grupo-linha conta-linha-simples">
            <span className="grupo-texto"><small>Cidade</small><strong>{cliente?.cidade ?? 'Automática (localização)'}</strong></span>
            <Link className="grupo-acao" to="/app/comecar">Trocar</Link>
          </div>
          <div className="grupo-linha conta-linha-simples">
            <span className="grupo-texto"><small>E-mail</small><strong>{email || '…'}</strong></span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="grupo-titulo">Ajustes</h3>
        <div className="grupo">
          <LinhaAjuste titulo="Nome" valor={cliente?.nome ?? '…'} aberto={aberto === 'nome'} aoTocar={() => alternar('nome')} />
          {aberto === 'nome' && (
            <form className="grupo-painel" onSubmit={salvarNome} noValidate>
              <label className="campo">
                <span className="so-leitor">Nome</span>
                <input
                  type="text" autoComplete="given-name" maxLength={100} autoFocus
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
          )}

          <LinhaAjuste
            titulo="Que perfume você usa" aberto={aberto === 'pref'} aoTocar={() => alternar('pref')}
            valor={PREFERENCIAS.find(([v]) => v === cliente?.preferencia)?.[1] ?? 'Não respondido'}
          />
          {aberto === 'pref' && (
            <div className="grupo-painel">
              {cliente && !cliente.preferencia && (
                <p className="texto-2">Responda pra receber dicas da Loja do seu jeito.</p>
              )}
              <div className="colecao-filtros escolha-preferencia-botoes" role="group" aria-label="Que perfume você usa">
                {PREFERENCIAS.map(([valor, nome]) => (
                  <button
                    key={valor} type="button" className="colecao-filtro" disabled={salvandoPref || !cliente}
                    aria-pressed={cliente?.preferencia === valor} onClick={() => salvarPreferencia(valor)}
                  >
                    {nome}
                  </button>
                ))}
              </div>
              {recadoPref && <p className={recadoPref.tipo === 'ok' ? 'conta-aviso' : 'conta-erro'} role="status">{recadoPref.texto}</p>}
            </div>
          )}

          <LinhaAjuste titulo="Senha" valor="Trocar" aberto={aberto === 'senha'} aoTocar={() => alternar('senha')} />
          {aberto === 'senha' && (
            <form className="grupo-painel" onSubmit={salvarSenha} noValidate>
              <label className="campo">
                <span className="so-leitor">Senha nova</span>
                <div className="campo-senha">
                  <input
                    type={mostrarSenha ? 'text' : 'password'} autoComplete="new-password" autoFocus
                    minLength={SENHA_MINIMA} placeholder={`Mínimo ${SENHA_MINIMA} caracteres`}
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
          )}
        </div>
      </div>

      <div className="grupo">
        <LinhaAjuste
          titulo="Apagar conta" valor="" perigo aberto={aberto === 'apagar'}
          aoTocar={() => { setConfirmando(false); alternar('apagar') }}
        />
        {aberto === 'apagar' && (
          <div className="grupo-painel">
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
        )}
      </div>
    </section>
  )
}

/** Uma linha dos ajustes da conta: mostra o valor e abre o campo embaixo ao tocar. */
function LinhaAjuste({ titulo, valor, aberto, aoTocar, perigo = false }: {
  titulo: string
  valor: string
  aberto: boolean
  aoTocar: () => void
  perigo?: boolean
}) {
  return (
    <button
      type="button" className={`grupo-linha grupo-botao conta-linha-ajuste ${perigo ? 'grupo-perigo' : ''}`}
      aria-expanded={aberto} onClick={aoTocar}
    >
      <span className="grupo-texto"><strong>{titulo}</strong></span>
      <span className="grupo-valor">{valor}</span>
      <span className={`grupo-seta ${aberto ? 'aberta' : ''}`} aria-hidden="true">›</span>
    </button>
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
