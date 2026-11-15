import { useEffect, useState } from 'react'
import {
  baixarAdesivo, CorSelo, DadosDia, gerarSelo, gerarStoryPronto, nomeArquivoDia, salvarNoAparelho,
} from '../lib/adesivo'
import { registrarEvento } from '../lib/eventos'

type Imagem = { blob: Blob; url: string }
type Aba = 'story' | 'selo'

/**
 * Adesivo do dia, na tela Hoje (linha dentro do grupo "Pra hoje também").
 * Aberto: duas formas de postar.
 *  - Story pronto: imagem inteira do story, vai direto pro Instagram pelo "Compartilhar".
 *  - Selo: cartão creme ou preto, salvo na galeria pra pôr em cima da sua foto.
 */
export default function AdesivoDia({ dados }: { dados: DadosDia }) {
  const [aberto, setAberto] = useState(false)
  const [aba, setAba] = useState<Aba>('story')
  const [cor, setCor] = useState<CorSelo>('creme')
  const [story, setStory] = useState<Imagem | null>(null)
  const [selos, setSelos] = useState<Record<CorSelo, Imagem> | null>(null)
  const [erro, setErro] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const chave = JSON.stringify(dados)

  useEffect(() => {
    if (!aberto) return
    let ativo = true
    const urls: string[] = []
    const imagem = (blob: Blob) => { const url = URL.createObjectURL(blob); urls.push(url); return { blob, url } }
    setErro(false)
    Promise.all([gerarStoryPronto(dados), gerarSelo(dados, 'creme'), gerarSelo(dados, 'preto')])
      .then(([s, creme, preto]) => {
        if (!ativo) return
        setStory(imagem(s))
        setSelos({ creme: imagem(creme), preto: imagem(preto) })
      })
      .catch(() => ativo && setErro(true))
    return () => {
      ativo = false
      urls.forEach((u) => URL.revokeObjectURL(u))
      setStory(null)
      setSelos(null)
    }
    // "dados" chega como objeto novo a cada render; "chave" diz se o conteúdo mudou
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, chave])

  if (!aberto) {
    return (
      <div className="grupo-linha">
        <span className="grupo-icone" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2.5" width="14" height="19" rx="3" /><path d="M9 8h6M9 12h6" />
          </svg>
        </span>
        <span className="grupo-texto">
          <strong>Poste no seu story</strong>
          <small>"Hoje eu vou de {dados.perfume}."</small>
        </span>
        <button type="button" className="botao botao-escuro botao-mini" onClick={() => setAberto(true)}>
          Criar
        </button>
      </div>
    )
  }

  const postarStory = () => {
    if (!story) return
    registrarEvento('ADESIVO_DIA', { detalhe: 'story' })
    baixarAdesivo(story.blob, nomeArquivoDia(dados.perfume, 'story'))
  }
  const salvarSelo = () => {
    if (!selos) return
    registrarEvento('ADESIVO_DIA', { detalhe: `selo-${cor}` })
    salvarNoAparelho(selos[cor].blob, nomeArquivoDia(dados.perfume, `selo-${cor}`))
    setSalvo(true)
  }

  return (
    <section className="grupo-painel adesivo-dia" aria-label="Poste no seu story">
      <div className="adesivo-linha">
        <strong>Poste no seu story</strong>
        <button type="button" className="adesivo-fechar" onClick={() => setAberto(false)}>Fechar</button>
      </div>

      <div className="adesivo-abas" role="tablist" aria-label="Jeito de postar">
        <button type="button" role="tab" aria-selected={aba === 'story'} onClick={() => setAba('story')}>Story pronto</button>
        <button type="button" role="tab" aria-selected={aba === 'selo'} onClick={() => { setAba('selo'); setSalvo(false) }}>Na minha foto</button>
      </div>

      {erro && <p className="conta-erro" role="alert">Não deu para criar a imagem agora. Tente de novo.</p>}

      {aba === 'story' ? (
        <>
          <div className="adesivo-previa adesivo-previa-story">
            {story ? <img src={story.url} alt={`Story: hoje eu vou de ${dados.perfume}`} /> : <span className="adesivo-carregando">Criando…</span>}
          </div>
          <button type="button" className="botao botao-destaque botao-campo" disabled={!story} onClick={postarStory}>
            Postar no story
          </button>
          <p className="painel-dica">Toque em Postar, escolha <strong>Instagram</strong> e depois <strong>Stories</strong>.</p>
        </>
      ) : (
        <>
          <div className="adesivo-cores" role="group" aria-label="Cor do selo">
            {(['creme', 'preto'] as const).map((c) => (
              <button key={c} type="button" aria-pressed={cor === c} onClick={() => { setCor(c); setSalvo(false) }}>
                {c === 'creme' ? 'Creme' : 'Preto'}
              </button>
            ))}
          </div>
          <div className="adesivo-previa adesivo-previa-selo">
            {selos ? <img src={selos[cor].url} alt={`Selo ${cor}: hoje eu vou de ${dados.perfume}`} /> : <span className="adesivo-carregando">Criando…</span>}
          </div>
          <button type="button" className="botao botao-escuro botao-campo" disabled={!selos} onClick={salvarSelo}>
            Salvar o selo
          </button>
          <p className="painel-dica" role={salvo ? 'status' : undefined}>
            {salvo && <><strong>Salvo na galeria.</strong> </>}
            No Instagram, abra sua foto no story, toque em <strong>adesivos</strong>, escolha o de <strong>foto da galeria</strong> e pegue o selo.
          </p>
        </>
      )}
    </section>
  )
}
