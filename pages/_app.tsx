import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { LangProvider } from '@/contexts/LangContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LangProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </LangProvider>
  );
}
