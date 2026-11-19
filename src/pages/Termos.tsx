import { Link } from 'react-router-dom'
import { Logo } from '../components/Icones'

/**
 * Termos de Uso (inclui o Plus pago). Texto simples, no jeito da odri.
 * Quando abrir o CNPJ, trocar o "Responsável" pelo nome da empresa.
 */
export default function Termos() {
  return (
    <>
      <header className="topo">
        <div className="topo-dentro">
          <Link to="/" aria-label="odri, início" className="topo-logo"><Logo /></Link>
          <Link to="/" className="topo-entrar">Voltar ao início</Link>
        </div>
      </header>

      <main className="container container-estreito privacidade">
        <h1>Termos de Uso</h1>
        <p className="privacidade-data">Última atualização: 19 de novembro de 2026.</p>

        <h2>O que é a odri</h2>
        <p>
          A odri escolhe, entre os perfumes que você já tem, o que combina com o clima e a hora do dia.
          A sugestão é uma dica, não uma regra: o perfume é seu e quem decide é você.
          Responsável: Lucas Rodrigues Roque da Silva. Contato: <a href="mailto:odri.app@gmail.com">odri.app@gmail.com</a>.
        </p>

        <h2>Sua conta</h2>
        <ul>
          <li>Você precisa ter 13 anos ou mais. Pra assinar o Plus, precisa ter 18 anos ou a autorização de um responsável.</li>
          <li>Cuide da sua senha. Você pode apagar a conta quando quiser, na Conta, em “Apagar conta”.</li>
          <li>Não use a odri pra nada ilegal nem pra atrapalhar o serviço (robôs, ataques, cadastros falsos).</li>
        </ul>

        <h2>Plano grátis</h2>
        <p>Sugestão de manhã, de tarde e de noite pelo clima da sua cidade, aviso de chuva e até 6 perfumes na coleção. Sem prazo e sem cartão.</p>

        <h2>odri Plus</h2>
        <ul>
          <li><b>O que tem:</b> sugestão pela ocasião (Trabalho, Encontro, Festa e outras), coleção sem limite e tudo do grátis.</li>
          <li><b>Preço:</b> R$ 9,90 por mês ou R$ 59,90 por ano. O preço aparece antes de você pagar.</li>
          <li><b>Teste grátis:</b> 14 dias, uma vez por conta, sem cartão. Ele é opcional: se preferir, dá pra assinar direto, e aí a cobrança acontece na hora.</li>
          <li><b>Pagamento:</b> pelo Mercado Pago, no cartão (assinatura que renova sozinha) ou no <b>Pix</b> (1 mês ou 1 ano, sem renovação automática). A odri não vê nem guarda os dados do seu cartão.</li>
          <li><b>Pix:</b> vale 30 dias (mensal) ou 365 dias (anual) a partir do pagamento, somando com o Plus que você já tiver. Perto de acabar, mandamos um e-mail pra renovar. Se não renovar, volta pro grátis.</li>
          <li><b>Renovação automática:</b> a assinatura renova sozinha no fim de cada período (mês ou ano) até você cancelar.</li>
          <li><b>Cancelar:</b> quando quiser, na Conta, em “Cancelar assinatura”. Sem multa. O Plus continua até o fim do período que você já pagou e depois volta pro grátis.</li>
          <li><b>Se o cartão recusar:</b> o Mercado Pago tenta de novo por alguns dias. Se não der certo, a assinatura é cancelada e a conta volta pro grátis.</li>
          <li><b>Se mudarmos o preço:</b> avisamos com pelo menos 30 dias de antes. Você pode cancelar antes de valer.</li>
        </ul>

        <h2>Direito de arrependimento (7 dias)</h2>
        <p>
          Pelo Código de Defesa do Consumidor (art. 49), você pode desistir em até 7 dias depois da primeira cobrança
          e receber <b>todo o valor de volta</b>. É só escrever pra <a href="mailto:odri.app@gmail.com">odri.app@gmail.com</a> com o
          e-mail da sua conta. Devolvemos pelo Mercado Pago, no mesmo cartão.
        </p>

        <h2>Coleção quando o Plus acaba</h2>
        <p>Você não perde nenhum perfume. Só não dá pra adicionar novos enquanto tiver mais de 6, e as ocasiões ficam com cadeado.</p>

        <h2>Loja e links de parceiros</h2>
        <p>
          Os links da Loja levam pro Mercado Livre. A odri pode ganhar uma comissão, sem custo extra pra você.
          Preço, entrega e troca são com a loja.
        </p>

        <h2>Limites</h2>
        <p>
          Usamos a previsão do tempo do MET Norway, que pode errar. Fazemos o possível pra deixar o app no ar,
          mas ele pode ficar fora por alguns minutos. Se algo der errado com o Plus, fale com a gente que a gente resolve.
        </p>

        <h2>Seus dados</h2>
        <p>Está tudo na <Link to="/privacidade">Política de Privacidade</Link>.</p>

        <h2>Mudanças nestes termos</h2>
        <p>Se mudarmos algo importante, avisamos por e-mail ou no app antes de valer.</p>

        <p className="privacidade-voltar">
          <Link to="/" className="botao botao-contorno">Voltar ao início</Link>
        </p>
      </main>
    </>
  )
}
