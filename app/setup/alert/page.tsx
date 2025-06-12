import { Suspense } from 'react'
import AlertSetupClient from './AlertSetupClient'

export default function AlertSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <AlertSetupClient />
    </Suspense>
  )
} 