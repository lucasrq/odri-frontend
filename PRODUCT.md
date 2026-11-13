# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brasileiros de 18 a 35 anos, homens e mulheres, que já têm alguns perfumes (nacionais como Natura e O Boticário, árabes como Armaf e Lattafa, ou importados) e todo dia ficam na dúvida de qual usar. Chegam pelo Instagram/TikTok (a febre do perfume árabe no Brasil). Usam no celular, de manhã antes de sair. Não precisam entender de perfume: só digitam o nome do que têm.

## Product Purpose

A odri olha o clima da cidade e a hora do dia e escolhe, entre os perfumes que a pessoa já tem, o que combina agora, explicando o motivo. Sucesso = a pessoa abre todo dia antes de sair, monta a coleção dela e, quando falta algo pro clima, encontra uma sugestão na Loja.

## Positioning

Único app em português que junta coleção + clima real + horário (e, no Plus, ocasião), com perfumes nacionais e árabes no catálogo. Os concorrentes que fazem isso são em inglês e quase todos só para iPhone; os brasileiros são só coleção ou quiz de compra.

## Operating Context

- Site único: `/` institucional (persuadir) e `/app` o produto (Hoje, Coleção, Loja, Minha conta, cadastro/entrar, primeiros passos).
- Cadastro obrigatório para todos, inclusive no grátis. A coleção fica no banco, ligada à conta.
- Perfume novo que não está no catálogo vira "em análise" e o admin classifica (família, intensidade, clima) em até 24h.
- Clima: MET Norway (crédito obrigatório na tela). Cidade fixa ou localização do celular.

## Capabilities and Constraints

- Stack: React + TypeScript + Vite (front, Vercel), Spring Boot (back, Render), Supabase (banco e login).
- Plano grátis: até 8 perfumes, sugestão por período (manhã/tarde/noite), ocasiões aparecem com cadeado. Plus (R$ 9,90/mês ou R$ 59,90/ano, 14 dias de teste): ocasiões, coleção ilimitada, aviso no WhatsApp. Pagamento ainda não implementado.
- Loja: 3 perfumes que faltam na coleção pro clima do dia, um barato (até R$150), um médio (R$150–400) e um caro (acima de R$400), com link de parceiro. Só faixa de preço, nunca preço exato (regra da Amazon). Aviso de afiliado é obrigatório (CDC, CONAR, Amazon).
- Sem anúncios.
- Nunca dizer que o app é "sem cadastro".
- Nunca dizer "nenhum perfume serve": quando nada combina, mostrar o melhor da coleção e a dica da Loja.

## Brand Commitments

- Nome: odri (minúsculo). Tom: simples, direto, em português do Brasil falado, sem jargão de perfumaria.
- Manifesto atual: "Qual perfume eu uso hoje?".
- O dono liberou mudar o visual inteiro (logo, cores, fontes, tema escuro) se for necessário. Hoje: wordmark com pingo âmbar, Tinta #17191C, Névoa #EEF0F0, Âmbar #D08A2E, Figtree, tema claro/escuro. Os vídeos do Instagram usam fundo creme.

## Evidence on Hand

- Nenhum depoimento, número de usuários, avaliação ou imprensa ainda. Não inventar nenhum.
- Logo e ícones: `../../02-Carreira/Marca-Odri/` (svg e png).
- Catálogo real ainda pequeno; parte dos perfumes no banco são de teste ("TESTE odri").

## Product Principles

1. Uma resposta, não um catálogo: a tela principal decide por você e explica em uma frase.
2. Fala como gente: zero termo técnico de perfumaria sem tradução.
3. A coleção é da pessoa: a Loja é discreta e só aparece quando falta algo de verdade.
4. Honestidade: aviso de parceiro sempre visível, nada de preço exato nem prova inventada.
5. Celular primeiro: tem que funcionar bem em 390px, de manhã, com pressa.

## Accessibility & Inclusion

Público geral no celular: contraste legível ao sol, toque confortável, tema escuro, respeitar "reduzir movimento".
