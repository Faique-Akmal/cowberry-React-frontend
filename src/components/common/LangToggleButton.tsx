import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LangToggleButton: React.FC = () => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(i18n.language)

  const changeLanguage = async (lng:string) => {
    try {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    setLanguage(newLang)
    i18n.changeLanguage(newLang);
    } catch (error) {
      console.error(`Failed to change language to ${lng}`, error);
    }
  };

  useEffect(()=>{
  changeLanguage(language);

  return
  }, [])

  return (
    <button  
      onClick={() => changeLanguage(language)}
      className="relative flex capitalize items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {language}
    </button>
  )
}

export default LangToggleButton