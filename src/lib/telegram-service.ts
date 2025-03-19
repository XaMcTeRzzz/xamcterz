/**
 * Сервіс для взаємодії з Telegram API
 */

// Інтерфейс для налаштувань Telegram
export interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
  reportSchedule: {
    daily: boolean;
    weekly: boolean;
    dailyTime: string; // формат "HH:MM"
    weeklyDay: number; // 0-6 (неділя-субота)
    weeklyTime: string; // формат "HH:MM"
  };
}

// Ключ для зберігання налаштувань в localStorage
export const TELEGRAM_SETTINGS_KEY = "telegram_settings";

// Значення за замовчуванням
export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  botToken: "",
  chatId: "",
  enabled: false,
  reportSchedule: {
    daily: false,
    weekly: false,
    dailyTime: "20:00",
    weeklyDay: 5, // П'ятниця
    weeklyTime: "18:00",
  },
};

/**
 * Завантажує налаштування Telegram з localStorage
 */
export const loadTelegramSettings = (): TelegramSettings => {
  try {
    const savedSettings = localStorage.getItem(TELEGRAM_SETTINGS_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error("Помилка завантаження налаштувань Telegram:", error);
  }
  return DEFAULT_TELEGRAM_SETTINGS;
};

/**
 * Зберігає налаштування Telegram в localStorage
 */
export const saveTelegramSettings = (settings: TelegramSettings): void => {
  try {
    localStorage.setItem(TELEGRAM_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Помилка збереження налаштувань Telegram:", error);
  }
};

/**
 * Відправляє повідомлення через Telegram бот
 */
export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Помилка відправки повідомлення в Telegram:", error);
    return false;
  }
};

/**
 * Перевіряє валідність токена бота
 */
export const validateBotToken = async (botToken: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Помилка перевірки токена бота:", error);
    return false;
  }
};

/**
 * Повертає правильний відмінок слова "задача" залежно від кількості
 */
const getTaskWordForm = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'задача';
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'задачі';
  } else {
    return 'задач';
  }
};

/**
 * Безпечно форматує дату, повертаючи запасний текст у випадку Invalid Date
 */
const safeFormatDate = (dateStr: string, options: Intl.DateTimeFormatOptions): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'дата не вказана';
    }
    return date.toLocaleDateString('uk-UA', options);
  } catch (error) {
    console.error('Помилка форматування дати:', error);
    return 'дата не вказана';
  }
};

/**
 * Форматує звіт про задачі за день
 */
export const formatDailyReport = (tasks: any[], date: Date): string => {
  const formattedDate = date.toLocaleDateString('uk-UA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  let report = `<b>ЩОДЕННИЙ ЗВІТ ЗА ${formattedDate.toUpperCase()}</b>\n\n`;
  
  if (tasks.length === 0) {
    report += "🔍 Немає задач.";
    return report;
  }
  
  // Сортуємо задачі за датою створення, якщо вона є
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });
  
  // Розділяємо задачі на виконані та активні
  const completedTasks = sortedTasks.filter(task => task.completed);
  const activeTasks = sortedTasks.filter(task => !task.completed);
  
  // Додаємо заголовок з кількістю задач
  const taskWord = getTaskWordForm(tasks.length);
  report += `<b>📋 ВСІ ЗАДАЧІ (${tasks.length} ${taskWord}):</b>\n\n`;
  
  // Додаємо активні задачі
  const activeWord = getTaskWordForm(activeTasks.length);
  report += `<b>⏳ АКТИВНІ ЗАДАЧІ (${activeTasks.length} ${activeWord}):</b>\n`;
  if (activeTasks.length > 0) {
    report += `• Поточні:\n`;
    activeTasks.forEach((task, index) => {
      const dateInfo = task.dueDate ? safeFormatDate(task.dueDate, { day: 'numeric', month: 'long' }) : 'дата не вказана';
      report += `   ${index + 1}. ${task.title} (${dateInfo})\n`;
    });
  } else {
    report += "   Немає активних задач\n";
  }
  
  // Додаємо виконані задачі
  report += `\n<b>✅ ВИКОНАНІ ЗАДАЧІ (${completedTasks.length} ${getTaskWordForm(completedTasks.length)}):</b>\n`;
  if (completedTasks.length > 0) {
    completedTasks.forEach((task, index) => {
      report += `   ${index + 1}. ${task.title}\n`;
    });
  } else {
    report += "   Немає виконаних задач\n";
  }
  
  // Додаємо підсумок
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  report += `\n<b>📊 ПРОГРЕС: ${completionRate}%</b>`;
  
  return report;
};

/**
 * Форматує звіт про задачі за тиждень
 */
export const formatWeeklyReport = (tasks: any[], startDate: Date, endDate: Date): string => {
  const startFormatted = startDate.toLocaleDateString('uk-UA', { 
    day: 'numeric', 
    month: 'long'
  });
  
  const endFormatted = endDate.toLocaleDateString('uk-UA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  let report = `<b>📊 ТИЖНЕВИЙ ЗВІТ</b>\n`;
  report += `<b>📆 ${startFormatted.toUpperCase()} - ${endFormatted.toUpperCase()}</b>\n\n`;
  
  if (tasks.length === 0) {
    report += "🔍 Немає задач за цей період.";
    return report;
  }
  
  // Сортуємо задачі за датою створення, якщо вона є
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });
  
  // Розділяємо задачі на виконані та активні
  const completedTasks = sortedTasks.filter(task => task.completed);
  const activeTasks = sortedTasks.filter(task => !task.completed);
  
  // Підраховуємо прогрес
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  
  // Додаємо заголовок з кількістю задач
  const taskWord = getTaskWordForm(tasks.length);
  report += `<b>📋 ВСІ ЗАДАЧІ (${tasks.length} ${taskWord}):</b>\n`;
  report += `<b>📈 ЗАГАЛЬНИЙ ПРОГРЕС: ${completionRate}%</b>\n\n`;
  
  // Додаємо активні задачі
  const activeWord = getTaskWordForm(activeTasks.length);
  report += `<b>⏳ АКТИВНІ ЗАДАЧІ (${activeTasks.length} ${activeWord}):</b>\n`;
  if (activeTasks.length > 0) {
    activeTasks.forEach((task, index) => {
      const dateInfo = task.dueDate ? safeFormatDate(task.dueDate, { day: 'numeric', month: 'long' }) : 'дата не вказана';
      report += `   ${index + 1}. ${task.title} (${dateInfo})\n`;
    });
  } else {
    report += "   Немає активних задач\n";
  }
  
  // Додаємо виконані задачі
  report += `\n<b>✅ ВИКОНАНІ ЗАДАЧІ (${completedTasks.length} ${getTaskWordForm(completedTasks.length)}):</b>\n`;
  if (completedTasks.length > 0) {
    completedTasks.forEach((task, index) => {
      const dateInfo = task.dueDate ? safeFormatDate(task.dueDate, { day: 'numeric', month: 'long' }) : '';
      report += `   ${index + 1}. ${task.title}${dateInfo ? ` (${dateInfo})` : ''}\n`;
    });
  } else {
    report += "   Немає виконаних задач\n";
  }
  
  return report;
};

/**
 * Відправляє тестовий звіт
 */
export const sendTestReport = async (): Promise<boolean> => {
  const settings = loadTelegramSettings();
  
  if (!settings.enabled || !settings.botToken || !settings.chatId) {
    return false;
  }
  
  // Отримуємо всі задачі з localStorage
  try {
    const tasksJson = localStorage.getItem('tasks');
    const allTasks = tasksJson ? JSON.parse(tasksJson) : [];
    
    const today = new Date();
    const formattedDate = today.toLocaleDateString('uk-UA', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    let message = `<b>🧪 ТЕСТОВИЙ ЗВІТ</b>\n\n` +
      `Це тестове повідомлення для перевірки налаштувань Telegram бота.\n\n` +
      `<b>📅 Дата:</b> ${formattedDate}\n` +
      `<b>⏰ Час:</b> ${today.toLocaleTimeString('uk-UA')}\n\n`;
    
    // Додаємо інформацію про всі задачі
    const totalWord = getTaskWordForm(allTasks.length);
    message += `<b>📋 ВСІ ЗАДАЧІ (${allTasks.length} ${totalWord}):</b>\n\n`;
    
    if (allTasks.length === 0) {
      message += "У вас немає жодних задач.\n";
    } else {
      const activeTasks = allTasks.filter((task: any) => !task.completed);
      const completedTasks = allTasks.filter((task: any) => task.completed);
      
      const activeWord = getTaskWordForm(activeTasks.length);
      message += `<b>⏳ АКТИВНІ ЗАДАЧІ (${activeTasks.length} ${activeWord}):</b>\n`;
      if (activeTasks.length > 0) {
        activeTasks.forEach((task: any, index: number) => {
          const formattedTaskDate = safeFormatDate(task.dueDate, { 
            day: 'numeric', 
            month: 'long'
          });
          message += `   ${index + 1}. ${task.title} (${formattedTaskDate})\n`;
        });
      } else {
        message += "   Немає активних задач\n";
      }
      
      const completedWord = getTaskWordForm(completedTasks.length);
      message += `\n<b>✅ ВИКОНАНІ ЗАДАЧІ (${completedTasks.length} ${completedWord}):</b>\n`;
      if (completedTasks.length > 0) {
        completedTasks.slice(0, 5).forEach((task: any, index: number) => {
          message += `   ${index + 1}. ${task.title}\n`;
        });
        
        if (completedTasks.length > 5) {
          const remainingWord = getTaskWordForm(completedTasks.length - 5);
          message += `   ... та ще ${completedTasks.length - 5} ${remainingWord}\n`;
        }
      } else {
        message += "   Немає виконаних задач\n";
      }
    }
    
    message += `\n<b>✨ Якщо ви бачите це повідомлення, значить налаштування бота працюють коректно.</b>`;
    
    return await sendTelegramMessage(settings.botToken, settings.chatId, message);
  } catch (error) {
    console.error("Помилка при формуванні тестового звіту:", error);
    return false;
  }
}; 