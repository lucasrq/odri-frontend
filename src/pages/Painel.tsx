import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ErroApi } from '../lib/api'
import {
  apagarConta, Cliente, garantirCadastro, jaComecou, marcarComecou, mudarEmailDiario, mudarNome, mudarPreferencia, Preferencia, PREFERENCIAS,
} from '../lib/cadastro'
import { ItemColecao, listarColecao, mensagemColecao, tirarDaColecao } from '../lib/colecao'
import {
  buscarSugestao, corDaTemperatura, dicaMaisTarde, ItemAnalise, NOME_FAMILIA, NOME_INTENSIDADE,
  NOME_MELHOR_HORARIO, NOME_PERIODO, NOME_SELO, pegarLocalizacao, SAUDACAO, Sugestao,
} from '../lib/painel'
import {
  buscarCatalogo, buscarLoja, Genero, NOME_FAIXA, NOME_LOJA, Oferta, OrdemPreco,
} from '../lib/loja'
import { useTema } from '../lib/useTema'
import BuscaPerfume from '../components/BuscaPerfume'
import Frasco from '../components/Frasco'
import PagarPix from '../components/PagarPix'
import AdesivoStory from '../components/AdesivoStory'
import AdesivoDia from '../components/AdesivoDia'
import AdminPerfumes from '../components/AdminPerfumes'
import VitrineBlackFriday, { vitrineNoAr } from '../components/VitrineBlackFriday'
import ReguaDia, { POS_PERIODO } from '../components/ReguaDia'
import IconeOcasiao, { COR_OCASIAO } from '../components/IconeOcasiao'
import { gerarAdesivoColecao } from '../lib/adesivo'
import { ehAdmin } from '../lib/admin'
import { registrarEvento, registrarViuSugestao } from '../lib/eventos'
import { Cadeado, Check, Chuva, Fechar, Instagram, Logo, Lua, Mais, Seta, Sol } from '../components/Icones'
import {
  Assinatura, assinarPlus, cancelarAssinatura, comecarTestePlus, diaMes, diasAte, escolherOcasiao, listarOcasioes,
  minhaAssinatura, Ocasiao,
} from '../lib/plus'

type Tela = 'hoje' | 'colecao' | 'loja' | 'conta' | 'admin'
type Estado = 'carregando' | 'pronto' | 'semLocal' | 'erro'

const LIMITE_GRATIS = 6
/** O limite do grátis só aparece a partir do 5º perfume: antes disso a pessoa conhece o app sem pensar em limite. */
const AVISAR_LIMITE_A_PARTIR = 5

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
  // Janela do Plus: abre por cima de qualquer tela (menu do topo ou Conta); o X fecha
  const [verPlus, setVerPlus] = useState(false)
  const fecharPlus = useCallback(() => setVerPlus(false), [])

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
      registrarViuSugestao()
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

  /**
   * Plus: troca a ocasião NA HORA usando a sugestão que o servidor já mandou pronta (porOcasiao);
   * o servidor só fica sabendo depois, em segundo plano. Se der erro, volta como estava.
   */
  async function trocarOcasiao(id: number | null) {
    if (!cliente) return
    const antes = { cliente, sugestao }
    const pronta = sugestao?.porOcasiao?.[id === null ? '' : String(id)]
    setCliente({ ...cliente, ocasiaoId: id })
    if (pronta && sugestao) setSugestao({ ...pronta, porOcasiao: sugestao.porOcasiao })
    try {
      const c = await escolherOcasiao(id)
      if (!pronta) {
        setCliente(c)
        await carregar(c)
      }
    } catch {
      setCliente(antes.cliente)
      setSugestao(antes.sugestao)
    }
  }

  return (
    <div className="painel">
      <Topo cliente={cliente} aoVerPlus={() => setVerPlus(true)} />
      {verPlus && (
        <JanelaPlus
          cliente={cliente} aoFechar={fecharPlus}
          aoMudarCliente={(c) => { setCliente(c); carregar(c) }}
        />
      )}

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
            aoVerPlus={() => setVerPlus(true)}
            aoTrocarOcasiao={trocarOcasiao}
          />
        )}
        {tela === 'loja' && <Loja preferencia={cliente?.preferencia ?? null} sugestao={sugestao} clienteId={cliente?.id ?? ''} />}
        {tela === 'colecao' && (
          <Colecao
            cliente={cliente}
            sugestao={sugestao}
            aoMudar={() => cliente && carregar(cliente)}
            aoVerPlus={() => setVerPlus(true)}
          />
        )}

        {tela === 'conta' && <Conta cliente={cliente} aoMudarCliente={setCliente} aoVerPlus={() => setVerPlus(true)} />}
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

function Topo({ cliente, aoVerPlus }: { cliente: Cliente | null; aoVerPlus: () => void }) {
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
              <button type="button" role="menuitem" className="destaque-texto" onClick={() => { setMenu(false); aoVerPlus() }}>
                Conhecer o Plus
              </button>
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
        {sugestao?.chuva && <span className="dia-agora-chuva"><Chuva />{sugestao.chuva}</span>}
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

function Hoje({ estado, sugestao, cliente, recarregar, aoVerPlus, aoTrocarOcasiao }: {
  estado: Estado
  sugestao: Sugestao | null
  cliente: Cliente | null
  recarregar: () => void
  aoVerPlus: () => void
  aoTrocarOcasiao: (id: number | null) => void
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
  if (estado === 'carregando') {
    // Esqueleto no formato do cartão (mesma cor do fundo da página), em vez de um bloco claro com texto pequeno
    return (
      <div className="cartao-esqueleto" aria-busy="true" aria-label="Escolhendo seu perfume">
        <span className="esqueleto-linha esqueleto-curta" />
        <span className="esqueleto-linha esqueleto-titulo" />
        <span className="esqueleto-linha esqueleto-media" />
        <span className="esqueleto-linha" />
        <span className="esqueleto-linha esqueleto-media" />
      </div>
    )
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
  // A Loja só aparece no Hoje quando nenhum perfume da coleção combina de verdade (nota abaixo de 70)
  const semCombina = !!sugestao.perfume && notaDoMelhor(sugestao) < COMBINA_A_PARTIR

  return (
    <div className="painel-grade" data-analise={verAnalise ? 'aberta' : 'fechada'}>
      <div className="painel-col painel-col-hoje">
        <OcasioesHoje cliente={cliente} aoVerPlus={aoVerPlus} aoTrocar={aoTrocarOcasiao} />
        <MelhorDoDia sugestao={sugestao} />

        {(outra || sugestao.perfume) && (
          <section aria-labelledby="titulo-pra-hoje">
            <h2 id="titulo-pra-hoje" className="grupo-titulo">Pra hoje também</h2>
            <div className="grupo">
              {outra}
              {sugestao.perfume && <AdesivoDoDia sugestao={sugestao} />}
            </div>
          </section>
        )}

        {/* A Loja vem depois da dica de uso, como um complemento, nunca como "sua coleção não serve" */}
        {semCombina && (
          <DicaLoja
            tempo={sugestao.tempo} graus={sugestao.temperatura}
            titulo={sugestao.tempo === 'CALOR' ? 'Um coringa pro calor'
              : sugestao.tempo === 'FRIO' ? 'Um coringa pro frio' : 'Um coringa pra hoje'}
          />
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
                  {cliente && !cliente.plus && idsColecao.length >= AVISAR_LIMITE_A_PARTIR
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
                  {combinam > 0
                    ? `${combinam} ${combinam === 1 ? 'combina' : 'combinam'} agora`
                    : 'Veja o melhor horário de cada um'}
                  {emAnalise > 0 && ` · ${emAnalise} em análise`}
                </small>
              </span>
              <span className={`grupo-seta ${verAnalise ? 'aberta' : ''}`} aria-hidden="true">›</span>
            </button>
          </div>
        </section>

        <a className="cartao-insta" href="https://www.instagram.com/odri.app/" target="_blank" rel="noopener noreferrer">
          <span className="cartao-insta-icone"><Instagram /></span>
          <span className="cartao-insta-texto">
            <strong>@odri.app</strong>
            <small>Dicas de perfume pro clima, toda semana</small>
          </span>
          <span className="cartao-insta-seguir">Seguir</span>
        </a>
      </div>

      <div className="painel-col painel-col-analise" ref={analiseRef}>
        <Analise sugestao={sugestao} />
      </div>
    </div>
  )
}

/* ---------- Ocasiões (Plus): "Pra onde você vai hoje?" ---------- */

const OCASIOES_PLUS = ['Trabalho', 'Faculdade', 'Academia', 'Reunião', 'Encontro', 'Festa', 'Igreja', 'Praia']

function OcasioesHoje({ cliente, aoVerPlus, aoTrocar }: {
  cliente: Cliente | null
  aoVerPlus: () => void
  aoTrocar: (id: number | null) => void
}) {
  const [ocasioes, setOcasioes] = useState<Ocasiao[]>([])
  const plus = !!cliente?.plus

  useEffect(() => {
    if (!plus) return
    // Mesma ordem da janela do Plus (o banco guarda na ordem em que foram criadas)
    const ordem = (nome: string) => { const i = OCASIOES_PLUS.indexOf(nome); return i < 0 ? 99 : i }
    listarOcasioes().then((lista) => setOcasioes([...lista].sort((a, b) => ordem(a.nome) - ordem(b.nome)))).catch(() => {})
  }, [plus])

  function escolher(id: number) {
    const nova = cliente?.ocasiaoId === id ? null : id // tocar de novo tira
    aoTrocar(nova)
    if (nova) registrarEvento('OCASIAO', { detalhe: ocasioes.find((o) => o.id === nova)?.nome })
  }

  return (
    <section className="ocasioes-hoje" aria-labelledby="titulo-ocasiao">
      <div className="ocasioes-hoje-topo">
        <h2 id="titulo-ocasiao" className="grupo-titulo">Pra onde você vai hoje?</h2>
        {!plus && <button type="button" className="selo selo-destaque ocasioes-hoje-selo" onClick={aoVerPlus}>Plus</button>}
      </div>
      <div className="ocasioes-hoje-trilho" role="group" aria-label="Ocasião de hoje">
        {plus
          ? ocasioes.map((o) => (
            <button
              key={o.id} type="button" className="colecao-filtro"
              aria-pressed={cliente?.ocasiaoId === o.id} onClick={() => escolher(o.id)}
            >
              {o.nome}
            </button>
          ))
          : OCASIOES_PLUS.map((nome) => (
            <button key={nome} type="button" className="colecao-filtro ocasiao-trancada" onClick={aoVerPlus}>
              <Cadeado />{nome}
            </button>
          ))}
      </div>
    </section>
  )
}

/** Mesma régua do back: 70 ou mais = combina. */
const COMBINA_A_PARTIR = 70
const notaDoMelhor = (s: Sugestao) => s.analise.find((a) => a.id === s.perfume?.id)?.nota ?? 0

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
  const fraco = notaDoMelhor(sugestao) < COMBINA_A_PARTIR
  const ocasiao = sugestao.ocasiao ?? null
  const rotulo = !fraco ? 'Melhor pra hoje' : 'Melhor opção pra agora'
  const maisTarde = nadaCombina ? dicaMaisTarde(sugestao.analise) : null
  // Plus com ocasião: o cartão se pinta com a cor dela e ganha a faixa "Pra academia · até meia-noite"
  return (
    <section
      className={ocasiao ? 'cartao-tinta cartao-ocasiao' : 'cartao-tinta'}
      style={ocasiao ? { ['--cor-ocasiao' as string]: COR_OCASIAO[ocasiao] ?? '#1F4E63' } : undefined}
      aria-label={ocasiao ? `${rotulo}, pra ${ocasiao}` : rotulo}
    >
      {ocasiao && (
        <>
          <span className="cartao-ocasiao-fundo" aria-hidden="true"><IconeOcasiao nome={ocasiao} tamanho={160} /></span>
          <div className="cartao-ocasiao-faixa">
            <IconeOcasiao nome={ocasiao} />
            <strong>Pra {ocasiao.toLowerCase()}</strong>
            <small>até meia-noite</small>
          </div>
        </>
      )}
      <div className="cartao-linha">
        <span className="cartao-rotulo">{rotulo}</span>
        {item?.nota != null && (
          // Nota baixa não aparece em % (26% soa como erro): vira "com ajuste", que é o que a dica explica
          <span className={fraco ? 'cartao-nota cartao-nota-fraca' : 'cartao-nota'}>
            {fraco ? 'com ajuste' : `${item.nota}% combina`}
          </span>
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
            <i className={fraco ? 'fraco' : ''} style={{ width: `${item.nota}%` }} />
          </div>
        )}
        <p className="cartao-texto">
          {nadaCombina
            ? [sugestao.motivo, 'Use pouco: 1 borrifada no pescoço.', maisTarde].filter(Boolean).join(' ')
            : sugestao.motivo}
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
        <div><strong className="destaque-texto">{combinam}</strong><span>combinam agora</span></div>
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
        {item.melhorHorario && item.melhorHorario !== 'FRIO'
          ? <span className="selo-analise selo-depois">{NOME_MELHOR_HORARIO[item.melhorHorario]}</span>
          : item.melhorHorario === 'FRIO'
            ? <span className="selo-analise selo-evite">{NOME_MELHOR_HORARIO.FRIO}</span>
            : <span className={`selo-analise selo-${item.selo.toLowerCase()}`}>{NOME_SELO[item.selo]}</span>}
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
function Colecao({ cliente, sugestao, aoMudar, aoVerPlus }: {
  cliente: Cliente | null
  sugestao: Sugestao | null
  aoMudar: () => void
  aoVerPlus: () => void
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
        {itens && (
          <p className="painel-dica">
            {gratis && total >= AVISAR_LIMITE_A_PARTIR
              ? `${total} de ${LIMITE_GRATIS} lugares ocupados no plano grátis`
              : `${total} ${total === 1 ? 'perfume' : 'perfumes'} na coleção`}
          </p>
        )}
      </div>

      {cheia ? (
        <div className="cartao-suave">
          <span className="painel-rotulo">Coleção cheia</span>
          <strong>Os {LIMITE_GRATIS} lugares do grátis estão ocupados</strong>
          <p>Tire um perfume para colocar outro. No Plus a coleção não tem limite.</p>
          <button type="button" className="botao botao-destaque botao-campo" onClick={aoVerPlus}>
            Conhecer o Plus
          </button>
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

      {itens === null && !erro && (
        <div className="cartao-esqueleto colecao-esqueleto" aria-busy="true" aria-label="Carregando sua coleção">
          <span className="esqueleto-linha esqueleto-media" />
          <span className="esqueleto-linha" />
          <span className="esqueleto-linha esqueleto-media" />
        </div>
      )}
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

          {/* Um cartão só pra adicionar (sem mostrar quantos lugares sobram: o limite só aparece a partir do 6º) */}
          {filtro === 'todos' && !cheia && (
            <li className="prateleira-livre">
              <button type="button" onClick={focarBusca}>
                <Mais tamanho={20} />
                <span>Adicionar perfume</span>
              </button>
            </li>
          )}
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
        <DicaLoja tempo={sugestao.tempo} graus={sugestao.temperatura} titulo="Combinaria com a sua coleção" />
      )}

      {erro && <p className="conta-erro" role="alert">{erro}</p>}
    </section>
  )
}

/* ---------- Loja ---------- */

const LOJA_CURTA = { AMAZON: 'Amazon', MERCADO_LIVRE: 'Mercado Livre' } as const

/** Quantos perfumes a grade da Loja mostra de cada vez ("Ver mais" soma outro tanto). 12 fecha linha com 2, 3 ou 4 colunas. */
const POR_PAGINA = 12

const GENEROS: [Genero | '', string][] = [['', 'Todos'], ['MASCULINO', 'Masculino'], ['FEMININO', 'Feminino']]

/** A Loja abre filtrada pela preferência da pessoa ("os dois" ou sem resposta = Todos). */
const generoDaPreferencia = (p: Preferencia | null): Genero | '' => (p === 'MASCULINO' || p === 'FEMININO' ? p : '')

/** Ordem da grade: "Pra você" (misturada) → menor preço → maior preço → de novo. */
type OrdemLoja = 'pravoce' | OrdemPreco
const PROXIMA_ORDEM: Record<OrdemLoja, OrdemLoja> = { pravoce: 'menor', menor: 'maior', maior: 'pravoce' }
const NOME_ORDEM: Record<OrdemLoja, string> = { pravoce: 'Pra você', menor: 'Menor preço', maior: 'Maior preço' }

/** Número "aleatório" fixo para um texto (mesmo texto = mesmo número). */
function sorteio(texto: string) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619)
  return h >>> 0
}

/**
 * "Pra você": cada pessoa vê uma ordem diferente, que muda todo dia.
 * No mesmo dia a ordem não muda (a grade não pula quando a pessoa mexe nos filtros).
 */
function misturarDoDia(itens: Oferta[], clienteId: string) {
  const d = new Date()
  const dia = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  return itens
    .map((o) => ({ o, n: sorteio(`${clienteId}-${dia}-${o.id}`) }))
    .sort((a, b) => a.n - b.n)
    .map((x) => x.o)
}

/** Tipos de perfume da Loja: endereço (/app/loja/fresco) → família, título da prateleira e uma frase curta. */
const TIPOS_LOJA: { slug: string; familia: string; titulo: string; frase: string }[] = [
  { slug: 'fresco', familia: 'FRESCO', titulo: 'Frescos', frase: 'Leves e limpos, bons pro calor' },
  { slug: 'citrico', familia: 'CITRICO', titulo: 'Cítricos', frase: 'Vibrantes, pra usar de dia' },
  { slug: 'floral', familia: 'FLORAL', titulo: 'Florais', frase: 'Delicados, cheiro de flor' },
  { slug: 'doce', familia: 'DOCE', titulo: 'Doces', frase: 'Aconchegantes, lembram sobremesa' },
  { slug: 'amadeirado', familia: 'AMADEIRADO', titulo: 'Amadeirados', frase: 'Marcantes, cheiro de madeira' },
  { slug: 'oriental', familia: 'ORIENTAL', titulo: 'Orientais', frase: 'Intensos, pra noite e pro frio' },
]
const PAGINA_COMBINA = { slug: 'combina', familia: null, titulo: 'Combina agora', frase: 'Pelo clima de agora, na sua cidade' }
/** Quantos perfumes cada prateleira mostra antes do "Ver todos". */
const POR_PRATELEIRA = 8

function Loja({ preferencia, sugestao, clienteId }: {
  preferencia: Preferencia | null
  sugestao: Sugestao | null
  clienteId: string
}) {
  // /app/loja = prateleiras; /app/loja/fresco (ou /combina) = grade só daquele tipo
  const { tipo } = useParams<{ tipo?: string }>()
  const pagina = tipo === 'combina' ? PAGINA_COMBINA : TIPOS_LOJA.find((t) => t.slug === tipo) ?? null
  const [busca, setBusca] = useState('')
  const [genero, setGenero] = useState<Genero | ''>(generoDaPreferencia(preferencia))
  const mexeuNoFiltro = useRef(false)
  // O cliente pode chegar depois da tela abrir: aplica a preferência se a pessoa ainda não escolheu outro filtro
  useEffect(() => {
    if (!mexeuNoFiltro.current) setGenero(generoDaPreferencia(preferencia))
  }, [preferencia])
  const [ordem, setOrdem] = useState<OrdemLoja>('pravoce')
  const [itens, setItens] = useState<Oferta[] | null>(null)
  const [erro, setErro] = useState(false)
  const [soCombina, setSoCombina] = useState(false)
  const [soBarato, setSoBarato] = useState(false)
  const [limite, setLimite] = useState(POR_PAGINA)
  const tempo = sugestao?.tempo
  const graus = sugestao?.temperatura ?? null
  const temClima = !!tempo && tempo !== 'DESCONHECIDO'
  const buscando = busca.trim().length > 0
  // Grade: na página de um tipo ou quando a pessoa busca. Sem isso, prateleiras.
  const emGrade = !!pagina || buscando

  // Trocou de página (prateleiras ↔ um tipo): volta pro topo, ordem "Pra você" e sem "Combina agora"
  useEffect(() => {
    setOrdem('pravoce')
    setSoCombina(false)
    window.scrollTo({ top: 0 })
  }, [tipo])

  const carregar = useCallback(async () => {
    setErro(false)
    try {
      const lista = await buscarCatalogo({ busca, genero, ordem: ordem === 'pravoce' ? undefined : ordem, tempo, graus })
      setItens(ordem === 'pravoce' ? misturarDoDia(lista, clienteId) : lista)
    } catch {
      setErro(true)
    }
  }, [busca, genero, ordem, tempo, graus, clienteId])

  // Espera a pessoa parar de digitar (250 ms) antes de buscar
  useEffect(() => {
    const espera = setTimeout(carregar, busca ? 250 : 0)
    return () => clearTimeout(espera)
  }, [carregar, busca])

  // Mudou o filtro: volta a mostrar só a primeira leva
  useEffect(() => { setLimite(POR_PAGINA) }, [busca, genero, ordem, soCombina, soBarato, tipo])

  const filtrados = itens && itens.filter((o) => !soBarato || o.faixa === 'ATE_150')
  const lista = filtrados && filtrados.filter((o) => {
    if (pagina && !buscando) return (pagina.familia ? o.familia === pagina.familia : o.combina) && (!soCombina || o.combina)
    return !soCombina || o.combina
  })
  const restam = lista ? lista.length - limite : 0

  // Prateleiras: "Combina agora" (se tiver clima) + uma por família que tiver perfume
  const prateleiras = filtrados && !emGrade
    ? [
        ...(temClima ? [{ ...PAGINA_COMBINA, itens: filtrados.filter((o) => o.combina) }] : []),
        ...TIPOS_LOJA.map((t) => ({ ...t, itens: filtrados.filter((o) => o.familia === t.familia) })),
      ].filter((p) => p.itens.length > 0)
    : []
  const semResultado = emGrade ? lista?.length === 0 : prateleiras.length === 0

  return (
    <section className="painel-pagina loja" aria-labelledby="titulo-loja">
      {pagina ? (
        <div className="loja-pagina-topo">
          <Link to="/app/loja" className="loja-voltar"><span aria-hidden="true">‹</span> Loja</Link>
          <h2 id="titulo-loja" className="painel-titulo-pagina">{pagina.titulo}</h2>
          <p className="texto-2">{pagina.frase}</p>
        </div>
      ) : (
        <h2 id="titulo-loja" className="painel-titulo-pagina">Loja</h2>
      )}

      {!pagina && sugestao && !buscando && <CombinaHoje sugestao={sugestao} />}

      {!pagina && !buscando && itens && vitrineNoAr() && <VitrineBlackFriday itens={itens} />}

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
          {temClima && emGrade && pagina?.slug !== 'combina' && (
            <button
              type="button" className="colecao-filtro loja-filtro-combina"
              aria-pressed={soCombina} onClick={() => setSoCombina((v) => !v)}
            >
              <span aria-hidden="true" className="loja-filtro-check">{soCombina ? '✓' : ''}</span>
              Combina agora
            </button>
          )}
          <button
            type="button" className="colecao-filtro"
            aria-pressed={soBarato} onClick={() => setSoBarato((v) => !v)}
          >
            Até R$150
          </button>
          {emGrade && (
            <button
              type="button" className="loja-ordem"
              onClick={() => setOrdem((o) => PROXIMA_ORDEM[o])}
              aria-label={`Ordem: ${NOME_ORDEM[ordem]}. Tocar troca para ${NOME_ORDEM[PROXIMA_ORDEM[ordem]]}`}
            >
              {ordem === 'pravoce'
                ? <span className="loja-ordem-brilho" aria-hidden="true">✦</span>
                : <IconeOrdem invertido={ordem === 'maior'} />}
              {NOME_ORDEM[ordem]}
            </button>
          )}
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

      {!erro && itens === null && (
        // Esqueleto no formato dos cartões, em vez de "Carregando…" (que parecia tela quebrada)
        <ul className="loja-grade" aria-busy="true" aria-label="Carregando a Loja">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="loja-cartao-esqueleto">
              <span className="esqueleto-linha esqueleto-vitrine" />
              <span className="esqueleto-linha esqueleto-media" />
              <span className="esqueleto-linha esqueleto-curta" />
            </li>
          ))}
        </ul>
      )}

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

      {!erro && itens && itens.length > 0 && semResultado && (
        <div className="cartao-suave">
          <strong>Nenhum perfume com esses filtros</strong>
          <p>Tire um filtro ("Até R$150", "Combina agora" ou o gênero) pra ver mais.</p>
          <button
            type="button" className="botao botao-contorno botao-mini loja-tentar"
            onClick={() => { setSoCombina(false); setSoBarato(false) }}
          >
            Ver todos
          </button>
        </div>
      )}

      {!emGrade && prateleiras.map((p) => (
        <Prateleira key={p.slug} slug={p.slug} titulo={p.titulo} frase={p.frase} itens={p.itens} />
      ))}

      {emGrade && lista && lista.length > 0 && (
        <div className="loja-todos">
          <p className="grupo-titulo">
            {buscando ? `${lista.length} encontrados` : soCombina ? `${lista.length} combinam agora` : `${lista.length} perfumes`}
          </p>
          <ul className="loja-grade">
            {lista.slice(0, limite).map((o) => (
              <CartaoOferta key={o.id} oferta={o} detalhe={pagina && !buscando ? `loja-${pagina.slug}` : 'loja-busca'} />
            ))}
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

/**
 * Uma prateleira da Loja: no celular arrasta pro lado, no PC tem setas ‹ ›.
 * Mostra até 8; o último cartão (e o "Ver mais" do título) abre a página só daquele tipo.
 */
function Prateleira({ slug, titulo, frase, itens }: { slug: string; titulo: string; frase: string; itens: Oferta[] }) {
  const trilho = useRef<HTMLUListElement>(null)
  const [setas, setSetas] = useState({ voltar: false, avancar: false })
  const mostrar = itens.slice(0, POR_PRATELEIRA)
  const sobra = itens.length - mostrar.length
  const idTitulo = `prateleira-${slug}`

  const atualizarSetas = useCallback(() => {
    const t = trilho.current
    if (!t) return
    setSetas({ voltar: t.scrollLeft > 4, avancar: t.scrollLeft + t.clientWidth < t.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    // A lista mudou (filtro, ordem do dia): a prateleira volta pro começo
    if (trilho.current) trilho.current.scrollLeft = 0
    atualizarSetas()
    window.addEventListener('resize', atualizarSetas)
    return () => window.removeEventListener('resize', atualizarSetas)
  }, [atualizarSetas, itens])

  function passar(lado: 1 | -1) {
    const t = trilho.current
    if (!t) return
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    t.scrollBy({ left: lado * t.clientWidth * 0.92, behavior: suave ? 'smooth' : 'auto' })
  }

  return (
    <section className={`prateleira-loja prateleira-loja-${slug}`} aria-labelledby={idTitulo}>
      <div className="prateleira-loja-topo">
        <div className="prateleira-loja-nome">
          <h3 id={idTitulo}>{titulo}</h3>
          <p>{frase}</p>
        </div>
        <Link to={`/app/loja/${slug}`} className="prateleira-loja-ver">Ver mais</Link>
        <div className="prateleira-loja-setas">
          <button type="button" onClick={() => passar(-1)} disabled={!setas.voltar} aria-label={`${titulo}: anteriores`}>‹</button>
          <button type="button" onClick={() => passar(1)} disabled={!setas.avancar} aria-label={`${titulo}: próximos`}>›</button>
        </div>
      </div>
      <ul className="prateleira-loja-trilho" ref={trilho} onScroll={atualizarSetas}>
        {mostrar.map((o) => <CartaoOferta key={o.id} oferta={o} detalhe={`loja-${slug}`} />)}
        {sobra > 0 && (
          <li>
            <Link to={`/app/loja/${slug}`} className="loja-cartao loja-cartao-todos">
              <span className="loja-cartao-todos-numero">+{sobra}</span>
              <strong>Ver todos os {titulo.toLowerCase()}</strong>
              <span className="loja-cartao-ir" aria-hidden="true"><Seta tamanho={14} /></span>
            </Link>
          </li>
        )}
      </ul>
    </section>
  )
}

/** Por que a odri sugere esse perfume agora (uma frase curta, pelo clima). */
/** "Combina com esta manhã / esta tarde / esta noite" (o selo muda com a hora). */
const ESTE_PERIODO = { MANHA: 'esta manhã', TARDE: 'esta tarde', NOITE: 'esta noite' } as const

const MOTIVO_TEMPO: Record<string, string> = {
  CALOR: 'aguenta o calor', FRIO: 'esquenta o frio', AMENO: 'vai bem agora', DESCONHECIDO: 'vai bem agora',
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
    buscarLoja(tempo, temperatura)
      .then((r) => { if (ativo) setOfertas(r.ofertas) })
      .catch(() => {})
    return () => { ativo = false }
  }, [tempo, temperatura])

  if (ofertas.length === 0) return null
  const agora = [
    temperatura !== null && `${Math.round(temperatura)} °C`,
    NOME_PERIODO[periodo].toLowerCase(),
    local,
  ].filter(Boolean).join(' · ')

  return (
    <section className="combina-hoje" aria-labelledby="titulo-combina">
      <div className="combina-topo">
        <h3 id="titulo-combina">Combina com {ESTE_PERIODO[periodo]}</h3>
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

/** Preço curto pro cartão da grade (cabe numa etiqueta pequena). */
const PRECO_CURTO = { ATE_150: 'até R$150', DE_150_A_400: 'R$150–400', ACIMA_400: '+ de R$400' } as const

/** Um cartão da grade da Loja: o cartão inteiro abre o Mercado Livre. */
function CartaoOferta({ oferta: o, detalhe = 'loja' }: { oferta: Oferta; detalhe?: string }) {
  const loja = o.loja ? LOJA_CURTA[o.loja] : 'loja'
  const familia = o.familia.toLowerCase()
  return (
    <li>
      <a
        className={`loja-cartao fundo-${familia}`} href={o.link} target="_blank" rel="noopener noreferrer sponsored"
        onClick={() => registrarEvento('CLIQUE_LOJA', { perfumeId: o.id, detalhe })}
        aria-label={`${o.nome}, ${o.marca}, ${NOME_FAIXA[o.faixa].preco}${o.naColecao ? ', você tem' : o.combina ? ', combina agora' : ''}. Ver no ${loja}`}
      >
        <span className="loja-cartao-vitrine">
          {o.naColecao
            ? <span className="loja-cartao-selo loja-cartao-selo-tenho">Você tem</span>
            : o.combina && <span className="loja-cartao-selo">Combina agora</span>}
          <Frasco familia={o.familia} intensidade={o.intensidade} tamanho={50} />
        </span>
        <strong>{o.nome}</strong>
        <small>
          <span className="loja-familia">{NOME_FAMILIA[o.familia] ?? o.familia}</span>
          {' · '}{o.marca}{o.genero === 'UNISSEX' ? ' · Unissex' : ''}
        </small>
        <span className="loja-cartao-base">
          <span className="loja-cartao-preco">{PRECO_CURTO[o.faixa]}</span>
          <span className="loja-cartao-ir" aria-hidden="true"><Seta tamanho={14} /></span>
        </span>
        {/* Aviso junto do clique: pra onde vai e que é link de parceiro */}
        <span className="loja-cartao-parceiro">Ver no {loja} · link de parceiro</span>
      </a>
    </li>
  )
}

/**
 * Uma sugestão da Loja no meio do app (Hoje e Coleção): 1 perfume que a pessoa não tem
 * e que combina com o clima de agora. Some sozinha se não houver nada pra sugerir.
 */
function DicaLoja({ tempo, graus, titulo, aoMostrar }: {
  tempo?: string
  graus?: number | null
  titulo: string
  aoMostrar?: () => void
}) {
  const [oferta, setOferta] = useState<Oferta | null>(null)
  const avisou = useRef(false)

  useEffect(() => {
    let ativo = true
    buscarLoja(tempo, graus)
      .then((r) => {
        if (!ativo || r.ofertas.length === 0) return
        setOferta(r.ofertas[Math.floor(Math.random() * r.ofertas.length)])
      })
      .catch(() => {})
    return () => { ativo = false }
  }, [tempo, graus])

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

function Conta({ cliente, aoMudarCliente, aoVerPlus }: {
  cliente: Cliente | null
  aoMudarCliente: (c: Cliente) => void
  aoVerPlus: () => void
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

  // Sugestão do dia por e-mail
  const [salvandoEmail, setSalvandoEmail] = useState(false)
  const [recadoEmail, setRecadoEmail] = useState<Recado>(null)

  // Senha
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [recadoSenha, setRecadoSenha] = useState<Recado>(null)

  // Qual linha dos ajustes está aberta (uma por vez)
  const [aberto, setAberto] = useState<'nome' | 'pref' | 'senha' | 'apagar' | null>(null)
  const alternar = (qual: NonNullable<typeof aberto>) => setAberto(aberto === qual ? null : qual)

  // Assinatura do Plus (Mercado Pago)
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const [recadoPlus, setRecadoPlus] = useState<Recado>(null)

  // Ao abrir a Conta (e ao voltar do Mercado Pago com ?plus=voltou): confere a assinatura e atualiza o plano
  useEffect(() => {
    const voltou = new URLSearchParams(window.location.search).get('plus') === 'voltou'
    minhaAssinatura().then(async (a) => {
      setAssinatura(a)
      if (voltou) {
        const c = await garantirCadastro().catch(() => null)
        if (c) aoMudarCliente(c)
        setRecadoPlus(a.status === 'ATIVA'
          ? { tipo: 'ok', texto: 'Pronto! Sua assinatura do Plus está ativa.' }
          : { tipo: 'ok', texto: 'Recebemos. Assim que o Mercado Pago confirmar o pagamento, o Plus aparece aqui (leva uns minutos).' })
        window.history.replaceState(null, '', window.location.pathname)
      }
    }).catch(() => {})
  }, [aoMudarCliente])

  async function cancelar() {
    setCancelando(true)
    setRecadoPlus(null)
    try {
      setAssinatura(await cancelarAssinatura())
      setConfirmarCancelar(false)
      setRecadoPlus({ tipo: 'ok', texto: 'Assinatura cancelada. Seu Plus continua até o fim do que você já pagou.' })
    } catch {
      setRecadoPlus({ tipo: 'erro', texto: 'Não deu para cancelar agora. Tente de novo em instantes.' })
    } finally {
      setCancelando(false)
    }
  }

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

  async function alternarEmailDiario() {
    if (!cliente) return
    const ligar = !cliente.emailDiario
    setRecadoEmail(null)
    setSalvandoEmail(true)
    try {
      aoMudarCliente(await mudarEmailDiario(ligar))
      setRecadoEmail(ligar
        ? { tipo: 'ok', texto: 'Ligado. Amanhã de manhã chega o primeiro.' }
        : { tipo: 'ok', texto: 'Desligado. Você não recebe mais.' })
    } catch {
      setRecadoEmail({ tipo: 'erro', texto: 'Não deu para salvar agora. Tente de novo.' })
    } finally {
      setSalvandoEmail(false)
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
            <span className="grupo-texto">
              <small>Plano</small>
              <strong>{cliente?.plus ? 'Plus' : 'Grátis'}</strong>
              {cliente?.plus && cliente.plusAte && (
                <small>Até {diaMes(cliente.plusAte)} · faltam {diasAte(cliente.plusAte)} dias</small>
              )}
            </span>
            <button type="button" className="grupo-acao botao-texto" onClick={aoVerPlus}>
              {cliente?.plus ? 'Ver o Plus' : 'Conhecer o Plus'}
            </button>
          </div>
          {assinatura && assinatura.status !== 'NENHUMA' && assinatura.status !== 'PENDENTE' && (
            <div className="grupo-linha conta-linha-simples">
              <span className="grupo-texto">
                <small>Assinatura</small>
                <strong>
                  {assinatura.status === 'ATIVA'
                    ? `${assinatura.periodicidade === 'ANUAL' ? 'R$ 59,90/ano' : 'R$ 9,90/mês'}`
                    : assinatura.status === 'PAUSADA' ? 'Pausada' : 'Cancelada'}
                </strong>
                {assinatura.status === 'ATIVA' && assinatura.proximaCobranca && (
                  <small>Próxima cobrança em {diaMes(assinatura.proximaCobranca)}</small>
                )}
              </span>
              {assinatura.status === 'ATIVA' && !confirmarCancelar && (
                <button type="button" className="grupo-acao botao-texto" onClick={() => setConfirmarCancelar(true)}>Cancelar</button>
              )}
            </div>
          )}
          {confirmarCancelar && (
            <div className="grupo-painel">
              <p className="texto-2">Seu Plus continua até o fim do que você já pagou. Depois volta pro grátis, sem perder nenhum perfume.</p>
              <div className="colecao-confirma">
                <span>Cancelar a assinatura?</span>
                <button type="button" className="botao botao-contorno botao-mini" onClick={() => setConfirmarCancelar(false)}>Não</button>
                <button type="button" className="botao botao-perigo botao-mini" disabled={cancelando} onClick={cancelar}>
                  {cancelando ? 'Cancelando…' : 'Sim, cancelar'}
                </button>
              </div>
            </div>
          )}
          {recadoPlus && (
            <p className={recadoPlus.tipo === 'ok' ? 'conta-aviso' : 'conta-erro'} role="status" style={{ padding: '0 0 14px' }}>
              {recadoPlus.texto}
            </p>
          )}
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
        <h3 className="grupo-titulo">E-mail da manhã</h3>
        <div className="grupo">
          <div className="grupo-linha conta-linha-simples">
            <span className="grupo-texto" id="email-diario-texto">
              <strong>Sugestão do dia por e-mail</strong>
              <small>
                {cliente?.cidade
                  ? `Todo dia de manhã: o perfume da sua coleção pra manhã, a tarde e a noite, com a previsão de ${cliente.cidade}.`
                  : 'Todo dia de manhã: o perfume da sua coleção pra manhã, a tarde e a noite, com a previsão de onde você abriu a odri por último.'}
              </small>
            </span>
            <button
              type="button" role="switch" className="interruptor"
              aria-checked={!!cliente?.emailDiario} aria-labelledby="email-diario-texto"
              disabled={salvandoEmail || !cliente} onClick={alternarEmailDiario}
            >
              <span className="interruptor-bolinha" />
            </button>
          </div>
          {recadoEmail && (
            <p className={recadoEmail.tipo === 'ok' ? 'conta-aviso' : 'conta-erro'} role="status" style={{ paddingBottom: 14 }}>
              {recadoEmail.texto}
            </p>
          )}
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

/* ---------- Plus: janela por cima do app, com X pra fechar ---------- */

function JanelaPlus({ cliente, aoFechar, aoMudarCliente }: {
  cliente: Cliente | null
  aoFechar: () => void
  aoMudarCliente: (c: Cliente) => void
}) {
  const botaoFechar = useRef<HTMLButtonElement>(null)
  const [comecando, setComecando] = useState(false)
  const [comecou, setComecou] = useState(false)
  const [erro, setErro] = useState('')
  const plus = !!cliente?.plus
  const podeTestar = !!cliente && !plus && !cliente.testeUsado

  useEffect(() => { registrarEvento('PLUS_ABRIU') }, [])

  // Assinatura no Mercado Pago (só pra quem já passou do "testar")
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [indo, setIndo] = useState<'MENSAL' | 'ANUAL' | null>(null)
  useEffect(() => {
    if (cliente) minhaAssinatura().then(setAssinatura).catch(() => {})
  }, [cliente])
  const assina = assinatura?.status === 'ATIVA'

  async function assinar(periodicidade: 'MENSAL' | 'ANUAL') {
    setErro('')
    setIndo(periodicidade)
    try {
      const { url } = await assinarPlus(periodicidade)
      window.location.href = url // paga no Mercado Pago e volta pra Conta
    } catch {
      setErro('Não deu para abrir o pagamento agora. Tente de novo em instantes.')
      setIndo(null)
    }
  }

  async function testar() {
    setErro('')
    setComecando(true)
    try {
      const c = await comecarTestePlus()
      aoMudarCliente(c)
      setComecou(true)
      registrarEvento('PLUS_TESTE')
    } catch {
      setErro('Não deu para começar agora. Tente de novo em instantes.')
    } finally {
      setComecando(false)
    }
  }

  // Esc fecha; a página de trás não rola enquanto a janela está aberta
  useEffect(() => {
    botaoFechar.current?.focus()
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar() }
    document.addEventListener('keydown', tecla)
    const rolagem = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = rolagem
    }
  }, [aoFechar])

  return (
    <div className="janela-fundo" onClick={aoFechar}>
      <section
        className="janela" role="dialog" aria-modal="true" aria-labelledby="titulo-plus"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="janela-topo">
          <h2 id="titulo-plus" className="painel-titulo-pagina">
            {comecou ? <>Plus <span className="serif destaque">liberado.</span></> : <>Seu plano e o <span className="serif destaque">Plus</span></>}
          </h2>
          <button ref={botaoFechar} type="button" className="janela-fechar" onClick={aoFechar} aria-label="Fechar">
            <Fechar tamanho={20} />
          </button>
        </div>

      {comecou ? (
        <div className="plus-pronto">
          <span className="plus-pronto-check" aria-hidden="true"><Check tamanho={30} /></span>
          <p className="plus-pronto-titulo">Seus 14 dias grátis começaram</p>
          <p className="texto-2">
            Vale até <strong>{cliente?.plusAte ? diaMes(cliente.plusAte) : '…'}</strong>. Não pedimos cartão:
            quando acabar, você escolhe se quer assinar.
          </p>
          <ul className="lista-check">
            <li><Check tamanho={22} />Escolha a ocasião lá no Hoje, em “Pra onde você vai hoje?”</li>
            <li><Check tamanho={22} />Sua coleção agora não tem limite</li>
          </ul>
          <button type="button" className="botao botao-destaque botao-largo" onClick={aoFechar}>
            Escolher a ocasião de hoje <Seta />
          </button>
        </div>
      ) : (
      <div className="grade-planos">
        <div className="plano plano-principal">
          <div className="plano-topo">
            <h3>Grátis</h3>
            {!cliente?.plus && <span className="selo selo-destaque">Seu plano</span>}
          </div>
          <p className="preco">R$ 0</p>
          <ul className="lista-check">
            <li><Check tamanho={22} />Perfume do dia de manhã, de tarde e de noite</li>
            <li><Check tamanho={22} />Clima real da sua cidade, com aviso de chuva</li>
            <li><Check tamanho={22} />Sugestão do dia por e-mail</li>
            <li><Check tamanho={22} />Até {LIMITE_GRATIS} perfumes na coleção</li>
          </ul>
        </div>

        <div className="plano plano-plus">
          <div className="plano-topo">
            <h3>odri Plus</h3>
            <span className="selo selo-destaque">{plus ? 'Seu plano' : 'Plus'}</span>
          </div>
          <p className="preco">R$ 9,90<span className="preco-detalhe">/mês ou R$ 59,90/ano</span></p>
          <ul className="lista-check">
            <li><Check tamanho={22} />Sugestão pela ocasião: escolha onde vai e a odri ajusta</li>
            <li><Check tamanho={22} />Coleção sem limite</li>
            <li><Check tamanho={22} />Tudo do grátis</li>
          </ul>
          <ul className="ocasioes" aria-label="Ocasiões do Plus">
            {OCASIOES_PLUS.map((o) => <li key={o}>{!plus && <Cadeado />}{o}</li>)}
          </ul>
          <p className="nota">Em breve: aviso de manhã no celular com o perfume do dia.</p>

          {plus && cliente?.plusAte && (
            <p className="plus-ate">Seu Plus vale até <strong>{diaMes(cliente.plusAte)}</strong> · faltam {diasAte(cliente.plusAte)} dias</p>
          )}
          {assina && assinatura && (
            <p className="plus-ate">
              Você assina o Plus ({assinatura.periodicidade === 'ANUAL' ? 'anual' : 'mensal'})
              {assinatura.proximaCobranca && <> · próxima cobrança em <strong>{diaMes(assinatura.proximaCobranca)}</strong></>}
            </p>
          )}
          {cliente && !assina && (
            <div className="plus-assinar">
              <button type="button" className="botao botao-destaque botao-largo" disabled={indo !== null} onClick={() => assinar('MENSAL')}>
                {indo === 'MENSAL' ? 'Abrindo o Mercado Pago…' : 'Assinar por R$ 9,90/mês'}
              </button>
              <button type="button" className="botao botao-contorno botao-largo" disabled={indo !== null} onClick={() => assinar('ANUAL')}>
                {indo === 'ANUAL' ? 'Abrindo o Mercado Pago…' : 'R$ 59,90/ano · sai R$ 4,99 por mês'}
              </button>
              <p className="nota plus-sem-cartao">
                Cobra na hora, pelo Mercado Pago. Cancele quando quiser, na sua conta.
                Ao assinar, você aceita os <Link to="/termos" onClick={aoFechar}>Termos</Link>.
              </p>
              <PagarPix aoMudarCliente={aoMudarCliente} aoFechar={aoFechar} />
              {podeTestar && (
                <div className="plus-teste">
                  <span>Quer conhecer antes?</span>
                  <button type="button" className="plus-teste-botao" disabled={comecando} onClick={testar}>
                    {comecando ? 'Liberando…' : 'Testar 14 dias grátis, sem cartão'}
                  </button>
                </div>
              )}
            </div>
          )}
          {erro && <p className="conta-erro" role="alert">{erro}</p>}
        </div>
      </div>
      )}
      </section>
    </div>
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
