import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErroApi } from '../lib/api'
import { Cliente, garantirCadastro, jaComecou, marcarComecou } from '../lib/cadastro'
import { listarColecao } from '../lib/colecao'
import {
  buscarSugestao, corDaTemperatura, ItemAnalise, NOME_FAMILIA, NOME_INTENSIDADE,
  NOME_PERIODO, NOME_SELO, pegarLocalizacao, SAUDACAO, Sugestao,
} from '../lib/painel'
import { useTema } from '../lib/useTema'
import BuscaPerfume from '../components/BuscaPerfume'
import { Logo, Lua, Seta, Sol } from '../components/Icones'

type Tela = 'hoje' | 'colecao' | 'loja'
type Estado = 'carregando' | 'pronto' | 'semLocal' | 'erro'

const LIMITE_GRATIS = 8

/**
 * Painel do app (/app, /app/colecao, /app/loja).
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
        {tela === 'colecao' && <ColecaoEmBreve />}

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

/* ---------- Loja e Coleção (em breve) ---------- */

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

function ColecaoEmBreve() {
  return (
    <section className="painel-pagina">
      <h2 className="painel-titulo-pagina">Coleção</h2>
      <div className="cartao-suave">
        <span className="painel-rotulo">Em breve</span>
        <strong>Sua coleção completa, com filtros</strong>
        <p>Por enquanto, veja e adicione seus perfumes na tela Hoje (aba Análise).</p>
      </div>
      <Link to="/app" className="botao botao-escuro botao-campo">Ir para Hoje</Link>
    </section>
  )
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
