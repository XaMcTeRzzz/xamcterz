export function formatTaskCount(count: number): string {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (count === 1) {
        return "одна задача";
    }

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return `${count} задач`;
    }

    if (lastDigit === 1) {
        return `${count} задача`;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
        return `${count} задачі`;
    }

    return `${count} задач`;
}

// Приклади використання:
// formatTaskCount(1) -> "одна задача"
// formatTaskCount(2) -> "2 задачі"
// formatTaskCount(3) -> "3 задачі"
// formatTaskCount(4) -> "4 задачі"
// formatTaskCount(5) -> "5 задач"
// formatTaskCount(11) -> "11 задач"
// formatTaskCount(21) -> "21 задача"
// formatTaskCount(22) -> "22 задачі"
// formatTaskCount(25) -> "25 задач" 