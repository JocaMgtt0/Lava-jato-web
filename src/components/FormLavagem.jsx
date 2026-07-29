import { useEffect, useState } from 'react'
import { useDados } from '../context/DadosContext.jsx'
import { moeda, paraNumero } from '../lib/format.js'

const VAZIO = { cliente: '', modelo: '', placa: '', servico: '', valor: '' }

function FormLavagem({ inicial, aoSalvar, aoCancelar, compacto = false }) {
  const { valoresPadrao } = useDados()

  const [form, setForm] = useState(() =>
    inicial
      ? {
          cliente: inicial.cliente ?? '',
          modelo: inicial.modelo ?? '',
          placa: inicial.placa ?? '',
          servico: inicial.servico ?? '',
          valor: String(inicial.valor ?? ''),
        }
      : VAZIO
  )
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (inicial) {
      setForm({
        cliente: inicial.cliente ?? '',
        modelo: inicial.modelo ?? '',
        placa: inicial.placa ?? '',
        servico: inicial.servico ?? '',
        valor: String(inicial.valor ?? ''),
      })
    }
  }, [inicial])

  const definir = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const escolherServico = (vp) =>
    setForm((f) => ({ ...f, servico: vp.nome, valor: String(vp.valor) }))

  const enviar = (e) => {
    e.preventDefault()

    if (!form.modelo.trim()) return setErro('Informe o modelo do veículo.')

    const numero = paraNumero(form.valor)
    if (Number.isNaN(numero)) return setErro('Valor inválido. Use apenas números.')
    if (numero < 0) return setErro('O valor não pode ser negativo.')

    aoSalvar({
      cliente: form.cliente.trim(),
      modelo: form.modelo.trim(),
      placa: form.placa.trim().toUpperCase(),
      servico: form.servico.trim(),
      valor: numero,
    })

    if (!inicial) setForm(VAZIO)
    setErro('')
  }

  return (
    <form onSubmit={enviar} className={compacto ? 'form compacto' : 'form'}>
      <div className="campo-linha">
        <div className="campo">
          <label htmlFor="cliente">Cliente</label>
          <input
            id="cliente"
            value={form.cliente}
            onChange={definir('cliente')}
            placeholder="Nome do cliente"
            autoComplete="off"
          />
        </div>

        <div className="campo">
          <label htmlFor="modelo">Veículo</label>
          <input
            id="modelo"
            value={form.modelo}
            onChange={definir('modelo')}
            placeholder="Gol, Civic, Hilux"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="campo-linha">
        <div className="campo">
          <label htmlFor="placa">Placa</label>
          <input
            id="placa"
            value={form.placa}
            onChange={definir('placa')}
            placeholder="ABC-1234"
            autoComplete="off"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="campo">
          <label htmlFor="valor">Valor</label>
          <input
            id="valor"
            value={form.valor}
            onChange={definir('valor')}
            placeholder="0,00"
            inputMode="decimal"
          />
        </div>
      </div>

      {valoresPadrao.length > 0 && (
        <div className="campo">
          <label>Serviço</label>
          <div className="chips-escolha">
            {valoresPadrao.map((vp) => (
              <button
                key={vp.id}
                type="button"
                className={form.servico === vp.nome ? 'chip-escolha ativo' : 'chip-escolha'}
                onClick={() => escolherServico(vp)}
              >
                {vp.nome}
                <span className="chip-valor">{moeda(vp.valor)}</span>
              </button>
            ))}
            {form.servico && (
              <button
                type="button"
                className="chip-escolha limpar"
                onClick={() => setForm((f) => ({ ...f, servico: '' }))}
              >
                limpar
              </button>
            )}
          </div>
        </div>
      )}

      {erro && <p className="campo-erro">{erro}</p>}

      <div className="form-acoes">
        {aoCancelar && (
          <button type="button" className="btn btn-fantasma" onClick={aoCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primario">
          {inicial ? 'Salvar alterações' : 'Registrar lavagem'}
        </button>
      </div>
    </form>
  )
}

export default FormLavagem
