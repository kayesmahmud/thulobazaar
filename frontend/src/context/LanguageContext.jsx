import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LanguageContext = createContext();

export const LANGUAGES = {
  EN: 'en',
  NE: 'ne'
};

export const LANGUAGE_NAMES = {
  en: 'English',
  ne: 'नेपाली'
};

export function LanguageProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract language from URL path
  const getLanguageFromPath = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const lang = pathParts[0];
    return lang === LANGUAGES.EN || lang === LANGUAGES.NE ? lang : LANGUAGES.EN;
  };

  const [language, setLanguage] = useState(getLanguageFromPath);

  // Update language when URL changes
  useEffect(() => {
    const lang = getLanguageFromPath();
    setLanguage(lang);
  }, [location.pathname]);

  // Switch language function
  const switchLanguage = (newLang) => {
    if (newLang !== LANGUAGES.EN && newLang !== LANGUAGES.NE) {
      return;
    }

    const currentPath = location.pathname;
    const currentLang = getLanguageFromPath();

    // Replace current language with new language in URL
    let newPath;
    if (currentPath.startsWith(`/${currentLang}`)) {
      newPath = currentPath.replace(`/${currentLang}`, `/${newLang}`);
    } else {
      // If no language prefix, add it
      newPath = `/${newLang}${currentPath}`;
    }

    navigate(newPath + location.search, { replace: true });
  };

  const value = {
    language,
    switchLanguage,
    isEnglish: language === LANGUAGES.EN,
    isNepali: language === LANGUAGES.NE
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
