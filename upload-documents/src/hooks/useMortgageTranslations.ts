import { useContext } from 'react';
import MortgageTranslationContext from '../components/MortgageTranslationProvider';

export const useMortgageTranslations = () => useContext(MortgageTranslationContext);
