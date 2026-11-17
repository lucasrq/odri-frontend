import { Link } from 'react-router-dom'
import { Logo } from '../components/Icones'

/**
 * Política de Privacidade (LGPD). Texto simples, no jeito da odri.
 * Quando abrir o CNPJ, trocar o "Responsável" pelo nome da empresa.
 */
export default function Privacidade() {
  return (
    <>
      <header className="topo">
        <div className="topo-dentro">
          <Link to="/" aria-label="odri, início" className="topo-logo"><Logo /></Link>
          <Link to="/" className="topo-entrar">Voltar ao início</Link>
        </div>
      </header>

      <main className="container container-estreito privacidade">
        <h1>Política de Privacidade</h1>
        <p className="privacidade-data">Última atualização: 17 de novembro de 2026.</p>

        <h2>Quem somos</h2>
        <p>
          A odri é um app que escolhe, entre os perfumes que você já tem, o melhor pro clima e pra hora do dia.
          Responsável pelos seus dados: Lucas Rodrigues Roque da Silva. Contato: <a href="mailto:odri.app@gmail.com">odri.app@gmail.com</a>.
        </p>

        <h2>Quais dados guardamos</h2>
        <ul>
          <li><b>Conta:</b> nome, e-mail e senha. A senha fica criptografada: nem nós conseguimos ver.</li>
          <li><b>Localização:</b> a cidade que você escolheu ou, se usar a localização automática, uma posição aproximada (cerca de 1 km). Nunca o endereço exato.</li>
          <li><b>Seus perfumes:</b> a coleção que você monta e os perfumes que você sugere pro catálogo.</li>
          <li><b>Uso do app:</b> cliques na Loja e adesivos gerados, só em números, pra saber o que funciona.</li>
          <li><b>Preferências:</b> se você quer receber o e-mail da manhã.</li>
        </ul>

        <h2>Pra que usamos</h2>
        <ul>
          <li>Escolher o perfume certo pro clima da sua cidade.</li>
          <li>Mandar o e-mail da manhã, <b>só se você ligar</b>. Dá pra desligar na Conta ou pelo link no próprio e-mail.</li>
          <li>Avisar quando um perfume que você sugeriu entrar no catálogo.</li>
          <li>Melhorar o app. <b>Não vendemos seus dados</b> e não mostramos propaganda de terceiros.</li>
        </ul>

        <h2>Com quem compartilhamos</h2>
        <ul>
          <li><b>Supabase:</b> guarda o login e o banco de dados.</li>
          <li><b>Render e Vercel:</b> hospedam o servidor e o site.</li>
          <li><b>Brevo:</b> envia os e-mails.</li>
          <li><b>MET Norway:</b> recebe só a posição aproximada, sem nome nem e-mail, pra devolver a previsão do tempo.</li>
          <li><b>Mercado Livre:</b> quando você clica num link da Loja, vai pro site deles. A odri pode ganhar uma comissão, sem custo extra pra você.</li>
        </ul>

        <h2>Por quanto tempo guardamos</h2>
        <p>
          Enquanto sua conta existir. Quando você apaga a conta, apagamos junto o cadastro, a coleção e o histórico.
          Os perfumes que você sugeriu continuam no catálogo, mas sem nenhuma ligação com você.
        </p>

        <h2>Seus direitos (LGPD)</h2>
        <ul>
          <li><b>Ver, corrigir ou receber uma cópia dos seus dados:</b> escreva pra <a href="mailto:odri.app@gmail.com">odri.app@gmail.com</a>.</li>
          <li><b>Apagar tudo:</b> na Conta, em “Apagar conta”. É na hora.</li>
          <li><b>Parar o e-mail da manhã:</b> na Conta ou pelo link no e-mail.</li>
          <li>Respondemos em até 15 dias.</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          Usamos só o armazenamento do navegador, pra manter você logado e lembrar o tema (claro ou escuro).
          Não usamos cookies de propaganda.
        </p>

        <h2>Idade</h2>
        <p>A odri é pra maiores de 13 anos.</p>

        <h2>Mudanças nesta política</h2>
        <p>Se mudarmos algo importante, avisamos por e-mail ou no app.</p>

        <p className="privacidade-voltar">
          <Link to="/" className="botao botao-contorno">Voltar ao início</Link>
        </p>
      </main>
    </>
  )
}
