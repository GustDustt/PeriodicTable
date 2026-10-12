import { useToast } from '../../store/toast.js'
import './toast.css'

// CSS-only entrance: the toast is on the calculator's critical path, so it
// must not pull in the animation library.
export default function Toast() {
  const toast = useToast((s) => s.toast)
  const hide = useToast((s) => s.hide)
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`toast ${toast.action ? 'toast--action' : ''}`}>
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                toast.action.run()
                hide()
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
