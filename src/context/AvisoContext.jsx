import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Avisos rápidos de confirmação ("Lavagem registrada").
 * Some sozinho — não exige ação de quem está trabalhando.
 */
const AvisoContext = createContext(null)

const DURACAO = 2600

export function AvisoProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const contador = useRef(0)

  const avisar = useCallback((mensagem, tipo = 'sucesso') => {
    const id = ++contador.current
    setAvisos((atual) => [...atual, { id, mensagem, tipo }])
    setTimeout(() => {
      setAvisos((atual) => atual.filter((a) => a.id !== id))
    }, DURACAO)
  }, [])

  return (
    <AvisoContext.Provider value={{ avisar }}>
      {children}
      {createPortal(
        <div className="avisos nao-imprimir" role="status" aria-live="polite">
          {avisos.map((a) => (
            <div key={a.id} className={`aviso-toast ${a.tipo}`}>
              <span className="aviso-icone">{a.tipo === 'erro' ? '✕' : '✓'}</span>
              {a.mensagem}
            </div>
          ))}
        </div>,
        document.body
      )}
    </AvisoContext.Provider>
  )
}

export function useAviso() {
  const ctx = useContext(AvisoContext)
  if (!ctx) throw new Error('useAviso precisa estar dentro de <AvisoProvider>')
  return ctx
}
