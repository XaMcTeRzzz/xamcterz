import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/components/TasksList";
import { toast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditTaskDialogProps {
  task: Task;
  onClose: () => void;
  onEdit: (id: string, updatedTask: { title: string; description?: string; date: Date; category?: string }) => void;
}

export function EditTaskDialog({ task, onClose, onEdit }: EditTaskDialogProps) {
  // Стан для полів форми
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [category, setCategory] = useState(task.category || "");
  const [date, setDate] = useState<Date>(new Date(task.date));
  const [time, setTime] = useState("");
  
  // Ініціалізація часу при завантаженні компонента
  useEffect(() => {
    try {
      // Отримуємо час з дати задачі
      const taskDate = new Date(task.date);
      if (!isNaN(taskDate.getTime())) {
        const hours = String(taskDate.getHours()).padStart(2, '0');
        const minutes = String(taskDate.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
        setDate(taskDate);
      } else {
        // Якщо дата невалідна, встановлюємо поточний час
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
        setDate(now);
      }
    } catch (error) {
      console.error("Помилка при ініціалізації часу:", error);
      // Встановлюємо значення за замовчуванням
      setTime("12:00");
      setDate(new Date());
    }
  }, [task.date]);
  
  // Обробник зміни дати через календар
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Зберігаємо поточний час
      const currentDate = new Date(date);
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);
      setDate(newDate);
    }
  };
  
  // Обробник зміни часу
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    try {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      setDate(newDate);
    } catch (error) {
      console.error("Помилка при зміні часу:", error);
    }
  };
  
  // Обробник відправки форми
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Базова валідація
      if (!title.trim()) {
        throw new Error("Тема задачі не може бути порожньою");
      }
      
      // Перевіряємо, чи валідна дата
      if (isNaN(date.getTime())) {
        throw new Error("Необхідно вказати коректну дату");
      }
      
      // Створюємо оновлений об'єкт задачі
      const updatedTask = {
        title,
        description: description || undefined,
        category: category || undefined,
        date: date,
      };
      
      // Викликаємо функцію редагування
      onEdit(task.id, updatedTask);
      
      // Закриваємо діалог
      onClose();
    } catch (error) {
      console.error("Помилка при оновленні задачі:", error);
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося оновити задачу. Будь ласка, спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редагувати задачу</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Назва задачі</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введіть назву задачі"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Опис (необов'язково)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Додайте опис задачі"
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Дата</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: require('date-fns/locale/uk') })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Час</Label>
            <div className="relative flex items-center">
              <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Категорія (необов'язково)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть категорію" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Без категорії</SelectItem>
                <SelectItem value="work">Робота</SelectItem>
                <SelectItem value="personal">Особисте</SelectItem>
                <SelectItem value="health">Здоров'я</SelectItem>
                <SelectItem value="education">Навчання</SelectItem>
                <SelectItem value="finance">Фінанси</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit">
              Зберегти
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 