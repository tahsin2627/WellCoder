import './globals.css';

export const metadata = {
  title: 'WellCoder | AI Assistant',
  description: 'Your real-time AI coding assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
