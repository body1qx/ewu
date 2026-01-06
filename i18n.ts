import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arNajdiTranslations from './i18n/locales/ar-najdi-shawarmer.json';

// اللغة الرسمية الوحيدة: اللهجة النجدية الشاورمرية 😎
i18n
  .use(initReactI18next)
  .init({
    resources: {
      'ar-najdi-shawarmer': {
        translation: arNajdiTranslations,
      },
    },
    lng: 'ar-najdi-shawarmer',
    fallbackLng: 'ar-najdi-shawarmer',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// تفعيل RTL دائماً للعربية
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

export default i18n;
