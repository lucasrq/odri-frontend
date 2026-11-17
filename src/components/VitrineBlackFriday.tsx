import { useState } from 'react'
import { registrarEvento } from '../lib/eventos'
import { FaixaPreco, NOME_FAIXA, Oferta } from '../lib/loja'
import Frasco from './Frasco'
import { Seta } from './Icones'

/**
 * Vitrine da Black Friday na Loja. Aparece sozinha de 20/11 a 01/12 e some depois.
 * Pra ver antes (teste): abrir a Loja com ?bf=1 no endereço.
 * Os perfumes vêm da lista da Loja que já carregou (respeita o filtro de gênero):
 * pra cada faixa de preço, pega o primeiro da lista abaixo que está na Loja e a pessoa ainda não tem.
 */
const INICIO = new Date(2026, 10, 20)          // 20/11/2026 00:00
const BLACK_FRIDAY = new Date(2026, 10, 27)    // 27/11/2026
const FIM = new Date(2026, 11, 2)              // some em 02/12/2026 00:00

type Aba = 'procurados' | 'presente'
const ABAS: [Aba, string][] = [['procurados', 'Mais procurados'], ['presente', 'Pra presentear']]

/** Escolha da odri, por faixa de preço. A ordem importa: masculino e feminino misturados. */
const ESCOLHAS: Record<Aba, Record<FaixaPreco, string[]>> = {
  procurados: {
    ATE_150: ['Kaiak', 'Floratta Rose', 'Egeo Blue', 'Egeo Dolce', '300 Km/h', 'Kriska'],
    DE_150_A_400: ['Malbec', 'Lily', 'Club de Nuit Intense Man', 'Coffee Woman', 'Asad', 'Khamrah'],
    ACIMA_400: ['Sauvage', 'La Vie Est Belle', 'Bleu de Chanel', 'Good Girl', '212 VIP Black', 'Light Blue'],
  },
  presente: {
    ATE_150: ['Egeo Dolce', 'Kaiak Oceano', 'Floratta Blue', 'Egeo Original', 'Kiss Me', 'Lord'],
    DE_150_A_400: ['Malbec Gold', 'Lily', 'Essencial', 'Liz', 'Homem Essence', 'Club de Nuit Woman'],
    ACIMA_400: ['Coco Mademoiselle', 'Acqua di Giò', "J'adore", 'Invictus', 'Miss Dior', 'Y'],
  },
}
const FAIXAS: FaixaPreco[] = ['ATE_150', 'DE_150_A_400', 'ACIMA_400']

const DIA = 24 * 60 * 60 * 1000

/** A vitrine está no ar hoje? (ou foi pedida com ?bf=1) */
export function vitrineNoAr(agora = new Date()) {
  if (new URLSearchParams(window.location.search).get('bf') === '1') return true
  return agora >= INICIO && agora < FIM
}

/** "Black Friday em 3 dias" → "Hoje é Black Friday" → "Últimos dias · até 01/12" */
function contagem(agora = new Date()) {
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const dias = Math.round((BLACK_FRIDAY.getTime() - hoje.getTime()) / DIA)
  if (dias > 1) return `Black Friday em ${dias} dias · até 01/12`
  if (dias === 1) return 'Black Friday é amanhã · até 01/12'
  if (dias === 0) return 'Hoje é Black Friday'
  return 'Últimos dias · até 01/12'
}

function escolher(itens: Oferta[], aba: Aba) {
  const porNome = new Map(itens.map((o) => [o.nome.toLowerCase(), o]))
  return FAIXAS.map((faixa) =>
    ESCOLHAS[aba][faixa]
      .map((nome) => porNome.get(nome.toLowerCase()))
      .find((o) => o && o.faixa === faixa && !o.naColecao),
  ).filter((o): o is Oferta => !!o)
}

export default function VitrineBlackFriday({ itens }: { itens: Oferta[] }) {
  const [aba, setAba] = useState<Aba>('procurados')
  const ofertas = escolher(itens, aba)
  if (escolher(itens, 'procurados').length === 0 && escolher(itens, 'presente').length === 0) return null

  return (
    <section className="vitrine-bf" aria-labelledby="titulo-bf">
      <div className="vitrine-bf-topo">
        <span className="vitrine-bf-selo">Black Friday</span>
        <span className="vitrine-bf-conta">{contagem()}</span>
      </div>
      <h3 id="titulo-bf">Os perfumes que valem a pena, na semana dos descontos.</h3>
      <p className="vitrine-bf-sub">Um de cada faixa de preço. O desconto é do Mercado Livre e muda por vendedor.</p>

      <div className="vitrine-bf-abas" role="group" aria-label="Escolher vitrine">
        {ABAS.map(([valor, nome]) => (
          <button key={valor} type="button" aria-pressed={aba === valor} onClick={() => setAba(valor)}>
            {nome}
          </button>
        ))}
      </div>

      {ofertas.length === 0 ? (
        <p className="vitrine-bf-sub">Nada novo por aqui pra você. Veja a outra aba.</p>
      ) : (
        <ul className="vitrine-bf-trilho">
          {ofertas.map((o) => (
            <li key={o.id}>
              <a
                className={`vitrine-bf-card fundo-${o.familia.toLowerCase()}`}
                href={o.link} target="_blank" rel="noopener noreferrer sponsored"
                onClick={() => registrarEvento('CLIQUE_LOJA', { perfumeId: o.id, detalhe: `black-friday-${aba}` })}
                aria-label={`${o.nome}, ${o.marca}, ${NOME_FAIXA[o.faixa].preco}. Ver ofertas no Mercado Livre`}
              >
                <Frasco familia={o.familia} intensidade={o.intensidade} tamanho={40} />
                <strong>{o.nome}</strong>
                <small>{o.marca}</small>
                <span className="vitrine-bf-preco">{NOME_FAIXA[o.faixa].preco}</span>
                <span className="vitrine-bf-ver">Ver ofertas <Seta tamanho={14} /></span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="vitrine-bf-aviso">Links de afiliado: a odri pode ganhar uma comissão, sem custo extra pra você.</p>
    </section>
  )
}
