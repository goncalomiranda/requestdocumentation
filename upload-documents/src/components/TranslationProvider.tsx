import React, { createContext, useContext } from 'react';
import translations from '../assets/translations.json';

const TranslationContext = createContext({
  translations: translations.en,
  language: 'en',
});

export const TranslationProvider: React.FC<{ children: React.ReactNode; preferredLanguage?: string | null }> = ({ children, preferredLanguage }) => {
  const userLang = preferredLanguage || navigator.language;
  const selectedLanguage = userLang && userLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  const selectedTranslations = selectedLanguage === 'pt' ? translations.pt : translations.en;

  return (
    <TranslationContext.Provider value={{ translations: selectedTranslations, language: selectedLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);