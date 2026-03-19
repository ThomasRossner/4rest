import i18next from 'i18next';

export type NormalizedQuizOption = {
  id: string;
  label: string;
};

export type NormalizedQuizQuestion = {
  id: string;
  question: string;
  options: NormalizedQuizOption[];
};

export type NormalizedSurveyOption = {
  id: string;
  label: string;
};

export type NormalizedSurveyQuestion = {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'rating';
  options?: NormalizedSurveyOption[];
  required?: boolean;
  minRating?: number;
  maxRating?: number;
};

function resolveI18nValue(value: any, lang: 'de' | 'en', fallback = ''): string {
  if (value && typeof value === 'object') {
    const preferred = lang === 'en' ? value.en : value.de;
    const secondary = lang === 'en' ? value.de : value.en;
    if (typeof preferred === 'string' && preferred.trim()) return preferred;
    if (typeof secondary === 'string' && secondary.trim()) return secondary;
  }
  if (typeof value === 'string') return value;
  return fallback;
}

function getCurrentLang(): 'de' | 'en' {
  const lang = i18next.language === 'en' ? 'en' : 'de';
  return lang;
}

export function normalizeQuizQuestionsForDisplay(payload: any): NormalizedQuizQuestion[] {
  const lang = getCurrentLang();
  if (!Array.isArray(payload)) return [];
  return payload.map((question: any, qIndex: number) => {
    const answers = Array.isArray(question?.answers)
      ? question.answers
      : Array.isArray(question?.options)
        ? question.options
        : [];
    const options: NormalizedQuizOption[] = answers.map((answer: any, idx: number) => {
      if (typeof answer === 'string') {
        return { id: `${qIndex}_${idx}`, label: answer };
      }
      const label = resolveI18nValue(
        answer?.text_i18n ?? answer?.option_i18n,
        lang,
        answer?.text ?? answer?.value ?? ''
      );
      return { id: answer?.id ?? `${qIndex}_${idx}`, label };
    });
    return {
      id: question?.id ?? `q_${qIndex}`,
      question: resolveI18nValue(question?.prompt_i18n, lang, question?.question ?? question?.prompt ?? ''),
      options,
    };
  });
}

export function normalizeSurveyQuestionsForDisplay(payload: any): NormalizedSurveyQuestion[] {
  const lang = getCurrentLang();
  if (!Array.isArray(payload)) return [];
  return payload.map((question: any, qIndex: number) => {
    const optionsRaw = Array.isArray(question?.options) ? question.options : undefined;
    const options = optionsRaw?.map((option: any, idx: number) => {
      if (typeof option === 'string') return { id: `${qIndex}_${idx}`, label: option };
      return {
        id: option?.id ?? `${qIndex}_${idx}`,
        label: resolveI18nValue(option?.option_i18n, lang, option?.text ?? option?.value ?? ''),
      };
    });
    return {
      id: question?.id ?? `s_${qIndex}`,
      question: resolveI18nValue(question?.question_i18n, lang, question?.question ?? ''),
      type: question?.type ?? 'single_choice',
      options,
      required: question?.required,
      minRating: question?.minRating,
      maxRating: question?.maxRating,
    };
  });
}
