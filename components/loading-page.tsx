import { useState, useEffect } from 'react'

export default function LoadingPage() {
  const [loadingText, setLoadingText] = useState('Loading')

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText((prevText) => {
        if (prevText === 'Loading...') return 'Loading'
        return prevText + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 w-full mx-auto">
      <div className="text-center flex items-center">
        <div className="relative mb-4 h-8 w-8">
          <div className="absolute inset-0 animate-spin rounded-full border-b-2 border-orange-700"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent"></div>
        </div>
        <p className="text-xl font-semibold text-orange-700 ml-4 mb-3">{loadingText}</p>
      </div>
    </div>
  )
}