/**
 * Інтерфейс для налаштувань Siri
 */
export interface SiriSettings {
  /** Ім'я користувача */
  userName?: string;
  
  /** Звертання до користувача (наприклад, "сер", "пані") */
  userTitle?: string;
  
  /** Текст привітання */
  greeting?: string;
  
  /** API ключ для Google Cloud TTS */
  googleApiKey?: string;
  
  /** Швидкість мовлення (від 0.25 до 4.0) */
  speechRate?: number;
  
  /** Висота голосу (від -20 до 20) */
  pitch?: number;
} 