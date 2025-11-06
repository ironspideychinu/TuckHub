import './globals.css'
import React from 'react'
import { AuthProvider } from '@/components/AuthProvider'
import { CartProvider } from '@/components/CartProvider'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'TuckHub',
  description: 'Campus tuckshop ordering system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="container py-6">{children}</main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
