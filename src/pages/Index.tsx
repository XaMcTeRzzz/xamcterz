import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { TaskCalendar } from "@/components/TaskCalendar";
import { TasksList, Task } from "@/components/TasksList";
import { AddTaskButton } from "@/components/AddTaskButton";
import { AddTaskForm } from "@/components/AddTaskForm";
import { Settings } from "@/components/Settings";
import { SiriAssistant } from "@/components/SiriAssistant";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/Calendar";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const generateSampleTasks = (): Task[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return [
    {
      id: "1",
      title: "Зустріч з клієнтом",
      description: "Обговорити нові вимоги до проекту",
      completed: false,
      date: new Date(today.setHours(10, 0)),
      category: "work"
    },
    {
      id: "2",
      title: "Тренування",
      completed: true,
      date: new Date(today.setHours(18, 30)),
      category: "health"
    },
    {
      id: "3",
      title: "Купити продукти",
      description: "Молоко, хліб, яйця, овочі",
      completed: false,
      date: new Date(tomorrow.setHours(12, 0)),
      category: "personal"
    }
  ];
};

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  
  // Додаємо стан для відстеження статусу прослуховування Siri AI
  const [isListening, setIsListening] = useState(false);
  const siriAssistantRef = useRef<{ startListening?: () => void }>(null);
  
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          date: new Date(task.date),
          createdAt: task.createdAt ? new Date(task.createdAt) : undefined
        }));
        setTasks(tasksWithDates);
      } catch (error) {
        console.error('Помилка при завантаженні задач:', error);
        // Якщо помилка при завантаженні, використовуємо тестові дані
        setTasks(generateSampleTasks());
      }
    } else {
      // Якщо немає збережених задач, використовуємо тестові дані
      setTasks(generateSampleTasks());
    }
  }, []);
  
  useEffect(() => {
    // Перед збереженням переконаємося, що задачі мають правильний формат
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setActiveTab("calendar");
  };
  
  const handleAddTask = (date: Date) => {
    setSelectedDate(date);
    setShowAddForm(true);
  };
  
  const handleTaskSubmit = (taskData: {
    title: string;
    description?: string;
    date: Date;
    time: string;
    category?: string;
  }) => {
    try {
      // Створення об'єкта дати з годиною та хвилинами
      const [hours, minutes] = taskData.time.split(':').map(Number);
      const taskDate = new Date(taskData.date);
      taskDate.setHours(hours, minutes, 0);
      
      // Створення об'єкта задачі
      const newTask: Task = {
        id: uuidv4(),
        title: taskData.title,
        description: taskData.description,
        date: taskDate,
        completed: false,
        category: taskData.category,
        createdAt: new Date() // Додаємо дату створення
      };
      
      // Додавання задачі до списку
      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks, newTask];
        
        // Перетворюємо дати в рядки перед збереженням в localStorage
        const tasksForStorage = updatedTasks.map(task => ({
          ...task,
          date: task.date.toISOString(), // Зберігаємо дату в ISO форматі
          createdAt: task.createdAt ? task.createdAt.toISOString() : undefined // Зберігаємо дату створення в ISO форматі, якщо вона є
        }));
        
        localStorage.setItem('tasks', JSON.stringify(tasksForStorage));
        return updatedTasks;
      });
      
      // Закриття форми
      setShowAddForm(false);
      
      // Сповіщення користувача
      toast({
        title: "Задачу додано",
        description: `"${taskData.title}" додано на ${taskDate.toLocaleDateString('uk')}`,
      });
      
      // Спроба відправити сповіщення через налаштовані канали
      sendTaskNotifications(newTask);
    } catch (error) {
      console.error("Помилка при додаванні задачі:", error);
      toast({
        title: "Помилка додавання",
        description: "Не вдалося додати задачу. Спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };
  
  // Функція для відправки сповіщень через налаштовані канали
  const sendTaskNotifications = (task: Task) => {
    try {
      const savedSettings = localStorage.getItem("userSettings");
      if (!savedSettings) return;
      
      const settings = JSON.parse(savedSettings);
      
      // Перевіряємо налаштування Telegram і відправляємо сповіщення
      if (settings.telegramBotEnabled && settings.telegramUsername) {
        console.log("Відправляємо сповіщення в Telegram для:", settings.telegramUsername);
        // В реальному додатку тут був би API-запит до сервера для відправки повідомлення
        toast({
          title: "Telegram нагадування",
          description: "Нагадування буде відправлено через Telegram",
        });
      }
      
      // Перевіряємо налаштування Email і відправляємо сповіщення
      if (settings.emailEnabled && settings.emailAddress) {
        console.log("Відправляємо сповіщення на Email:", settings.emailAddress);
        // В реальному додатку тут був би API-запит до сервера для відправки email
        toast({
          title: "Email нагадування",
          description: "Нагадування буде відправлено на вашу електронну пошту",
        });
      }
      
      // Перевіряємо налаштування Google Calendar і додаємо подію
      if (settings.googleCalendarEnabled && settings.googleCalendarId) {
        console.log("Додаємо подію в Google Calendar:", settings.googleCalendarId);
        // В реальному додатку тут був би API-запит до Google Calendar API
        toast({
          title: "Google Calendar",
          description: "Подію додано до вашого Google Calendar",
        });
      }
    } catch (error) {
      console.error("Помилка при відправці сповіщень:", error);
    }
  };
  
  const handleTaskComplete = (id: string) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => {
        if (task.id === id) {
          return { ...task, completed: !task.completed };
        }
        return task;
      });
      
      // Перетворюємо дати в рядки перед збереженням в localStorage
      const tasksForStorage = newTasks.map(task => ({
        ...task,
        date: task.date.toISOString() // Зберігаємо дату в ISO форматі
      }));
      
      localStorage.setItem('tasks', JSON.stringify(tasksForStorage));
      return newTasks;
    });
  };
  
  const handleTaskDelete = (id: string) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.filter(task => task.id !== id);
      
      // Перетворюємо дати в рядки перед збереженням в localStorage
      const tasksForStorage = newTasks.map(task => ({
        ...task,
        date: task.date.toISOString() // Зберігаємо дату в ISO форматі
      }));
      
      localStorage.setItem('tasks', JSON.stringify(tasksForStorage));
      return newTasks;
    });
    
    toast({
      title: "Задачу видалено",
      description: "Задачу було успішно видалено",
    });
  };
  
  const handleTabChange = (tab: string) => {
    if (tab === "settings") {
      navigate("/settings");
    } else {
      setActiveTab(tab);
      if (tab === "tasks") {
        toast({
          title: "Мої задачі",
          description: "Всі ваші заплановані задачі",
        });
      }
    }
  };
  
  const handleAddTaskDialog = (newTask: Task) => {
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, newTask];
      
      // Перетворюємо дати в рядки перед збереженням в localStorage
      const tasksForStorage = updatedTasks.map(task => ({
        ...task,
        date: task.date.toISOString(), // Зберігаємо дату в ISO форматі
        createdAt: task.createdAt ? task.createdAt.toISOString() : undefined // Зберігаємо дату створення в ISO форматі, якщо вона є
      }));
      
      localStorage.setItem('tasks', JSON.stringify(tasksForStorage));
      return updatedTasks;
    });
    setShowAddTask(false);
  };
  
  const handleEditTask = (id: string, updatedTask: { title: string; description?: string; date: Date; category?: string }) => {
    try {
      console.log("Редагування задачі:", id, updatedTask);
      
      // Валідація даних
      if (!updatedTask.title.trim()) {
        throw new Error("Тема задачі не може бути порожньою");
      }
      
      if (!updatedTask.date || isNaN(updatedTask.date.getTime())) {
        throw new Error("Необхідно вказати коректну дату");
      }
      
      setTasks(prevTasks => {
        // Знаходимо задачу для редагування
        const taskToEdit = prevTasks.find(task => task.id === id);
        if (!taskToEdit) {
          console.error("Задачу для редагування не знайдено:", id);
          return prevTasks;
        }
        
        // Створюємо нові задачі з оновленою задачею
        const newTasks = prevTasks.map(task => {
          if (task.id === id) {
            // Створюємо нову дату з оновленої дати
            const newDate = new Date(updatedTask.date);
            
            // Переконуємося, що дата валідна
            if (isNaN(newDate.getTime())) {
              console.error("Невалідна дата при оновленні задачі:", updatedTask.date);
              return task; // Повертаємо оригінальну задачу, якщо дата невалідна
            }
            
            return {
              ...task,
              title: updatedTask.title,
              description: updatedTask.description,
              date: newDate,
              category: updatedTask.category
              // Зберігаємо createdAt і completed без змін
            };
          }
          return task;
        });
        
        // Перетворюємо дати в рядки перед збереженням в localStorage
        const tasksForStorage = newTasks.map(task => ({
          ...task,
          date: task.date.toISOString(), // Зберігаємо дату в ISO форматі
          createdAt: task.createdAt ? task.createdAt.toISOString() : undefined // Зберігаємо дату створення в ISO форматі, якщо вона є
        }));
        
        // Зберігаємо в localStorage
        localStorage.setItem('tasks', JSON.stringify(tasksForStorage));
        
        // Повертаємо оновлені задачі
        return newTasks;
      });
      
      // Показуємо повідомлення про успішне редагування
      toast({
        title: "Задачу оновлено",
        description: `"${updatedTask.title}" успішно оновлено`,
      });
    } catch (error) {
      console.error("Помилка при редагуванні задачі:", error);
      toast({
        title: "Помилка редагування",
        description: error instanceof Error ? error.message : "Не вдалося оновити задачу. Спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };
  
  // Функція для активації мікрофона Siri AI
  const handleMicrophoneClick = () => {
    if (siriAssistantRef.current) {
      siriAssistantRef.current.startListening();
    }
  };

  // Функція для сортування задач за датою
  const sortTasksByDate = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Функція для фільтрації задач за статусом виконання
  const filterTasksByStatus = (tasks: Task[], completed: boolean): Task[] => {
    return tasks.filter(task => task.completed === completed);
  };

  // Функція для пошуку задач за назвою або описом
  const searchTasks = (tasks: Task[], query: string): Task[] => {
    const lowerCaseQuery = query.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowerCaseQuery) || 
      (task.description && task.description.toLowerCase().includes(lowerCaseQuery))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-16 relative">
      <div className="container max-w-md mx-auto px-4 py-6 flex items-center justify-center flex-col relative">
        {showAddForm ? (
          <div className="form-overlay animate-fade-in">
            <div className="form-container animate-scale-in">
              <AddTaskForm
                initialDate={selectedDate}
                onSubmit={handleTaskSubmit}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        ) : (
          <>
            {activeTab === "calendar" && (
              <div className="space-y-6 w-full flex flex-col items-center animate-fade-in">
                <div className="flex justify-center w-full md:w-1/3 mx-auto">
                  <TaskCalendar
                    onDateSelect={handleDateSelect}
                    onAddTask={handleAddTask}
                    selectedDate={selectedDate}
                  />
                </div>
                <TasksList
                  tasks={tasks}
                  date={selectedDate}
                  onTaskComplete={handleTaskComplete}
                  onTaskDelete={handleTaskDelete}
                  onEditTask={handleEditTask}
                />
              </div>
            )}
            
            {activeTab === "tasks" && (
              <div className="animate-fade-in w-full">
                <TasksList
                  tasks={tasks}
                  onTaskComplete={handleTaskComplete}
                  onTaskDelete={handleTaskDelete}
                  onEditTask={handleEditTask}
                />
              </div>
            )}
            
            {activeTab === "settings" && (
              <div className="animate-fade-in w-full">
                <Settings />
              </div>
            )}
          </>
        )}
      </div>

      {/* Siri AI завжди доступна у будь-якому стані та меню */}
      <SiriAssistant
        ref={siriAssistantRef}
        tasks={tasks}
        selectedDate={selectedDate}
        onFilterDate={handleDateSelect}
        onAddTask={handleTaskSubmit}
        onListeningChange={setIsListening}
      />
      
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onMicClick={handleMicrophoneClick}
        isListening={isListening}
      />

      {showAddTask && (
        <AddTaskDialog
          selectedDate={selectedDate}
          onClose={() => setShowAddTask(false)}
          onAdd={handleAddTaskDialog}
        />
      )}
    </div>
  );
};

export default Index;
