import { useEffect, useState } from 'react'
import { baixarAdesivo, CorAdesivo, nomeDoArquivo } from '../lib/adesivo'

type Imagens = Record<CorAdesivo, { blob: Blob; url: string }>

/**
 * Adesivo pro story, com fundo transparente (branco pra foto escura, preto pra foto clara).
 * Fechado: uma linha com o botão. Aberto: as duas versões e os botões de baixar.
 * "gerar" desenha a imagem; "chave" muda quando o conteúdo muda (aí desenha de novo).
 */
export default function AdesivoStory({ titulo, texto, nomeArquivo, descricao, chave, gerar }: {
  titulo: string
  texto: string
  nomeArquivo: string
  descricao: string
  chave: string
  gerar: (cor: CorAdesivo) => Promise<Blob>
}) {
  const [aberto, setAberto] = useState(false)
  const [imagens, setImagens] = useState<Imagens | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!aberto) return
    let ativo = true
    let urls: string[] = []
    setErro(false)
    Promise.all((['branco', 'preto'] as const).map((cor) => gerar(cor)))
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
    // "gerar" muda a cada render; "chave" é quem diz se o conteúdo mudou
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, chave])

  if (!aberto) {
    return (
      <section className="painel-bloco adesivo">
        <div className="adesivo-linha">
          <span>
            <strong>{titulo}</strong>
            <span className="apagado">{texto}</span>
          </span>
          <button type="button" className="botao botao-escuro botao-mini" onClick={() => setAberto(true)}>
            Criar adesivo
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="painel-bloco adesivo" aria-label={titulo}>
      <div className="adesivo-linha">
        <strong>{titulo}</strong>
        <button type="button" className="adesivo-fechar" onClick={() => setAberto(false)}>Fechar</button>
      </div>

      {erro && <p className="conta-erro" role="alert">Não deu para criar o adesivo agora. Tente de novo.</p>}

      <div className="adesivo-opcoes">
        {(['branco', 'preto'] as const).map((cor) => (
          <div key={cor} className="adesivo-opcao">
            <div className={`adesivo-fundo adesivo-fundo-${cor}`}>
              {imagens
                ? <img src={imagens[cor].url} alt={`Adesivo ${cor}: ${descricao}`} />
                : <span className="adesivo-carregando">Criando…</span>}
            </div>
            <button
              type="button" className="botao botao-contorno botao-mini" disabled={!imagens}
              onClick={() => imagens && baixarAdesivo(imagens[cor].blob, nomeDoArquivo(nomeArquivo, cor))}
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
