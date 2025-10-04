import React, { createContext, useContext } from 'react';
import translations from '../assets/translations.json';

const TranslationContext = createContext(translations.en);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userLang = navigator.language;
  const selectedLanguage = userLang.startsWith("PT") ? translations.pt : translations.en;

  return (
    <TranslationContext.Provider value={selectedLanguage}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);