import { useEffect } from 'react'

/**
 * Faz os elementos com a classe "revela" aparecerem quando entram na tela.
 * Funciona em todos os navegadores (IntersectionObserver).
 */
export function useRevela() {
  useEffect(() => {
    const elementos = document.querySelectorAll<HTMLElement>('.revela')

    // Navegador muito antigo: mostra tudo de uma vez
    if (!('IntersectionObserver' in window)) {
      elementos.forEach((el) => el.classList.add('visivel'))
      return
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('visivel')
            observador.unobserve(entrada.target) // anima só na primeira vez
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )

    elementos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [])
}
