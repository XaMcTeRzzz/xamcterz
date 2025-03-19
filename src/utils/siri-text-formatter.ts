import { Task } from "@/types/task";
import { SiriSettings } from "@/types/settings";
import { formatTaskCount, formatTimeForSpeech } from "./ukranian-numerals";
import { applyStress, formatGreetingWithStress, formatTaskTextWithStress } from "./ukrainian-pronunciation";

/**
 * Форматує привітання
 */
export const formatGreeting = (settings: SiriSettings): string => {
  return formatGreetingWithStress(settings);
};

/**
 * Форматує текст для списку задач
 */
export const formatTasksText = (tasks: Task[], settings: SiriSettings): string => {
  if (tasks.length === 0) {
    return applyStress(`На сьогодні у вас немає активних задач. Ви вільні, ${settings.userTitle || 'сер'}. Чим ще можу допомогти?`);
  }

  // Використовуємо утиліту для форматування кількості задач з наголосами
  let tasksText = applyStress(`На сьогодні у вас ${formatTaskCount(tasks.length)}. `);

  // Сортуємо задачі за часом
  const sortedTasks = [...tasks].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Використовуємо утиліту для форматування часу та тексту задач з наголосами
  sortedTasks.forEach(task => {
    const taskDate = new Date(task.date);
    const hours = taskDate.getHours();
    const minutes = taskDate.getMinutes();
    
    const timeText = formatTimeForSpeech(hours, minutes);
    const taskTitle = formatTaskTextWithStress(task.title);
    
    tasksText += `${applyStress(timeText)} - ${taskTitle}. `;
  });

  return tasksText + applyStress("Чим ще можу допомогти?");
}; 