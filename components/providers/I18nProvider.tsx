'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure i18n is ready before rendering
    if (i18n.isInitialized) {
      setIsReady(true);
    } else {
      // Wait for i18n to be ready
      i18n.on('initialized', () => {
        setIsReady(true);
      });

      // Fallback timeout in case initialization fails
      const timeout = setTimeout(() => {
        setIsReady(true);
      }, 1000);

      return () => {
        clearTimeout(timeout);
        i18n.off('initialized');
      };
    }
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}