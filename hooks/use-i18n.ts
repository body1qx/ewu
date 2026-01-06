import { useTranslation } from 'react-i18next';

export function useI18n() {
  const { t, i18n } = useTranslation();
  
  const isRTL = i18n.language === 'ar';
  
  return {
    t,
    i18n,
    isRTL,
    currentLanguage: i18n.language,
  };
}
