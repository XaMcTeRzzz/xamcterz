import { SiriSettings } from "@/types/settings";

/**
 * Словник для заміни слів на їх правильну вимову
 */
const pronunciationMap: Record<string, string> = {
  'задача': 'задАча',
  'задачі': 'задАчі',
  'задач': 'задАч',
  'година': 'годИна',
  'години': 'годИни',
  'годин': 'годИн',
  'хвилина': 'хвилИна',
  'хвилини': 'хвилИни',
  'хвилин': 'хвилИн',
  'сьогодні': 'сьогОдні',
  'активних': 'актИвних',
  'вільні': 'вІльні',
  'допомогти': 'допомогтИ',
  'зробити': 'зробИти',
  'виконати': 'вИконати',
  'перевірити': 'перевІрити',
  'нагадати': 'нагадАти',
  'показати': 'показАти',
  'створити': 'створИти',
  'видалити': 'видалИти',
  'змінити': 'змінИти',
  'оновити': 'оновИти'
};

/**
 * Додаткові правила вимови для чисел
 */
const numberPronunciationRules: Record<string, string> = {
  '1': 'однА',
  '2': 'двІ',
  '3': 'трИ',
  '4': 'чотИри',
  '5': "п'Ять",
  '6': 'шІсть',
  '7': 'сІм',
  '8': 'вІсім',
  '9': "дЕв'ять",
  '10': 'дЕсять',
  '11': 'одинАдцять',
  '12': 'дванАдцять',
  '13': 'тринАдцять',
  '14': 'чотирнАдцять',
  '15': "п'ятнАдцять",
  '16': 'шістнАдцять',
  '17': 'сімнАдцять',
  '18': 'вісімнАдцять',
  '19': "дев'ятнАдцять",
  '20': 'двАдцять'
};

/**
 * Застосовує правильні наголоси до тексту
 */
export const applyStress = (text: string): string => {
  let result = text;
  
  // Заміна слів на їх версії з наголосами
  Object.entries(pronunciationMap).forEach(([word, stressedWord]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, stressedWord);
  });
  
  // Заміна чисел на їх вимову з наголосами
  Object.entries(numberPronunciationRules).forEach(([number, pronunciation]) => {
    const regex = new RegExp(`\\b${number}\\b`, 'g');
    result = result.replace(regex, pronunciation);
  });
  
  return result;
};

/**
 * Форматує привітання з правильними наголосами
 */
export const formatGreetingWithStress = (settings: SiriSettings): string => {
  const { userName, userTitle = 'сер' } = settings;
  const baseGreeting = `Вітаю${userName ? `, ${userName}` : ''} ${userTitle}`;
  return applyStress(baseGreeting);
};

/**
 * Форматує текст задачі з правильними наголосами
 */
export const formatTaskTextWithStress = (text: string): string => {
  return applyStress(text);
}; 