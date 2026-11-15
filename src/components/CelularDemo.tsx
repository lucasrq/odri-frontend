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
import Frasco from './Frasco'
import ReguaDia, { POS_PERIODO } from './ReguaDia'
import { Fechar, Local, Trocar } from './Icones'

export interface CidadeExemplo {
  nome: string
  graus: number
}

// Coleção de exemplo com perfumes reais (a ordem desempata a sugestão)
const COLECAO: PerfumeExemplo[] = [
  { nome: 'Kaiak', marca: 'Natura', chave: 'FRESCO', familia: 'Fresco', intensidade: 'LEVE', clima: 'CALOR' },
  { nome: 'Malbec', marca: 'O Boticário', chave: 'AMADEIRADO', familia: 'Amadeirado', intensidade: 'FORTE', clima: 'FRIO' },
  { nome: 'Egeo Dolce', marca: 'O Boticário', chave: 'DOCE', familia: 'Doce', intensidade: 'MEDIA', clima: 'TODOS' },
  { nome: 'CK One', marca: 'Calvin Klein', chave: 'CITRICO', familia: 'Cítrico', intensidade: 'LEVE', clima: 'TODOS' },
]

// Mini vitrine da aba Loja
const VITRINE = [
  { nome: 'Acqua di Giò', marca: 'Giorgio Armani', chave: 'FRESCO', intensidade: 'MEDIA', cifras: 3 },
  { nome: 'Yara', marca: 'Lattafa', chave: 'DOCE', intensidade: 'MEDIA', cifras: 2 },
  { nome: 'Floratta Blue', marca: 'O Boticário', chave: 'FLORAL', intensidade: 'LEVE', cifras: 1 },
  { nome: 'Bleu de Chanel', marca: 'Chanel', chave: 'AMADEIRADO', intensidade: 'MEDIA', cifras: 3 },
]

const SAUDACOES = ['Bom dia!', 'Boa tarde!', 'Boa noite!']
const TEMPO_NOME = { CALOR: 'Calor', FRIO: 'Frio', AMENO: 'Ameno' }
const ABAS = ['Hoje', 'Coleção', 'Loja'] as const

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
  const [genero, setGenero] = useState(0)

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

                {/* Régua do dia: toque em Manhã, Tarde ou Noite */}
                <div className="cel-dia">
                  <p className="cel-dia-clima">
                    <strong key={cidade.graus}>{cidade.graus} °C</strong>
                    <span className="cel-pequeno">{TEMPO_NOME[tempoDa(cidade.graus)]} · agora</span>
                  </p>
                  <ReguaDia
                    rotuloGrupo="Hora do dia"
                    aoEscolher={(i) => mudarPeriodo(i as Periodo)}
                    marcas={PERIODOS.map((nome, i) => ({
                      pos: POS_PERIODO[i], rotulo: nome, ponto: i === periodo, ativo: i === periodo,
                    }))}
                  />
                </div>

                {/* key: o cartão "respira" a cada sugestão nova */}
                <div className="cel-sugestao" key={`${escolhido.nome}-${periodo}-${cidade.nome}`}>
                  <p className="cel-rotulo"><span className="bolinha" />Melhor pra hoje</p>
                  <div className="cel-sugestao-topo">
                    <div>
                      <p className="cel-perfume">{escolhido.nome}</p>
                      <p className="cel-marca">
                        {escolhido.marca} · {escolhido.familia} · {INTENSIDADE_CURTA[escolhido.intensidade]}
                      </p>
                    </div>
                    <Frasco familia={escolhido.chave} intensidade={escolhido.intensidade} tamanho={40} />
                  </div>
                  <p className="cel-motivo">{motivo(escolhido, cidade.graus, periodo)}</p>
                </div>

                <div className="grupo cel-grupo">
                  <button type="button" className="grupo-linha grupo-botao toque" onClick={() => setTrocado(!trocado)}>
                    <span className="grupo-icone grupo-icone-frasco" aria-hidden="true">
                      <Frasco familia={segundo.chave} intensidade={segundo.intensidade} tamanho={18} />
                    </span>
                    <span className="grupo-texto">
                      <strong>{segundo.nome}</strong>
                      <small>Outra opção · toque pra trocar</small>
                    </span>
                    <Trocar />
                  </button>
                  <div className="grupo-linha">
                    <span className="grupo-icone" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2.5" width="14" height="19" rx="3" /><path d="M9 8h6M9 12h6" />
                      </svg>
                    </span>
                    <span className="grupo-texto">
                      <strong>Poste no seu story</strong>
                      <small>"Hoje eu vou de {escolhido.nome}."</small>
                    </span>
                  </div>
                </div>
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
                    <Frasco familia={p.chave} intensidade={p.intensidade} tamanho={22} />
                    <div className="cel-item-texto">
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
                <p className="cel-titulo">Loja</p>
                <div className="cel-busca">Buscar por nome ou marca</div>
                <div role="group" aria-label="Gênero" className="cel-generos">
                  {['Todos', 'Masculino', 'Feminino'].map((g, i) => (
                    <button
                      key={g} type="button" className={`toque ${i === genero ? 'ativo' : ''}`}
                      aria-pressed={i === genero} onClick={() => setGenero(i)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="cel-vitrine">
                  {VITRINE.map((v) => (
                    <div key={v.nome} className="cel-vitrine-item">
                      <div className={`cel-vitrine-frasco fundo-${v.chave.toLowerCase()}`}>
                        <Frasco familia={v.chave} intensidade={v.intensidade} tamanho={30} />
                      </div>
                      <p className="cel-item-nome">{v.nome}</p>
                      <p className="cel-pequeno">{v.marca}</p>
                      <span className="cel-cifras" aria-label={`Preço ${v.cifras} de 3`}>
                        {[1, 2, 3].map((n) => <i key={n} className={n <= v.cifras ? 'cheia' : ''} />)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="cel-pequeno cel-centro">Links de parceiros</p>
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
