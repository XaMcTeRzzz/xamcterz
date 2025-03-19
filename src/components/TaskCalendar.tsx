import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { uk } from "date-fns/locale";

interface TaskCalendarProps {
  onDateSelect: (date: Date) => void;
  onAddTask: (date: Date) => void;
  selectedDate: Date;
}

export function TaskCalendar({ onDateSelect, onAddTask, selectedDate }: TaskCalendarProps) {
  const [date, setDate] = useState<Date>(selectedDate);
  const [isHovering, setIsHovering] = useState(false);

  // Правильні назви місяців у родовому відмінку
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ];

  // Правильні назви днів тижня
  const daysOfWeek = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  // Функція для правильного відмінювання слова "задача"
  const getTaskWord = (count: number): string => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return 'задача';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
      return 'задачі';
    } else {
      return 'задач';
    }
  };

  const handleSelect = (newDate: Date | null) => {
    if (newDate) {
      setDate(newDate);
      onDateSelect(newDate);
      
      // Форматуємо дату з правильним відмінком місяця
      const day = newDate.getDate();
      const month = months[newDate.getMonth()];
      const year = newDate.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;
      
      toast({
        title: "Дату вибрано",
        description: `Вибрано ${formattedDate}`,
      });
    }
  };

  const handleAddTask = () => {
    onAddTask(date);
    
    // Форматуємо дату з правильним відмінком місяця
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const formattedDate = `${day} ${month} ${year}`;
    
    // Отримуємо випадкову кількість задач для демонстрації правильних відмінків
    const taskCount = Math.floor(Math.random() * 10) + 1;
    const taskWord = getTaskWord(taskCount);
    
    toast({
      title: "Додавання задачі",
      description: `Створення нової задачі на ${formattedDate}. У вас ${taskCount} ${taskWord}.`,
    });
  };

  // Кастомні стилі для календаря
  const calendarStyles = `
    .react-datepicker {
      font-family: 'Inter', sans-serif;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      background-color: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      box-shadow: 0 0 15px rgba(57, 255, 20, 0.3);
      text-align: center;
    }
    .react-datepicker__header {
      background-color: transparent;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 0.8rem;
      text-align: center;
    }
    .react-datepicker__current-month {
      color: rgba(57, 255, 20, 0.9);
      font-weight: 600;
      margin-bottom: 0.5rem;
      text-align: center;
    }
    .react-datepicker__day-name {
      color: rgba(255, 255, 255, 0.7);
      margin: 0.4rem;
      text-align: center;
      width: 2rem;
      font-size: 0.85rem;
    }
    .react-datepicker__day {
      margin: 0.4rem;
      color: rgba(255, 255, 255, 0.9);
      border-radius: 0.3rem;
      transition: all 0.2s ease;
      text-align: center;
      width: 2rem;
      height: 2rem;
      line-height: 2rem;
      font-size: 0.9rem;
    }
    .react-datepicker__day:hover {
      background-color: rgba(57, 255, 20, 0.2);
    }
    .react-datepicker__day--selected {
      background-color: rgba(57, 255, 20, 0.3);
      color: white;
    }
    .react-datepicker__day--today {
      border: 2px solid rgba(255, 255, 255, 0.5);
      font-weight: bold;
    }
    .react-datepicker__navigation {
      top: 1rem;
    }
    .react-datepicker__navigation-icon::before {
      border-color: rgba(57, 255, 20, 0.7);
    }
    .react-datepicker__navigation:hover *::before {
      border-color: rgba(57, 255, 20, 1);
    }
    .react-datepicker__month {
      margin: 0.4rem;
    }
    .react-datepicker__month-text {
      text-align: center;
    }
  `;

  // Функція для форматування назви місяця в називному відмінку
  const formatMonthName = (date: Date) => {
    const monthsNominative = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    return `${monthsNominative[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <Card className="glass-card overflow-hidden w-full max-w-sm animate-float shadow-[0_0_15px_rgba(57,255,20,0.5)] hover:shadow-[0_0_25px_rgba(57,255,20,0.7)] transform origin-top" style={{ transform: 'scale(0.33)', transformOrigin: 'top center' }}>
      <CardContent className="p-3 text-center">
        <div className="mb-2 flex justify-between items-center">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary animate-glow" />
            <h2 className="text-lg font-semibold text-neon-green animate-neon-glow">Календар задач</h2>
          </div>
          <button
            onClick={handleAddTask}
            className="neon-button p-1 w-10 h-10 flex items-center justify-center"
            aria-label="Додати задачу"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Plus className={`h-6 w-6 ${isHovering ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>
        
        <style>{calendarStyles}</style>
        
        <DatePicker
          selected={date}
          onChange={handleSelect}
          inline
          locale={uk}
          calendarClassName="w-full text-center mx-auto"
          dayClassName={date => 
            "hover:bg-opacity-20 hover:bg-neon-green"
          }
          formatWeekDay={nameOfDay => daysOfWeek[new Date(nameOfDay).getDay()]}
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled
          }) => (
            <div className="flex justify-center items-center px-2 py-1">
              <button
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                className="px-2 py-1 hover:text-neon-green"
                aria-label="Попередній місяць"
              >
                {"<"}
              </button>
              <div className="text-neon-green font-semibold mx-2">
                {formatMonthName(date)}
              </div>
              <button
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                className="px-2 py-1 hover:text-neon-green"
                aria-label="Наступний місяць"
              >
                {">"}
              </button>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
