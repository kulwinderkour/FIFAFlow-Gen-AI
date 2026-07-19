import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, SPEECH_LOCALES } from '../constants/languages';

interface AccessibilityContextProps {
  stairless: boolean;
  largeText: boolean;
  highContrast: boolean;
  voiceSupport: boolean;
  language: LanguageCode;
  setStairless: (val: boolean) => void;
  setLargeText: (val: boolean) => void;
  setHighContrast: (val: boolean) => void;
  setVoiceSupport: (val: boolean) => void;
  setLanguage: (lang: LanguageCode) => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stairless, setStairless] = useState<boolean>(() => localStorage.getItem('access_stairless') === 'true');
  const [largeText, setLargeText] = useState<boolean>(() => localStorage.getItem('access_largeText') === 'true');
  const [highContrast, setHighContrast] = useState<boolean>(() => localStorage.getItem('access_highContrast') === 'true');
  const [voiceSupport, setVoiceSupport] = useState<boolean>(() => localStorage.getItem('access_voiceSupport') === 'true');
  const [language, setLanguage] = useState<LanguageCode>(() => (localStorage.getItem('app_lang') as LanguageCode) || 'en');

  // Persist selections
  useEffect(() => {
    localStorage.setItem('access_stairless', String(stairless));
  }, [stairless]);

  useEffect(() => {
    localStorage.setItem('access_largeText', String(largeText));
  }, [largeText]);

  useEffect(() => {
    localStorage.setItem('access_highContrast', String(highContrast));
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('access_voiceSupport', String(voiceSupport));
  }, [voiceSupport]);

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  const speakText = (text: string) => {
    if (!voiceSupport || !('speechSynthesis' in window)) return;
    
    // Cancel active speakers
    window.speechSynthesis.cancel();
    
    // Clean markdown tags
    const cleanText = text.replace(/[*#_\-`\[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Select correct voice accent
    const voiceLocales = SPEECH_LOCALES;
    
    utterance.lang = voiceLocales[language];
    
    // Try to find matching voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(voiceLocales[language]));
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <AccessibilityContext.Provider value={{
      stairless,
      largeText,
      highContrast,
      voiceSupport,
      language,
      setStairless,
      setLargeText,
      setHighContrast,
      setVoiceSupport,
      setLanguage,
      speakText,
      stopSpeaking
    }}>
      <div className={`${largeText ? 'text-lg md:text-xl' : 'text-sm md:text-base'} transition-all duration-200`}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
