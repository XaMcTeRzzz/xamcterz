import React, { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Простіша версія інтерфейсу для пропсів
interface AddTaskFormProps {
  initialDate: Date;
  onSubmit: (task: {
    title: string;
    description?: string;
    date: Date;
    time: string;
  }) => void;
  onCancel: () => void;
}

export function AddTaskForm({ initialDate, onSubmit, onCancel }: AddTaskFormProps) {
  // Базовий стан форми
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: initialDate,
    time: "12:00"
  });

  // Стан валідації та відправки
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обробники зміни полів
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Очищення помилок при зміні
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Обробник зміни дати
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
    }
  };

  // Валідація форми
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Назва задачі обов'язкова";
    }

    // Додайте додаткову валідацію за потреби

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обробник відправки форми
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валідація перед відправкою
    if (!validateForm()) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, заповніть всі обов'язкові поля",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Підготовка даних для відправки
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date,
        time: formData.time
      };

      // Відправка даних
      onSubmit(taskData);
      
      toast({
        title: "Задачу збережено!",
        description: "Нову задачу було успішно додано до календаря",
      });
    } catch (error) {
      console.error("Помилка при збереженні задачі:", error);
      toast({
        title: "Помилка збереження",
        description: "Не вдалося зберегти задачу. Спробуйте ще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neon-green animate-neon-glow">Нова задача</h2>
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="rounded-full h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Назва задачі */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="title" className="block text-sm font-medium">
              Назва задачі *
            </label>
          </div>
          <Input
            id="title"
            name="title"
            placeholder="Введіть назву задачі"
            value={formData.title}
            onChange={handleInputChange}
            className="glass-card border-neon-green/50 focus-visible:ring-neon-green"
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-destructive text-xs mt-1">{errors.title}</p>
          )}
        </div>

        {/* Опис задачі */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="description" className="block text-sm font-medium">
              Опис (необов'язково)
            </label>
          </div>
          <Textarea
            id="description"
            name="description"
            placeholder="Додайте опис задачі"
            value={formData.description}
            onChange={handleInputChange}
            className="min-h-[100px] glass-card border-neon-green/50 focus-visible:ring-neon-green"
          />
        </div>
        
        {/* Дата і час */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Дата
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal glass-card border-neon-green/50"
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.date, "PP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={handleDateChange}
                  initialFocus
                  classNames={{
                    day_selected: "bg-neon-green text-black",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium mb-1">
              Час
            </label>
            <div className="relative flex items-center">
              <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="pl-10 glass-card border-neon-green/50 focus-visible:ring-neon-green"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Кнопки форми */}
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full neon-button py-6 text-base font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Збереження..." : "Зберегти задачу"}
        </Button>
      </div>
    </form>
  );
}
