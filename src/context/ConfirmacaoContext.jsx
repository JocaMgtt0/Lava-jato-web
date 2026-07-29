import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Confirmação de ações destrutivas.
 *
 * Uso: `const ok = await confirmar({ titulo, mensagem })`
 * Exclusão sem volta não pode depender de um toque certeiro — principalmente
 * no celular, onde o alvo é pequeno.
 */
const ConfirmacaoContext = createContext(null)

export function ConfirmacaoProvider({ children }) {
  const [pedido, setPedido] = useState(null)
  const resolverRef = useRef(null)

  const confirmar = useCallback((opcoes) => {
    setPedido({
      titulo: 'Confirmar exclusão',
      textoConfirmar: 'Excluir',
      ...opcoes,
    })
    return new Promise((resolver) => {
      resolverRef.current = resolver
    })
  }, [])

  const responder = useCallback((resposta) => {
    resolverRef.current?.(resposta)
    resolverRef.current = null
    setPedido(null)
  }, [])

  useEffect(() => {
    if (!pedido) return
    const aoTeclar = (e) => {
      if (e.key === 'Escape') responder(false)
      if (e.key === 'Enter') responder(true)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [pedido, responder])

  return (
    <ConfirmacaoContext.Provider value={{ confirmar }}>
      {children}
      {pedido &&
        createPortal(
          <div
            className="confirmar-overlay nao-imprimir"
            onMouseDown={(e) => e.target === e.currentTarget && responder(false)}
          >
            <div className="confirmar-caixa" role="alertdialog" aria-modal="true">
              <div className="confirmar-icone">⚠️</div>
              <h2>{pedido.titulo}</h2>
              {pedido.mensagem && <p className="confirmar-texto">{pedido.mensagem}</p>}
              <div className="confirmar-acoes">
                <button className="btn btn-suave" onClick={() => responder(false)} autoFocus>
                  Cancelar
                </button>
                <button className="btn btn-destrutivo" onClick={() => responder(true)}>
                  {pedido.textoConfirmar}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmacaoContext.Provider>
  )
}

export function useConfirmacao() {
  const ctx = useContext(ConfirmacaoContext)
  if (!ctx) throw new Error('useConfirmacao precisa estar dentro de <ConfirmacaoProvider>')
  return ctx
}
