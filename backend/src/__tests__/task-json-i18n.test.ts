import { describe, expect, it } from '@jest/globals';
import {
  isQuizAnswerCorrect,
  resolveQuizQuestionsI18n,
  resolveSurveyQuestionsI18n,
} from '../services/task.service.js';

describe('task json i18n helpers', () => {
  it('resolves quiz question and answer labels for preferred language', () => {
    const resolved = resolveQuizQuestionsI18n(
      [
        {
          id: 'q1',
          prompt_i18n: { de: 'Frage', en: 'Question' },
          answers: [
            { id: 'a1', text_i18n: { de: 'Ja', en: 'Yes' } },
            { id: 'a2', text_i18n: { de: 'Nein', en: 'No' } },
          ],
          correctAnswerId: 'a1',
        },
      ],
      'en'
    );

    expect(resolved[0].question).toBe('Question');
    expect(resolved[0].options).toEqual(['Yes', 'No']);
  });

  it('resolves survey question and option labels for preferred language', () => {
    const resolved = resolveSurveyQuestionsI18n(
      [
        {
          id: 's1',
          question_i18n: { de: 'Wie?', en: 'How?' },
          type: 'single_choice',
          options: [
            { id: 'o1', option_i18n: { de: 'Gut', en: 'Good' } },
            { id: 'o2', option_i18n: { de: 'Schlecht', en: 'Bad' } },
          ],
        },
      ],
      'en'
    );

    expect(resolved[0].question).toBe('How?');
    expect(resolved[0].options).toEqual(['Good', 'Bad']);
  });

  it('accepts answer id and localized answer text for quiz validation', () => {
    const answers = [
      { id: 'a1', text: 'Yes', text_i18n: { de: 'Ja', en: 'Yes' } },
      { id: 'a2', text: 'No', text_i18n: { de: 'Nein', en: 'No' } },
    ];

    expect(
      isQuizAnswerCorrect({
        questionAnswers: answers,
        expectedAnswerId: 'a1',
        expectedAnswerText: 'Yes',
        selectedAnswerId: 'a1',
        selectedAnswerText: 'Ja',
      })
    ).toBe(true);

    expect(
      isQuizAnswerCorrect({
        questionAnswers: answers,
        expectedAnswerId: 'a1',
        expectedAnswerText: 'Yes',
        selectedAnswerId: null,
        selectedAnswerText: 'Ja',
      })
    ).toBe(true);
  });
});
