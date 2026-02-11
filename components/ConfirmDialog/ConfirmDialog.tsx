import toast from 'react-hot-toast'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
}

export function confirmDialog({
  title = 'Підтвердження',
  message,
  confirmText = 'Так',
  cancelText = 'Ні',
  onConfirm,
  onCancel,
}: ConfirmOptions) {
  const toastId = toast(
    (t) => (
      <div className="flex flex-col gap-4">
        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
        <p className="text-gray-300">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id)
              onCancel?.()
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              onConfirm()
            }}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      style: {
        background: '#1f2937',
        color: '#f3f4f6',
        border: '1px solid #374151',
        borderRadius: '12px',
        minWidth: '300px',
        maxWidth: '500px',
      },
    }
  )
}
