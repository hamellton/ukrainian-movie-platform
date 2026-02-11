import axios, { AxiosError } from 'axios'

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; details?: string; message?: string }>
    return (
      axiosError.response?.data?.error ||
      axiosError.response?.data?.details ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      'An error occurred'
    )
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

export function getErrorDetails(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ details?: string; error?: string }>
    return axiosError.response?.data?.details || axiosError.response?.data?.error
  }
  if (error instanceof Error) {
    return error.message
  }
  return undefined
}
