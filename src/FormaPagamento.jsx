import { FORMAS_PAGAMENTO } from './formasPagamento'
import './FormaPagamento.css'

// Seletor de forma de pagamento, usado no fluxo Cliente Comum e no Vivendas.
// Quando a forma é "dinheiro", mostra o campo opcional de troco.
function FormaPagamento({ valor, onChange, troco, onTrocoChange }) {
  function escolher(chave) {
    onChange(chave)

    // Trocou pra outra forma: limpa o troco digitado
    if (chave !== 'dinheiro' && onTrocoChange) {
      onTrocoChange('')
    }
  }

  return (
    <div className="fp-bloco">

      <label>Forma de pagamento</label>

      <div className="fp-grade">
        {FORMAS_PAGAMENTO.map((forma) => (
          <button
            type="button"
            key={forma.chave}
            className={valor === forma.chave ? 'fp-btn fp-btn-ativo' : 'fp-btn'}
            onClick={() => escolher(forma.chave)}
          >
            <span>{forma.icone}</span>
            {forma.label}
          </button>
        ))}
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

      <p className="fp-aviso">
        O pagamento é feito na entrega (ou retirada), na maquininha ou em dinheiro.
      </p>

    </div>
  )
}

export default FormaPagamento
