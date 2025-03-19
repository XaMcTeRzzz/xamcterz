import { Calendar, ListTodo, Settings as SettingsIcon, Mic } from "lucide-react";
import { cn } from "../lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMicClick?: () => void;
  isListening?: boolean;
}

export function BottomNavigation({ activeTab, onTabChange, onMicClick, isListening = false }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t flex items-center justify-around z-10 md:hidden">
      <button
        onClick={() => onTabChange("calendar")}
        className={cn(
          "flex flex-col items-center justify-center w-20 h-full",
          "transition-colors duration-200",
          activeTab === "calendar" ? "text-neon-green animate-neon-glow" : "text-muted-foreground hover:text-primary/80"
        )}
      >
        <Calendar className="h-5 w-5" />
        <span className="text-xs mt-1">Календар задач</span>
      </button>
      
      <button
        onClick={() => onTabChange("tasks")}
        className={cn(
          "flex flex-col items-center justify-center w-20 h-full",
          "transition-colors duration-200",
          activeTab === "tasks" ? "text-neon-green animate-neon-glow" : "text-muted-foreground hover:text-primary/80"
        )}
      >
        <ListTodo className="h-5 w-5" />
        <span className="text-xs mt-1">Мої задачі</span>
      </button>
      
      {/* Оновлена кнопка Siri AI в стилі меню */}
      <button
        onClick={onMicClick}
        className={cn(
          "flex flex-col items-center justify-center w-20 h-full group",
          "transition-all duration-200",
          isListening ? "text-neon-green animate-neon-glow" : "text-muted-foreground hover:text-primary/80"
        )}
      >
        <div className="relative">
          <Mic className={cn(
            "h-5 w-5",
            "transition-transform duration-200",
            "group-hover:scale-110",
            isListening && "animate-bounce-gentle"
          )} />
          {isListening && (
            <div className="absolute -inset-2 rounded-full border border-neon-green animate-ping" />
          )}
        </div>
        <span className={cn(
          "text-xs mt-1",
          "transition-colors duration-200"
        )}>
          Siri AI
        </span>
      </button>
      
      <button
        onClick={() => onTabChange("settings")}
        className={cn(
          "flex flex-col items-center justify-center w-20 h-full",
          "transition-colors duration-200",
          activeTab === "settings" ? "text-neon-green animate-neon-glow" : "text-muted-foreground hover:text-primary/80"
        )}
      >
        <SettingsIcon className="h-5 w-5" />
        <span className="text-xs mt-1">Налаштування</span>
      </button>
    </div>
  );
}
