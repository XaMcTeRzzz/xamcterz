import { useState } from "react";
import { Check, Trash2, ChevronRight, Edit2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { toast } from "@/hooks/use-toast";

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date: Date;
  category?: string;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, task: { title: string; description?: string; date: Date; category?: string }) => void;
}

// Кольори для категорій
const categoryColors: Record<string, string> = {
  "work": "bg-blue-500",
  "personal": "bg-pink-500",
  "health": "bg-green-500",
  "education": "bg-yellow-500",
  "finance": "bg-purple-500",
  "default": "bg-gray-500"
};

// Переклади категорій
const categoryTranslations: Record<string, string> = {
  "work": "Робота",
  "personal": "Особисте",
  "health": "Здоров'я",
  "education": "Навчання",
  "finance": "Фінанси"
};

export function TaskCard({
  id,
  title,
  description,
  completed,
  date,
  category,
  onComplete,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(completed);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const formattedTime = new Intl.DateTimeFormat('uk', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  const getCategoryColor = (cat?: string) => {
    if (!cat) return categoryColors.default;
    return categoryColors[cat] || categoryColors.default;
  };

  const getCategoryLabel = (cat?: string) => {
    if (!cat) return "";
    return categoryTranslations[cat] || cat;
  };

  const handleComplete = () => {
    setIsCompleted(!isCompleted);
    onComplete(id);
    toast({
      title: isCompleted ? "Задачу відновлено" : "Задачу виконано!",
      description: isCompleted ? "Задачу було позначено як невиконану" : "Чудова робота! Продовжуй у тому ж дусі!",
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(id);
      toast({
        title: "Задачу видалено",
        description: "Задачу було успішно видалено",
      });
    }, 300);
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleEditSubmit = (id: string, updatedTask: { title: string; description?: string; date: Date; category?: string }) => {
    onEdit(id, updatedTask);
    toast({
      title: "Задачу оновлено",
      description: "Зміни успішно збережено",
    });
  };

  return (
    <>
      <Card 
        className={`task-card ${isCompleted ? 'opacity-70' : ''} ${isDeleting ? 'translate-x-full opacity-0' : ''}`}
      >
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={handleComplete}
            className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              isCompleted
                ? "bg-neon-green border-neon-green text-black"
                : "border-neon-green text-transparent hover:bg-neon-green/20"
            }`}
          >
            <Check className="h-4 w-4" />
          </button>
          
          <div className="flex-1">
            <h3 className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {title}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
            <div className="flex items-center mt-2 gap-2">
              <span className="text-xs text-muted-foreground">
                {formattedTime}
              </span>
              {category && (
                <Badge 
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${getCategoryColor(category)} text-white`}
                >
                  {getCategoryLabel(category)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleEdit}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10"
              title="Редагувати задачу"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-full hover:bg-destructive/10"
              title="Видалити задачу"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </Card>

      {showEditDialog && (
        <EditTaskDialog
          task={{ id, title, description, completed, date, category }}
          onClose={() => setShowEditDialog(false)}
          onEdit={handleEditSubmit}
        />
      )}
    </>
  );
}
