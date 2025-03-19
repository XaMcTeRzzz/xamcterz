import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddTaskButtonProps {
  onAddTask: () => void;
}

export function AddTaskButton({ onAddTask }: AddTaskButtonProps) {
  return (
    <Button
      onClick={onAddTask}
      className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:bottom-8 bg-green-500 hover:bg-green-600"
      size="icon"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
