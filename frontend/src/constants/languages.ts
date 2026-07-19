export type LanguageCode = 'en' | 'es' | 'fr' | 'hi' | 'ar' | 'pt';

export const LANGUAGE_OPTIONS: { code: LanguageCode; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English (US)' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'hi', label: 'HI', name: 'हिन्दी (Hindi)' },
  { code: 'ar', label: 'AR', name: 'العربية (Arabic)' },
  { code: 'pt', label: 'PT', name: 'Português' },
];

export const SPEECH_LOCALES: Record<LanguageCode, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  hi: 'hi-IN',
  ar: 'ar-SA',
  pt: 'pt-BR',
};

export const FAN_ASSISTANT_INTROS: Record<LanguageCode, string> = {
  en: 'Hello! I am StadiumMind AI, your official FIFA 2026 Assistant. Select your Gate & Seat to map your route, or ask me for concessions, restrooms, and elevators.',
  es: '¡Hola! Soy StadiumMind AI, su asistente oficial de la FIFA 2026. Seleccione su puerta y asiento para trazar su ruta, o pregúnteme sobre puestos de comida, baños y ascensores.',
  fr: 'Bonjour! Je suis StadiumMind AI, votre assistant officiel de la FIFA 2026. Sélectionnez votre porte et votre siège pour tracer votre itinéraire, ou demandez-moi les toilettes, buvettes et ascenseurs.',
  hi: 'नमस्ते! मैं स्टेडियममाइंड एआई हूँ, आपका आधिकारिक फीफा 2026 सहायक। अपना गेट और सीट चुनें, या मुझसे शौचालय, भोजन स्टालों और लिफ्टों के बारे में पूछें।',
  ar: 'مرحباً! أنا StadiumMind AI، مساعدك الرسمي لكأس العالم FIFA 2026. اختر البوابة والمقعد لتحديد مسارك، أو اسألني عن دورات المياه، المطاعم، والمصاعد.',
  pt: 'Olá! Sou o StadiumMind AI, o seu Assistente oficial da FIFA 2026. Selecione o seu portão e assento para trazar a sua rota, ou pergunte-me sobre alimentação, banheiros e elevadores.',
};
