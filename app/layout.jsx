import './globals.css'

export const metadata = {
  title: 'WellCoder | AI Agent IDE',
  description: 'Your personal AI software engineer.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
