"use client";
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            borderRadius: '0.75rem',
            border: '1px solid var(--toast-border)',
          },
          success: {
            iconTheme: {
              primary: '#ee8c2b',
              secondary: '#fff',
            },
          },
        }}
      />
    </NextThemesProvider>
  );
}
