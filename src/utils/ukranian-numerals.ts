/**
 * Повертає правильну форму слова "задача" залежно від числа
 * @param count - кількість
 * @returns правильна форма слова
 */
export const getTaskForm = (count: number): string => {
  // Особливі випадки для чисел від 11 до 14
  if (count % 100 >= 11 && count % 100 <= 14) {
    return "задач";
  }

  // Для всіх інших чисел дивимося на останню цифру
  switch (count % 10) {
    case 1:
      return "задача";
    case 2:
    case 3:
    case 4:
      return "задачі";
    default:
      return "задач";
  }
};

/**
 * Форматує текст з числом та словом "задача"
 * @param count - кількість
 * @returns відформатований текст
 */
export const formatTaskCount = (count: number): string => {
  return `${count} ${getTaskForm(count)}`;
};

/**
 * Повертає правильну форму слова "година" залежно від числа
 * @param hours - кількість годин
 * @returns правильна форма слова
 */
export const getHourForm = (hours: number): string => {
  // Особливі випадки для чисел від 11 до 14
  if (hours % 100 >= 11 && hours % 100 <= 14) {
    return "годин";
  }

  // Для всіх інших чисел дивимося на останню цифру
  switch (hours % 10) {
    case 1:
      return "година";
    case 2:
    case 3:
    case 4:
      return "години";
    default:
      return "годин";
  }
};

/**
 * Повертає правильну форму слова "хвилина" залежно від числа
 * @param minutes - кількість хвилин
 * @returns правильна форма слова
 */
export const getMinuteForm = (minutes: number): string => {
  // Особливі випадки для чисел від 11 до 14
  if (minutes % 100 >= 11 && minutes % 100 <= 14) {
    return "хвилин";
  }

  // Для всіх інших чисел дивимося на останню цифру
  switch (minutes % 10) {
    case 1:
      return "хвилина";
    case 2:
    case 3:
    case 4:
      return "хвилини";
    default:
      return "хвилин";
  }
};

/**
 * Форматує час для мовлення
 * @param hours - години
 * @param minutes - хвилини
 * @returns відформатований текст часу
 */
export const formatTimeForSpeech = (hours: number, minutes: number): string => {
  const hourForm = getHourForm(hours);
  
  if (minutes === 0) {
    return `в ${hours} ${hourForm}`;
  }
  
  const minuteForm = getMinuteForm(minutes);
  return `в ${hours} ${hourForm} ${minutes} ${minuteForm}`;
}; 