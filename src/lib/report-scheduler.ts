/**
 * Сервіс для планування та відправки звітів
 */

import { 
  TelegramSettings, 
  loadTelegramSettings, 
  sendTelegramMessage, 
  formatDailyReport, 
  formatWeeklyReport 
} from './telegram-service';

// Ключ для зберігання задач в localStorage
const TASKS_STORAGE_KEY = 'tasks';

// Інтерфейс для задачі
interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt?: string;
}

/**
 * Завантажує задачі з localStorage
 */
const loadTasks = (): Task[] => {
  try {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error('Помилка завантаження задач:', error);
    return [];
  }
};

/**
 * Безпечно перетворює рядок дати в об'єкт Date
 */
const safeParseDate = (dateStr: string): Date | null => {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Помилка парсингу дати:', error);
    return null;
  }
};

/**
 * Фільтрує задачі за вказаним діапазоном дат
 */
const filterTasksByDateRange = (tasks: Task[], startDate: Date, endDate: Date): Task[] => {
  return tasks.filter(task => {
    const taskDate = safeParseDate(task.dueDate);
    if (!taskDate) return false;
    
    // Встановлюємо час на 0, щоб порівнювати тільки дати
    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return taskDateOnly >= startDateOnly && taskDateOnly <= endDateOnly;
  });
};

/**
 * Отримує задачі за вказаний день
 */
const getTasksForDay = (date: Date): Task[] => {
  // Повертаємо всі задачі, незалежно від дати
  return loadTasks();
};

/**
 * Отримує задачі за вказаний тиждень
 */
const getTasksForWeek = (date: Date): { tasks: Task[], startDate: Date, endDate: Date } => {
  const tasks = loadTasks();
  
  // Знаходимо початок тижня (понеділок)
  const startDate = new Date(date);
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Якщо неділя, то -6, інакше +1
  startDate.setDate(diff);
  startDate.setHours(0, 0, 0, 0);
  
  // Знаходимо кінець тижня (неділя)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  // Отримуємо всі задачі
  return { 
    tasks: tasks, 
    startDate, 
    endDate 
  };
};

/**
 * Перевіряє, чи потрібно відправити щоденний звіт
 */
const shouldSendDailyReport = (settings: TelegramSettings): boolean => {
  if (!settings.enabled || !settings.reportSchedule.daily) {
    return false;
  }
  
  const now = new Date();
  const [hours, minutes] = settings.reportSchedule.dailyTime.split(':').map(Number);
  
  return now.getHours() === hours && now.getMinutes() === minutes;
};

/**
 * Перевіряє, чи потрібно відправити щотижневий звіт
 */
const shouldSendWeeklyReport = (settings: TelegramSettings): boolean => {
  if (!settings.enabled || !settings.reportSchedule.weekly) {
    return false;
  }
  
  const now = new Date();
  const [hours, minutes] = settings.reportSchedule.weeklyTime.split(':').map(Number);
  
  return now.getDay() === settings.reportSchedule.weeklyDay && 
         now.getHours() === hours && 
         now.getMinutes() === minutes;
};

/**
 * Відправляє щоденний звіт
 */
const sendDailyReport = async (): Promise<boolean> => {
  const settings = loadTelegramSettings();
  
  if (!settings.enabled || !settings.reportSchedule.daily) {
    return false;
  }
  
  const today = new Date();
  const tasks = getTasksForDay(today);
  const report = formatDailyReport(tasks, today);
  
  return await sendTelegramMessage(settings.botToken, settings.chatId, report);
};

/**
 * Відправляє щотижневий звіт
 */
const sendWeeklyReport = async (): Promise<boolean> => {
  const settings = loadTelegramSettings();
  
  if (!settings.enabled || !settings.reportSchedule.weekly) {
    return false;
  }
  
  const today = new Date();
  const { tasks, startDate, endDate } = getTasksForWeek(today);
  const report = formatWeeklyReport(tasks, startDate, endDate);
  
  return await sendTelegramMessage(settings.botToken, settings.chatId, report);
};

/**
 * Ініціалізує планувальник звітів
 */
export const initReportScheduler = (): void => {
  console.log('Ініціалізуємо планувальник звітів...');
  
  // Додаємо контроль часу останньої відправки, щоб запобігти багаторазовій відправці
  let lastDailyReportTime = '';
  let lastWeeklyReportTime = '';
  
  // Перевіряємо кожні 15 секунд, чи потрібно відправити звіт
  setInterval(() => {
    try {
      // Перезавантажуємо налаштування при кожній перевірці, 
      // щоб врахувати можливі зміни
      const settings = loadTelegramSettings();
      
      // Отримуємо поточний час у форматі HH:MM, який використовується для порівняння
      const now = new Date();
      const currentTimeStr = `${now.getHours()}:${now.getMinutes()}`;
      
      console.log(`Перевірка розкладу звітів: ${currentTimeStr}`);
      
      // Перевіряємо щоденний звіт
      if (shouldSendDailyReport(settings) && lastDailyReportTime !== currentTimeStr) {
        lastDailyReportTime = currentTimeStr;
        
        console.log(`Відправка щоденного звіту o ${currentTimeStr}`);
        
        sendDailyReport()
          .then(success => {
            if (success) {
              console.log('Щоденний звіт успішно відправлено');
            } else {
              console.error('Помилка відправки щоденного звіту');
            }
          })
          .catch(error => {
            console.error('Помилка під час відправки щоденного звіту:', error);
          });
      }
      
      // Перевіряємо щотижневий звіт
      if (shouldSendWeeklyReport(settings) && lastWeeklyReportTime !== currentTimeStr) {
        lastWeeklyReportTime = currentTimeStr;
        
        console.log(`Відправка щотижневого звіту o ${currentTimeStr}`);
        
        sendWeeklyReport()
          .then(success => {
            if (success) {
              console.log('Щотижневий звіт успішно відправлено');
            } else {
              console.error('Помилка відправки щотижневого звіту');
            }
          })
          .catch(error => {
            console.error('Помилка під час відправки щотижневого звіту:', error);
          });
      }
    } catch (error) {
      console.error('Помилка в планувальнику звітів:', error);
    }
  }, 15000); // Перевіряємо кожні 15 секунд
  
  console.log('Планувальник звітів ініціалізовано');
};

/**
 * Відправляє тестовий звіт
 */
export const sendTestReport = async (): Promise<boolean> => {
  const settings = loadTelegramSettings();
  
  if (!settings.enabled) {
    return false;
  }
  
  try {
    // Отримуємо всі задачі
    const today = new Date();
    const reportDate = new Date(today);
    const tasks = getTasksForDay(today);
    
    // Використовуємо функцію форматування звіту
    const report = formatDailyReport(tasks, today);
    
    // Додаємо заголовок тестового звіту
    const testReport = `<b>🧪 ТЕСТОВИЙ ЗВІТ</b>\n<b>⏰ Час генерації:</b> ${reportDate.toLocaleTimeString('uk-UA')}\n\n${report}`;
    
    return await sendTelegramMessage(settings.botToken, settings.chatId, testReport);
  } catch (error) {
    console.error('Помилка відправки тестового звіту:', error);
    return false;
  }
}; 