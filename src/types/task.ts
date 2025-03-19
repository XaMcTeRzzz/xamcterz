/**
 * Інтерфейс для задачі
 */
export interface Task {
  /** Унікальний ідентифікатор задачі */
  id: string;
  
  /** Назва задачі */
  title: string;
  
  /** Опис задачі */
  description?: string;
  
  /** Дата та час виконання */
  date: Date;
  
  /** Статус виконання */
  completed: boolean;
  
  /** Категорія задачі */
  category?: string;
  
  /** Дата створення */
  createdAt: Date;
} 