import { useState } from 'react'
import {
  INTENSIDADE_CURTA,
  PERIODOS,
  motivo,
  ranquear,
  tempoDa,
  type Periodo,
  type PerfumeExemplo,
} from '../lib/sugestao'
import { Fechar, Local, Trocar } from './Icones'

export interface CidadeExemplo {
  nome: string
  graus: number
}

// Perfumes de exemplo (nomes genéricos, sem marca)
const COLECAO: PerfumeExemplo[] = [
  { nome: 'Cítrico Fresco', familia: 'Cítrico', intensidade: 'LEVE', clima: 'CALOR' },
  { nome: 'Floral Suave', familia: 'Floral', intensidade: 'MEDIA', clima: 'TODOS' },
  { nome: 'Amadeirado Noturno', familia: 'Amadeirado', intensidade: 'FORTE', clima: 'FRIO' },
  { nome: 'Aquático Leve', familia: 'Fresco', intensidade: 'LEVE', clima: 'TODOS' },
]

const SAUDACOES = ['Bom dia!', 'Boa tarde!', 'Boa noite!']
const TEMPO_NOME = { CALOR: 'Calor', FRIO: 'Frio', AMENO: 'Ameno' }
const ABAS = ['Hoje', 'Coleção', 'Conta'] as const

interface Props {
  cidade: CidadeExemplo
  periodo: Periodo
  onTrocarCidade: () => void
  onPeriodo: (p: Periodo) => void
}

/**
 * Celular da página inicial: não é o app de verdade,
 * mas os botões respondem e a sugestão segue a regra real.
 */
export default function CelularDemo({ cidade, periodo, onTrocarCidade, onPeriodo }: Props) {
  const [aba, setAba] = useState(0)
  const [trocado, setTrocado] = useState(false)
  const [cidadeFixa, setCidadeFixa] = useState(false)

  const ranking = ranquear(COLECAO, cidade.graus, periodo)
  const [escolhido, segundo] = trocado ? [ranking[1], ranking[0]] : [ranking[0], ranking[1]]

  // Ao mudar cidade ou hora, volta pra sugestão principal
  const mudarPeriodo = (p: Periodo) => { setTrocado(false); onPeriodo(p) }
  const mudarCidade = () => { setTrocado(false); onTrocarCidade() }

  return (
    <div className="celular-area">
      <div className="celular">
        <div className="celular-tela">
          <div className="celular-conteudo" key={aba}>
            {aba === 0 && (
              <>
                <div className="cel-cabecalho">
                  <div>
                    <p className="cel-pequeno">Exemplo</p>
                    <p className="cel-titulo">{SAUDACOES[periodo]}</p>
                  </div>
                  <button type="button" className="cel-chip toque" onClick={mudarCidade} aria-label={`Cidade do exemplo: ${cidade.nome}. Trocar`}>
                    <Local /> {cidade.nome}
                  </button>
                </div>

                <div role="group" aria-label="Hora do dia" className="cel-segmentos">
                  {PERIODOS.map((nome, i) => (
                    <button
                      key={nome}
                      type="button"
                      className={`toque ${i === periodo ? 'ativo' : ''}`}
                      aria-pressed={i === periodo}
                      onClick={() => mudarPeriodo(i as Periodo)}
                    >
                      {nome}
                    </button>
                  ))}
                </div>

                <div className="cel-dados">
                  <div className="cel-caixa">
                    <p className="cel-pequeno">Agora</p>
                    <p className="cel-numero" key={cidade.graus}>{cidade.graus} °C</p>
                  </div>
                  <div className="cel-caixa">
                    <p className="cel-pequeno">Tempo</p>
                    <p className="cel-numero">{TEMPO_NOME[tempoDa(cidade.graus)]}</p>
                  </div>
                </div>

                {/* key: o cartão "respira" a cada sugestão nova */}
                <div className="cel-sugestao" key={`${escolhido.nome}-${periodo}-${cidade.nome}`}>
                  <p className="cel-rotulo"><span className="bolinha" />Perfume de hoje</p>
                  <p className="cel-perfume">{escolhido.nome}</p>
                  <p className="cel-motivo">{motivo(escolhido, cidade.graus, periodo)}</p>
                  <div className="cel-tags">
                    <span>{escolhido.familia}</span>
                    <span>{INTENSIDADE_CURTA[escolhido.intensidade]}</span>
                  </div>
                </div>

                <button type="button" className="cel-outra toque" onClick={() => setTrocado(!trocado)}>
                  <span><span className="cel-apagado">Outra opção: </span><strong>{segundo.nome}</strong></span>
                  <Trocar />
                </button>
              </>
            )}

            {aba === 1 && (
              <>
                <div className="cel-linha-base">
                  <p className="cel-titulo">Seus perfumes</p>
                  <p className="cel-pequeno">4 de 8 no grátis</p>
                </div>
                {[...COLECAO].sort((a, b) => a.nome.localeCompare(b.nome)).map((p) => (
                  <div key={p.nome} className="cel-item">
                    <div>
                      <p className="cel-item-nome">{p.nome}</p>
                      <p className="cel-pequeno">{p.familia} · {INTENSIDADE_CURTA[p.intensidade]}</p>
                    </div>
                    <button type="button" className="cel-icone toque" aria-label={`Remover ${p.nome}`}><Fechar /></button>
                  </div>
                ))}
                <button type="button" className="cel-adicionar toque">+ Adicionar perfume</button>
                <p className="cel-pequeno cel-centro">Só digite o nome. Não achou? A gente cadastra em até 24h.</p>
              </>
            )}

            {aba === 2 && (
              <>
                <p className="cel-titulo">Sua conta</p>
                <p className="cel-secao">Onde você está</p>
                {[
                  { titulo: 'Automático', sub: 'Usa a localização do celular', fixa: false },
                  { titulo: 'Cidade fixa', sub: cidade.nome, fixa: true },
                ].map((op) => (
                  <button
                    key={op.titulo}
                    type="button"
                    className={`cel-opcao toque ${op.fixa === cidadeFixa ? 'ativo' : ''}`}
                    aria-pressed={op.fixa === cidadeFixa}
                    onClick={() => setCidadeFixa(op.fixa)}
                  >
                    <span><strong>{op.titulo}</strong><span className="cel-pequeno">{op.sub}</span></span>
                    <span className="cel-radio"><span /></span>
                  </button>
                ))}
                <p className="cel-secao">Plano</p>
                <div className="cel-item">
                  <strong>Grátis</strong>
                  <span className="selo selo-destaque">Plus em breve</span>
                </div>
              </>
            )}
          </div>

          <nav aria-label="Telas do app" className="cel-abas">
            {ABAS.map((nome, i) => (
              <button
                key={nome}
                type="button"
                className={`toque ${i === aba ? 'ativo' : ''}`}
                aria-current={i === aba ? 'page' : undefined}
                onClick={() => setAba(i)}
              >
                <span className="cel-aba-barra" />
                {nome}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <p className="celular-dica">Toque no celular: troque a cidade e a hora do dia.</p>
    </div>
  )
}
