interface WordPronunciation {
  word: string;
  pronunciation: string;
}

// Словник для заміни слів на їх правильну вимову
export const pronunciationDictionary: WordPronunciation[] = [
  // Числівники
  { word: "один", pronunciation: "одиин" },
  { word: "одна", pronunciation: "однаа" },
  { word: "два", pronunciation: "дваа" },
  { word: "три", pronunciation: "трии" },
  { word: "чотири", pronunciation: "чотиири" },
  { word: "п'ять", pronunciation: "пйать" },
  { word: "шість", pronunciation: "шіість" },
  { word: "сім", pronunciation: "сіім" },
  { word: "вісім", pronunciation: "віісім" },
  { word: "дев'ять", pronunciation: "девйать" },
  { word: "десять", pronunciation: "деесять" },
  
  // Місяці
  { word: "січень", pronunciation: "сіічень" },
  { word: "лютий", pronunciation: "люютий" },
  { word: "березень", pronunciation: "беерезень" },
  { word: "квітень", pronunciation: "квіітень" },
  { word: "травень", pronunciation: "траавень" },
  { word: "червень", pronunciation: "чеервень" },
  { word: "липень", pronunciation: "лиипень" },
  { word: "серпень", pronunciation: "сеерпень" },
  { word: "вересень", pronunciation: "веересень" },
  { word: "жовтень", pronunciation: "жоовтень" },
  { word: "листопад", pronunciation: "листопаад" },
  { word: "грудень", pronunciation: "груудень" },
  
  // Дні тижня
  { word: "понеділок", pronunciation: "понедіілок" },
  { word: "вівторок", pronunciation: "віівторок" },
  { word: "середа", pronunciation: "середаа" },
  { word: "четвер", pronunciation: "четвеер" },
  { word: "п'ятниця", pronunciation: "пйатниця" },
  { word: "субота", pronunciation: "субоота" },
  { word: "неділя", pronunciation: "недііля" },
  
  // Загальні слова
  { word: "задача", pronunciation: "заадача" },
  { word: "задачі", pronunciation: "заадачі" },
  { word: "задач", pronunciation: "заадач" },
  { word: "година", pronunciation: "годиина" },
  { word: "години", pronunciation: "годиини" },
  { word: "годин", pronunciation: "годиин" },
  { word: "хвилина", pronunciation: "хвилиина" },
  { word: "хвилини", pronunciation: "хвилиини" },
  { word: "хвилин", pronunciation: "хвилиин" },
  { word: "привіт", pronunciation: "привііт" },
  { word: "добрий", pronunciation: "дообрий" },
  { word: "день", pronunciation: "деень" },
  { word: "ранок", pronunciation: "раанок" },
  { word: "вечір", pronunciation: "веечір" },
  { word: "ніч", pronunciation: "нііч" }
];

/**
 * Замінює слова на їх правильну вимову
 * @param text - текст для обробки
 * @returns текст з правильною вимовою
 */
export const applyPronunciation = (text: string): string => {
  let result = text;
  
  // Застосовуємо заміни з словника
  pronunciationDictionary.forEach(({ word, pronunciation }) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, pronunciation);
  });
  
  return result;
};

/**
 * Додає паузи між реченнями для природнішого звучання
 * @param text - текст для обробки
 * @returns текст з паузами
 */
export const addSpeechPauses = (text: string): string => {
  // Додаємо паузу після крапки
  text = text.replace(/\./g, '... ');
  
  // Додаємо паузу після коми
  text = text.replace(/,/g, ', ');
  
  // Додаємо паузу після знаку оклику
  text = text.replace(/!/g, '... ');
  
  // Додаємо паузу після знаку питання
  text = text.replace(/\?/g, '... ');
  
  return text;
}; 