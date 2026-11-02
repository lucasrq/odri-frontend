# odri · front-end

**Qual perfume eu uso hoje?** A odri olha o clima da sua cidade e a hora do dia e escolhe, entre os perfumes que você já tem, o que combina agora, com o motivo da escolha.

**Site:** [odri-app.vercel.app](https://odri-app.vercel.app) · **Instagram:** [@odri.app](https://instagram.com/odri.app)

> Este repositório é o site (React). A API (Java + Spring Boot) fica num repositório privado.

## Tecnologias

- React 18 + TypeScript
- Vite
- React Router
- CSS puro com variáveis (sem biblioteca de estilo)

## O que já tem

- **Página inicial** com uma chamada principal ("Começar grátis") repetida ao longo da página, planos e dúvidas frequentes.
- **Tema claro e escuro:** segue o tema do sistema na primeira visita e lembra a escolha. A troca abre num círculo a partir do botão (View Transitions API); em navegadores sem suporte, as cores mudam com uma transição suave. A página não "pisca" branco no tema escuro, porque o tema é aplicado antes do primeiro desenho.
- **Celular interativo:** simula o app (cidade, manhã/tarde/noite, coleção, conta) usando a mesma regra de pontos da API.
- **Animações:** entrada em sequência na abertura e seções que aparecem ao rolar (scroll-driven animations, só CSS).
- **Acessibilidade:** botões e links de verdade, foco visível, contraste conferido e respeito ao "reduzir movimento" do sistema.
- **Favicon** que inverte as cores quando a aba do navegador está escura.

## Estrutura

```
src/
  components/   Topo, celular de exemplo, ícones
  pages/        Página inicial
  lib/          Regra da sugestão e tema claro/escuro
  index.css     Estilos e cores (tema em variáveis CSS)
```

## Como rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5173

## Status

- [x] Página inicial
- [ ] Criar conta e entrar (Supabase Auth)
- [ ] Perfume do dia, coleção e conta
- [ ] Painel do admin
- [ ] Publicação

---

© 2026 odri. Todos os direitos reservados.
