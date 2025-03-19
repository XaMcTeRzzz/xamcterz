/**
 * Форматує кількість задач для озвучування
 */
export function formatTaskCountForSpeech(count: number): string {
    if (count === 1) {
        return "одна задача";
    }

    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

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

/**
 * Форматує час для озвучування
 */
export function formatTimeForSpeech(hours: number, minutes: number): string {
    let hoursForm = "годин";
    if (hours === 1 || hours === 21) {
        hoursForm = "годину";
    } else if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours)) {
        hoursForm = "години";
    }

    if (minutes === 0) {
        return `в ${hours} ${hoursForm}`;
    }

    return `в ${hours} ${hoursForm} ${minutes}`;
}

/**
 * Форматує текст для озвучування
 */
export function formatTextForSpeech(text: string): string {
    // Видаляємо символи коду та спеціальні символи які можуть викликати помилки
    text = text.replace(/[{}[\]<>()\/\\`]/g, ' ');
    text = text.replace(/\s+/g, ' '); // Заміна багатьох пробілів на один
    
    // Пропускаємо текст, якщо він схожий на код (містить багато спеціальних символів)
    if (text.match(/import|export|const|function|class|interface|=>|===/g)) {
        return "Вибачте, я не можу прочитати цей текст, бо він схожий на програмний код.";
    }
    
    // Видаляємо HTML-теги
    text = text.replace(/<[^>]*>/g, ' ');
    
    // Замінюємо спеціальні символи на пробіли
    text = text.replace(/[&*^%$#@!_+=|~]/g, ' ');
    
    // Прибираємо зайві пробіли
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
} 