import { useId } from 'react'
import './controls.css'

export default function Switch({ label, help, checked, onChange, disabled = false }) {
  const helpId = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={help ? helpId : undefined}
      disabled={disabled}
      className="switch"
      onClick={() => onChange(!checked)}
    >
      <span className="switch__text">
        <span className="switch__label">{label}</span>
        {help && <span id={helpId} className="switch__help">{help}</span>}
      </span>
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
    </button>
  )
}
