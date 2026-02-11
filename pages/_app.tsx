import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header/Header'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#1f2937' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1f2937' },
          },
        }}
      />
    </>
  )
}
