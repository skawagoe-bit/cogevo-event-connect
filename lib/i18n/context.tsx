'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionary, Dictionary } from './dictionary';

type Language = 'ja' | 'en';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  dict: Dictionary;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ja');
  const [dict, setDict] = useState<Dictionary>(dictionary.ja);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ja' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
      setDict(dictionary[savedLanguage]);
    }
    setIsLoaded(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    setDict(dictionary[lang]);
    localStorage.setItem('language', lang);
  };

  // Avoid hydration mismatch by rendering children only after loading preference
  // Or simpler: just render. The initial state is 'ja', which matches server.
  // If user has 'en', it will switch on client. To avoid flicker, we might want to wait,
  // but for now, let's just render.

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
