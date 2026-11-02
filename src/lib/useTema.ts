import { useCallback, useState } from 'react'
import type { MouseEvent } from 'react'
import { flushSync } from 'react-dom'

export type Tema = 'claro' | 'escuro'

function temaAtual(): Tema {
  return document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro'
}

function salvar(tema: Tema) {
  try {
    localStorage.setItem('odri-tema', tema)
  } catch {
    // navegador sem localStorage (aba anônima): só não lembra na próxima visita
  }
}

/**
 * Tema claro/escuro.
 * A troca abre um círculo a partir do botão (View Transitions, Chrome/Edge/Safari novos).
 * Navegador sem suporte: as cores mudam com uma transição suave de CSS.
 * Quem pediu "menos movimento" no sistema: esmaecer rápido, sem círculo (regra no CSS).
 */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaAtual)

  const alternar = useCallback((evento: MouseEvent<HTMLElement>) => {
    const novo: Tema = temaAtual() === 'escuro' ? 'claro' : 'escuro'
    const raiz = document.documentElement

    const aplicar = () => {
      raiz.dataset.tema = novo
      flushSync(() => setTema(novo))
    }

    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }

    // Com "menos movimento", o CSS troca o círculo por um esmaecer rápido
    if (typeof doc.startViewTransition === 'function') {
      // Centro do círculo = o botão clicado; raio = até o canto mais longe da tela
      const caixa = evento.currentTarget.getBoundingClientRect()
      const x = caixa.left + caixa.width / 2
      const y = caixa.top + caixa.height / 2
      const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      raiz.style.setProperty('--troca-x', `${x}px`)
      raiz.style.setProperty('--troca-y', `${y}px`)
      raiz.style.setProperty('--troca-raio', `${raio}px`)
      doc.startViewTransition(aplicar)
    } else {
      // Navegador sem View Transitions: as cores mudam com transição suave
      raiz.classList.add('tema-trocando')
      aplicar()
      window.setTimeout(() => raiz.classList.remove('tema-trocando'), 450)
    }

    salvar(novo)
  }, [])

  return { tema, alternar }
}
