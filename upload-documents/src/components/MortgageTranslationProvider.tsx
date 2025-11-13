import React, { createContext } from 'react';
import mortgageTranslations from '../assets/mortgage-translations.json';

type Lang = 'en' | 'pt';

const MortgageTranslationContext = createContext({
  t: mortgageTranslations.en,
  language: 'en' as Lang,
});

export const MortgageTranslationProvider: React.FC<{ children: React.ReactNode; preferredLanguage?: string | null }> = ({ children, preferredLanguage }) => {
  const userLang = preferredLanguage || navigator.language;
  const lang: Lang = userLang && userLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  const t = lang === 'pt' ? mortgageTranslations.pt : mortgageTranslations.en;

  return (
    <MortgageTranslationContext.Provider value={{ t, language: lang }}>
      {children}
    </MortgageTranslationContext.Provider>
  );
};

export default MortgageTranslationContext;
