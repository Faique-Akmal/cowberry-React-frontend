import { useState } from "react";
import { useTranslation } from "react-i18next";

const LangToggleButton: React.FC = () => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(i18n.language || "en");

  // List of Indian languages with their i18n codes
  const languages: { code: string; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },  
    { code: "bn", label: "বাংলা" }, // Bengali
    { code: "gu", label: "ગુજરાતી" }, // Gujarati
    { code: "kn", label: "ಕನ್ನಡ" }, // Kannada
    { code: "ml", label: "മലയാളം" }, // Malayalam
    { code: "bo", label: "Bodo" }, // Malayalam
    { code: "mr", label: "मराठी" }, // Marathi
    { code: "pa", label: "ਪੰਜਾਬੀ" }, // Punjabi
    { code: "ta", label: "தமிழ்" }, // Tamil
    { code: "te", label: "తెలుగు" }, // Telugu
    { code: "ur", label: "اردو" }, // Urdu
    { code: "or", label: "ଓଡ଼ିଆ" }, // Odia
    { code: "as", label: "অসমীয়া" }, // Assamese
    { code: "ks", label: "کٲشُر" }, // Kashmiri
    { code: "ne", label: "नेपाली" }, // Nepali
    { code: "kon", label: "konkani" }, // konkani
    { code: "bh", label: "भोजपुरी" }, // Bhojpuri
    { code: "mag", label: "मगही" }, // Magahi
    { code: "mai", label: "मैथिली" }, // Maithili
    { code: "san", label: "संस्कृतम्" }, // Sanskrit
    { code: "dogri", label: "डोगरी" }, // Dogri
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setLanguage(code);
  };

  return (
    <select
  value={language}
  onChange={(e) => changeLanguage(e.target.value)}
  className="p-1 border rounded-full w-12 bg-white dark:bg-gray-900 dark:text-white text-gray-700"
>
  {languages.map((lang) => (
    <option key={lang.code} value={lang.code}>
      {lang.label}
    </option>
  ))}
</select>

  );
};




export default LangToggleButton;
