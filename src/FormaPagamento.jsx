import './FormaPagamento.css'

const FORMAS = [
  { chave: 'pix', label: 'Pix' },
  { chave: 'debito', label: 'Débito' },
  { chave: 'credito', label: 'Crédito' },
  { chave: 'dinheiro', label: 'Dinheiro' }
]

function FormaPagamento({ valor, onChange, troco, onTrocoChange }) {
  function escolher(chave) {
    onChange(chave)
    if (chave !== 'dinheiro' && onTrocoChange) {
      onTrocoChange('')
    }
  }

  return (
    <div className="fp-bloco">
      <label className="fp-label">Forma de pagamento</label>

      <div className="fp-grade">
        {FORMAS.map((forma) => {
          const selecionado = valor === forma.chave

          return (
            <button
              type="button"
              key={forma.chave}
              className={`fp-btn ${selecionado ? 'fp-btn-ativo' : ''}`}
              onClick={() => escolher(forma.chave)}
            >
              {forma.label}
            </button>
          )
        })}
      </div>

      {valor === 'dinheiro' && onTrocoChange && (
        <div className="fp-troco">
          <label>Troco para quanto? (opcional)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ex: 50 — deixe vazio se não precisar de troco"
            value={troco}
            onChange={(e) => onTrocoChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

export default FormaPagamento