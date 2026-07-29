import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { repositorio } from '../lib/repositorio.js'

const TemaContext = createContext(null)

const DURACAO_TRANSICAO = 200 // precisa bater com --duracao-tema no CSS

function temaInicial() {
  const salvo = repositorio.carregarTema()
  if (salvo === 'claro' || salvo === 'escuro') return salvo
  const prefereClaro = window.matchMedia?.('(prefers-color-scheme: light)').matches
  return prefereClaro ? 'claro' : 'escuro'
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(temaInicial)
  const timeoutRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.tema = tema
    repositorio.salvarTema(tema)
  }, [tema])

  const alternarTema = useCallback(() => {
    const raiz = document.documentElement

    // Liga a transição de cor só durante a troca. Se ficasse sempre ligada,
    // atrasaria hovers e outras animações da interface.
    raiz.classList.add('trocando-tema')

    setTema((atual) => (atual === 'escuro' ? 'claro' : 'escuro'))

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      raiz.classList.remove('trocando-tema')
    }, DURACAO_TRANSICAO)
  }, [])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return (
    <TemaContext.Provider value={{ tema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  )
}

export function useTema() {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema precisa estar dentro de <TemaProvider>')
  return ctx
}
