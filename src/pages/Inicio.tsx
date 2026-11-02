import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import CelularDemo, { type CidadeExemplo } from '../components/CelularDemo'
import { Cadeado, Check, IconeApp, Logo, Mais, Seta } from '../components/Icones'
import Topo from '../components/Topo'
import type { Periodo } from '../lib/sugestao'
import { useRevela } from '../lib/useRevela'

const CIDADES: CidadeExemplo[] = [
  { nome: 'São Paulo', graus: 22 },
  { nome: 'Salvador', graus: 30 },
  { nome: 'Curitiba', graus: 13 },
]

const OCASIOES = ['Trabalho', 'Faculdade', 'Academia', 'Reunião', 'Encontro', 'Festa', 'Igreja', 'Praia']

const DUVIDAS = [
  { p: 'É grátis mesmo?', r: 'Sim. O plano grátis não tem prazo e não pede cartão. Você usa até 8 perfumes e recebe a sugestão de manhã, de tarde e de noite.' },
  { p: 'Preciso baixar algum app?', r: 'Não. A odri funciona no navegador do celular ou do computador. É só entrar no site e criar a conta.' },
  { p: 'Preciso entender de perfume?', r: 'Não. Você só digita o nome do perfume. Família, intensidade e clima ideal de cada um a gente já cadastrou.' },
  { p: 'E se o meu perfume não estiver na lista?', r: 'Digite o nome e a marca. A gente classifica em até 24 horas e ele aparece na sua coleção.' },
  { p: 'Por que vocês pedem a minha localização?', r: 'Só pra saber a temperatura da sua cidade. Se preferir, escolha a cidade numa lista e a odri não pede a localização.' },
  { p: 'O que vocês fazem com os meus dados?', r: 'Usamos só o necessário pra te dar a sugestão: nome, e-mail, cidade e coleção. Não vendemos nada a ninguém. Está tudo na política de privacidade, seguindo a LGPD.' },
]

// Atraso da animação de entrada (um elemento depois do outro)
const ordem = (i: number) => ({ '--i': i }) as CSSProperties

export default function Inicio() {
  const [indiceCidade, setIndiceCidade] = useState(0)
  const [periodo, setPeriodo] = useState<Periodo>(0)
  const cidade = CIDADES[indiceCidade]
  useRevela()

  // Marcador na barra de temperatura (8 °C a 36 °C)
  const posicao = Math.max(2, Math.min(98, ((cidade.graus - 8) / 28) * 100))

  return (
    <>
      <Topo />
      <main>
        {/* Abertura */}
        <section id="inicio" className="container hero">
          <div className="hero-texto">
            <p className="sobretitulo entra" style={ordem(0)}><span className="bolinha" />Grátis · funciona no navegador do celular</p>
            <h1 className="entra" style={ordem(1)}>Qual perfume eu uso <span className="serif destaque">hoje?</span></h1>
            <p className="hero-sub entra" style={ordem(2)}>
              A odri olha o clima da sua cidade e a hora do dia e escolhe, entre os perfumes que você já tem, o que combina agora. Com o motivo.
            </p>
            <div className="hero-botoes entra" style={ordem(3)}>
              <Link to="/criar-conta" className="botao botao-destaque botao-grande">Começar grátis <Seta /></Link>
              <a href="#como-funciona" className="botao botao-contorno botao-grande">Ver como funciona</a>
            </div>
            <ul className="garantias entra" style={ordem(4)}>
              <li><Check /> Sem cartão de crédito</li>
              <li><Check /> Não precisa entender de perfume</li>
              <li><Check /> Nada pra baixar</li>
            </ul>
          </div>
          <div className="hero-celular entra-celular">
            <CelularDemo
              cidade={cidade}
              periodo={periodo}
              onPeriodo={setPeriodo}
              onTrocarCidade={() => setIndiceCidade((indiceCidade + 1) % CIDADES.length)}
            />
          </div>
        </section>

        {/* O problema */}
        <section className="faixa-clara">
          <div className="container secao">
            <h2 className="revela titulo-secao estreito">O perfume certo na hora errada <span className="serif">estraga o dia.</span></h2>
            <div className="grade-3">
              {[
                { n: '31 °C', t: '+ perfume doce = enjoo', d: 'No calor, o doce fica pesado e incomoda quem está do lado.' },
                { n: '8h', t: '+ perfume forte = elevador lotado', d: 'De manhã e em lugar fechado, menos é mais.' },
                { n: '22h', t: '+ perfume leve = sumiu', d: 'À noite dá pra caprichar. Um leve demais ninguém sente.' },
              ].map((c) => (
                <div key={c.n} className="cartao cartao-fundo revela">
                  <p className="numero-grande">{c.n}</p>
                  <p className="cartao-titulo">{c.t}</p>
                  <p className="texto-2">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="container secao">
          <div className="cabeca-secao revela">
            <p className="sobretitulo">Como funciona</p>
            <h2 className="titulo-secao">Monte uma vez. <span className="serif">Use todo dia.</span></h2>
          </div>
          <div className="grade-3">
            <div className="cartao cartao-borda revela">
              <p className="passo-numero serif">1</p>
              <h3>Adicione o que você tem</h3>
              <p className="texto-2">Digite o nome do perfume e escolha na lista. Não achou o seu? Mande nome e marca que a gente cadastra.</p>
            </div>
            <div className="cartao cartao-borda revela">
              <p className="passo-numero serif">2</p>
              <h3>A odri olha lá fora</h3>
              <p className="texto-2">A temperatura da sua cidade agora e a hora do dia. Use a localização do celular ou escolha a cidade.</p>
            </div>
            <div className="cartao cartao-escuro revela">
              <p className="passo-numero serif">3</p>
              <h3>Você recebe o perfume do dia</h3>
              <p className="texto-invertido-2">Com o motivo da escolha e uma segunda opção, caso queira variar.</p>
            </div>
          </div>
        </section>

        {/* Clima */}
        <section className="faixa-escura">
          <div className="container secao">
            <div className="cabeca-secao revela">
              <p className="sobretitulo">Clima</p>
              <h2 className="titulo-secao">O mesmo perfume muda com o tempo <span className="serif">lá fora.</span></h2>
              <p className="texto-invertido-2">Calor faz o perfume espalhar mais. Frio segura. A odri usa a temperatura de verdade da sua cidade, atualizada ao longo do dia.</p>
            </div>
            <div className="revela">
              <div className="barra-clima" aria-hidden="true">
                <div className="barra-faixas"><span /><span /><span /></div>
                <span className="barra-marcador" style={{ left: `${posicao}%` }} />
              </div>
              <div className="grade-3 grade-justa">
                <div><p className="faixa-nome">Até 18 °C · frio</p><p className="texto-invertido-2">Amadeirados e intensos. Pode caprichar.</p></div>
                <div><p className="faixa-nome">19 a 25 °C · ameno</p><p className="texto-invertido-2">Dia livre. Florais e versáteis vão bem.</p></div>
                <div><p className="faixa-nome">26 °C ou mais · calor</p><p className="texto-invertido-2">Cítricos e leves. Forte fica de fora.</p></div>
              </div>
              <p className="nota-invertida">O marcador mostra {cidade.nome} ({cidade.graus} °C), a cidade do exemplo no celular lá em cima.</p>
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="container secao">
          <div className="cabeca-secao revela">
            <p className="sobretitulo">Planos</p>
            <h2 className="titulo-secao">Comece de graça. <span className="serif">Fique se gostar.</span></h2>
          </div>
          <div className="grade-planos">
            <div className="plano plano-principal revela">
              <div className="plano-topo"><h3>Grátis</h3><span className="selo selo-destaque">Disponível agora</span></div>
              <p className="preco">R$ 0</p>
              <ul className="lista-check">
                <li><Check tamanho={22} />Perfume do dia de manhã, de tarde e de noite</li>
                <li><Check tamanho={22} />Clima real da sua cidade</li>
                <li><Check tamanho={22} />Até 8 perfumes na coleção</li>
              </ul>
              <Link to="/criar-conta" className="botao botao-escuro botao-largo">Começar grátis</Link>
            </div>
            <div className="plano revela">
              <div className="plano-topo"><h3>odri Plus</h3><span className="selo selo-contorno">Em breve</span></div>
              <p className="preco">R$ 9,90<span className="preco-detalhe">/mês ou R$ 59,90/ano</span></p>
              <ul className="lista-check lista-apagada">
                <li><Check tamanho={22} />Tudo do grátis, com coleção ilimitada</li>
                <li><Check tamanho={22} />Aviso de manhã no celular com o perfume do dia</li>
                <li><Check tamanho={22} />Sugestão pela ocasião: escolha onde vai e a odri ajusta</li>
              </ul>
              <ul className="ocasioes" aria-label="Ocasiões do Plus">
                {OCASIOES.map((o) => <li key={o}><Cadeado />{o}</li>)}
              </ul>
              <p className="nota">Quando chegar, você testa 14 dias antes de pagar.</p>
            </div>
          </div>
        </section>

        {/* Dúvidas */}
        <section id="duvidas" className="faixa-clara">
          <div className="container container-estreito secao">
            <h2 className="titulo-secao revela">Dúvidas</h2>
            <div className="duvidas revela">
              {DUVIDAS.map((d) => (
                <details key={d.p}>
                  <summary>{d.p}<Mais /></summary>
                  <p>{d.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Chamada final */}
        <section className="container secao">
          <div className="chamada-final revela">
            <IconeApp tamanho={64} />
            <h2>Amanhã de manhã, você <span className="serif destaque">já sabe.</span></h2>
            <p>Crie sua conta, adicione os perfumes que você tem e veja a sugestão de hoje.</p>
            <Link to="/criar-conta" className="botao botao-destaque botao-grande">Começar grátis <Seta /></Link>
            <p className="nota-invertida">Sem cartão de crédito. Seus dados protegidos pela LGPD.</p>
          </div>
        </section>
      </main>

      <footer className="rodape">
        <div className="container rodape-dentro">
          <div className="rodape-marca">
            <Logo largura={64} />
            <span className="serif">o perfume certo pro seu dia</span>
          </div>
          <div className="rodape-links">
            <Link to="/privacidade">Privacidade</Link>
            <a href="https://instagram.com/odri.app" target="_blank" rel="noopener noreferrer">Instagram @odri.app</a>
            <span className="apagado">Dados do clima: MET Norway</span>
            <span className="apagado">© 2026 odri</span>
          </div>
        </div>
      </footer>
    </>
  )
}
