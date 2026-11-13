import { useEffect, useState } from 'react'
import { baixarAdesivo, CorAdesivo, gerarAdesivo, nomeDoArquivo } from '../lib/adesivo'

type Imagens = Record<CorAdesivo, { blob: Blob; url: string }>

/**
 * "Hoje eu vou de <perfume>." pro story, com fundo transparente.
 * Fechado: uma linha com o botão. Aberto: as duas versões e os botões de baixar.
 */
export default function AdesivoStory({ perfume, temperatura, local }: {
  perfume: string
  temperatura: number | null
  local: string | null
}) {
  const [aberto, setAberto] = useState(false)
  const [imagens, setImagens] = useState<Imagens | null>(null)
  const [erro, setErro] = useState(false)

  const linha = temperatura !== null && local ? `${Math.round(temperatura)} °C em ${local}`
    : local ? `Em ${local}` : ''

  // Só desenha quando abre (e de novo se o perfume do dia mudar)
  useEffect(() => {
    if (!aberto) return
    let ativo = true
    let urls: string[] = []
    setErro(false)
    Promise.all((['branco', 'preto'] as const).map((cor) => gerarAdesivo(perfume, linha, cor)))
      .then(([branco, preto]) => {
        if (!ativo) return
        const novo = {
          branco: { blob: branco, url: URL.createObjectURL(branco) },
          preto: { blob: preto, url: URL.createObjectURL(preto) },
        }
        urls = [novo.branco.url, novo.preto.url]
        setImagens(novo)
      })
      .catch(() => ativo && setErro(true))
    return () => {
      ativo = false
      urls.forEach((u) => URL.revokeObjectURL(u))
      setImagens(null)
    }
  }, [aberto, perfume, linha])

  if (!aberto) {
    return (
      <section className="painel-bloco adesivo">
        <div className="adesivo-linha">
          <span>
            <strong>Poste no seu story</strong>
            <span className="apagado">Um adesivo com o perfume de hoje, pra colocar na sua foto.</span>
          </span>
          <button type="button" className="botao botao-escuro botao-mini" onClick={() => setAberto(true)}>
            Criar adesivo
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="painel-bloco adesivo" aria-label="Adesivo pro story">
      <div className="adesivo-linha">
        <strong>Adesivo pro story</strong>
        <button type="button" className="adesivo-fechar" onClick={() => setAberto(false)}>Fechar</button>
      </div>

      {erro && <p className="conta-erro" role="alert">Não deu para criar o adesivo agora. Tente de novo.</p>}

      <div className="adesivo-opcoes">
        {(['branco', 'preto'] as const).map((cor) => (
          <div key={cor} className="adesivo-opcao">
            <div className={`adesivo-fundo adesivo-fundo-${cor}`}>
              {imagens
                ? <img src={imagens[cor].url} alt={`Adesivo ${cor}: Hoje eu vou de ${perfume}. ${linha}`} />
                : <span className="adesivo-carregando">Criando…</span>}
            </div>
            <button
              type="button" className="botao botao-contorno botao-mini" disabled={!imagens}
              onClick={() => imagens && baixarAdesivo(imagens[cor].blob, nomeDoArquivo(perfume, cor))}
            >
              Baixar {cor}
            </button>
          </div>
        ))}
      </div>

      <p className="painel-dica">
        Foto escura: use o branco. Foto clara: o preto. No story, toque em adesivos, escolha a foto da galeria e posicione.
      </p>
    </section>
  )
}
