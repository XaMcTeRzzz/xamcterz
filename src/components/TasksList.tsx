import { useState, useEffect } from "react";
import { TaskCard } from "@/components/TaskCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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

export interface Task {
  id: string;            // Унікальний ідентифікатор
  title: string;         // Тема задачі
  description?: string;  // Опис задачі (опціональний)
  completed: boolean;    // Статус виконання
  date: Date;            // Дата та час виконання
  category?: string;     // Категорія (опціональне)
  createdAt?: Date;      // Дата створення (нове поле)
}

interface TasksListProps {
  tasks: Task[];
  date?: Date;
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onEditTask: (id: string, updatedTask: { title: string; description?: string; date: Date; category?: string }) => void;
}

export function TasksList({ tasks, date, onTaskComplete, onTaskDelete, onEditTask }: TasksListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [completedTasks, setCompletedTasks] = useState(
    tasks.filter(task => task.completed).length
  );
  
  useEffect(() => {
    setCompletedTasks(tasks.filter(task => task.completed).length);
  }, [tasks]);
  
  const dateFilteredTasks = date 
    ? tasks.filter(task => 
        task.date.getDate() === date.getDate() &&
        task.date.getMonth() === date.getMonth() &&
        task.date.getFullYear() === date.getFullYear()
      )
    : tasks;

  const filteredTasks = searchQuery
    ? dateFilteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.category && task.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : dateFilteredTasks;

  const handleComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setCompletedTasks(prev => task.completed ? prev - 1 : prev + 1);
    }
    onTaskComplete(id);
  };

  const handleDelete = (id: string) => {
    onTaskDelete(id);
  };

  const handleEdit = (id: string, updatedTask: { title: string; description?: string; date: Date; category?: string }) => {
    onEditTask(id, updatedTask);
  };

  const formattedDate = date
    ? new Intl.DateTimeFormat('uk', {
        weekday: 'long', 
        day: 'numeric', 
        month: 'long'
      }).format(date)
    : "Всі задачі";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary capitalize">{formattedDate}</h2>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
          {filteredTasks.length} {getTaskWordForm(filteredTasks.length)}
        </span>
      </div>
      
      <ProgressBar completed={completedTasks} total={tasks.length} />
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Пошук задач..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass-card border-neon-green/50 focus-visible:ring-neon-green"
        />
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          {searchQuery ? (
            <p>Задачі за запитом "{searchQuery}" не знайдено</p>
          ) : (
            <>
              <p>Немає задач на цей день</p>
              <p className="text-sm mt-1">Додайте нову задачу, натиснувши на кнопку +</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              description={task.description}
              completed={task.completed}
              date={task.date}
              category={task.category}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
