export interface Task {
    id: string;
    title: string;
    description?: string;
    date: Date;
    completed: boolean;
    category?: string;
    createdAt?: Date;
    updatedAt?: Date;
} 