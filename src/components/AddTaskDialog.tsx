import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/components/TasksList";
import { v4 as uuidv4 } from "uuid";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AddTaskDialogProps {
  selectedDate: Date;
  onClose: () => void;
  onAdd: (task: Task) => void;
}

export function AddTaskDialog({ selectedDate, onClose, onAdd }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(selectedDate);
  const [time, setTime] = useState("12:00");

  // Обробник зміни дати через календар
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Зберігаємо поточний час
      const [hours, minutes] = time.split(':').map(Number);
      newDate.setHours(hours, minutes, 0, 0);
      setDate(newDate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Базова валідація
      if (!title.trim()) {
        throw new Error("Тема задачі не може бути порожньою");
      }
      
      // Отримуємо години та хвилини з часу
      const [hours, minutes] = time.split(":").map(Number);
      
      // Створюємо нову дату з вибраної дати та часу
      const taskDate = new Date(date);
      taskDate.setHours(hours, minutes, 0, 0);
      
      // Перевіряємо, чи валідна дата
      if (isNaN(taskDate.getTime())) {
        throw new Error("Необхідно вказати коректну дату та час");
      }

      // Створюємо нову задачу
      const newTask: Task = {
        id: uuidv4(),
        title,
        description: description || undefined,
        category: category || undefined,
        date: taskDate,
        completed: false,
        createdAt: new Date(), // Додаємо дату створення
      };
      
      // Додаємо задачу
      onAdd(newTask);
      
      // Закриваємо діалог
      onClose();
    } catch (error) {
      console.error("Помилка при створенні задачі:", error);
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося створити задачу",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Додати нову задачу</DialogTitle>
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
                  {format(date, "PPP")}
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
                onChange={(e) => setTime(e.target.value)}
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
              Додати
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 