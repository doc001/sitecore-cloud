import '@/styles/globals.css'
import type { Metadata } from 'next'
import DrawerMenu from '@/components/ui/DrawerMenu'
import Footer from '@/components/footer/Footer'

export const metadata: Metadata = {
  title: 'Bow Valley College',
  description: 'Bow Valley College Website',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className='w-screen overflow-x-hidden'>
        <DrawerMenu />
          {children}
        <Footer />
      </body>
    </html>
  )
}
