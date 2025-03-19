import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Task } from "@/components/TasksList";
import { SpeechRecognition, SpeechRecognitionEvent } from "@/types/speech-recognition";
import { formatTaskCount, formatTimeForSpeech } from "@/utils/ukranian-numerals";
import { formatGreeting, formatTasksText } from "@/utils/siri-text-formatter";
import { applyPronunciation, addSpeechPauses } from "@/utils/pronunciation";

interface SiriAssistantProps {
  tasks: Task[];
  selectedDate?: Date;
  onFilterDate?: (date: Date) => void;
  onAddTask?: () => void;
  onListeningChange?: (isListening: boolean) => void;
}

// Перелік команд, які розуміє Siri AI
const COMMANDS = {
  ACTIVATE: ["siri", "сірі", "сири", "сіри", "сірій", "hey siri", "хей сірі"],
  READ_TASKS: ["задачі", "задача", "мої задачі", "всі задачі", "що заплановано", "розклад"],
  EDIT_TASK: ["редагувати", "змінити", "оновити"],
  STOP: ["стоп", "зупинись", "замовкни", "перестань", "досить", "stop"],
};

// Ключ для localStorage
const ACTIVE_TASKS_STORAGE_KEY = "siri_active_tasks";

// Додаємо після інших ключів для localStorage
const SIRI_SETTINGS_KEY = "siri_settings";

// Інтерфейс для налаштувань Siri AI
interface Settings {
  greeting: string;
  userName: string;
  userTitle: string;
  googleApiKey: string;
  useGoogleTTS: boolean;
  voiceRate?: number;
  voicePitch?: number;
}

// Дефолтні налаштування
const DEFAULT_SETTINGS: Settings = {
  greeting: "Да",
  userName: "",
  userTitle: "сер",
  googleApiKey: "",
  useGoogleTTS: false,
  voiceRate: 1,
  voicePitch: 1
};

// Після імпортів додамо інтерфейс для голосів
interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isNative: boolean;
}

// Функція для форматування часу
const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('uk', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Додамо функцію для генерації хвильової анімації
const generateWaveform = (): number[] => {
  // Створюємо масив з 10 випадкових чисел від 0.2 до 1
  return Array.from({ length: 10 }, () => 0.2 + Math.random() * 0.8);
};

// Створюємо компонент з підтримкою ref
export const SiriAssistant = React.forwardRef<
  { startListening: () => void },
  { 
    tasks: Task[];
    selectedDate: Date;
    onFilterDate: (date: Date) => void;
    onAddTask: (task: Omit<Task, "id">) => void;
    onListeningChange: (isListening: boolean) => void;
  }
>(({ tasks, selectedDate, onFilterDate, onAddTask, onListeningChange }, ref) => {
  // Стан прослуховування
  const [isListening, setIsListening] = useState(false);
  // Стан відтворення відповіді Siri AI 
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Анімована іконка
  const [waveform, setWaveform] = useState<number[]>([]);
  // Текст розпізнаної команди
  const [recognizedText, setRecognizedText] = useState("");
  // Кеш активних задач
  const [cachedTasks, setCachedTasks] = useState<Task[]>([]);
  // Додамо стан для збереження доступних голосів
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  // Вибраний голос
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Референції для об'єктів розпізнавання і синтезу мови
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Додаємо стан для налаштувань Siri AI
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  // Стан для показу діалогу налаштувань
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Експортуємо функцію startListening через ref
  React.useImperativeHandle(ref, () => ({
    startListening: () => {
      startListening();
    }
  }));

  // Оновлюємо батьківський компонент про зміну стану прослуховування
  useEffect(() => {
    if (onListeningChange) {
      onListeningChange(isListening);
    }
  }, [isListening, onListeningChange]);

  // При завантаженні компонента, завантажуємо збережені задачі
  useEffect(() => {
    loadCachedTasks();
  }, []);

  // При зміні задач, оновлюємо кеш
  useEffect(() => {
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
      saveActiveTasks(tasks);
    }
  }, [tasks]);

  // Додамо ефект для завантаження доступних голосів
  useEffect(() => {
    // Функція для завантаження доступних голосів
    const loadVoices = () => {
      if (window.speechSynthesis) {
        // Отримуємо всі доступні голоси
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Мапимо голоси в більш зручний формат
          const voiceOptions: VoiceOption[] = voices.map(voice => ({
            voice: voice,
            name: voice.name,
            lang: voice.lang,
            isNative: voice.localService
          }));
          
          console.log("Доступні голоси:", voiceOptions);
          setAvailableVoices(voiceOptions);
          
          // Вибираємо найкращий голос для української мови або будь-який інший доступний
          selectBestVoice(voiceOptions);
        }
      }
    };
    
    // Завантажуємо голоси при ініціалізації
    loadVoices();
    
    // У Chrome голоси можуть завантажуватися асинхронно
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);
  
  // Функція для вибору найкращого голосу
  const selectBestVoice = (voices: VoiceOption[]) => {
    // Спочатку шукаємо українські чоловічі голоси
    let bestVoice = voices.find(v => 
      v.lang.includes('uk') && 
      (v.name.toLowerCase().includes('male') || 
       v.name.toLowerCase().includes('чоловік') || 
       v.name.toLowerCase().includes('man'))
    );
    
    // Якщо українського чоловічого голосу немає, шукаємо російський чоловічий
    if (!bestVoice) {
      bestVoice = voices.find(v => 
        v.lang.includes('ru') && 
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('мужской') || 
         v.name.toLowerCase().includes('man'))
      );
    }
    
    // Якщо немає ні українського, ні російського чоловічого, шукаємо англійський чоловічий
    if (!bestVoice && voices.length > 0) {
      bestVoice = voices[0];
    }
    
    if (bestVoice) {
      console.log("Вибраний голос:", bestVoice.name, bestVoice.lang);
      setSelectedVoice(bestVoice.voice);
    }
  };

  // Функція для збереження активних задач
  const saveActiveTasks = (tasksList: Task[]) => {
    try {
      // Фільтруємо тільки активні задачі
      const activeTasks = tasksList.filter(task => !task.completed);
      
      if (activeTasks.length > 0) {
        // Зберігаємо в localStorage
        localStorage.setItem(ACTIVE_TASKS_STORAGE_KEY, JSON.stringify(activeTasks));
        console.log("Задачі збережено в кеш:", activeTasks.length);
        setCachedTasks(activeTasks);
      }
    } catch (error) {
      console.error("Помилка при збереженні задач:", error);
    }
  };

  // Функція для завантаження збережених задач
  const loadCachedTasks = () => {
    try {
      const savedTasks = localStorage.getItem(ACTIVE_TASKS_STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks) as Task[];
        
        // Перевіряємо формат і конвертуємо рядкові дати в об'єкти Date
        const validTasks = parsedTasks.map(task => ({
          ...task,
          date: new Date(task.date)
        }));
        
        console.log("Завантажено задач з кешу:", validTasks.length);
        setCachedTasks(validTasks);
        return validTasks;
      }
    } catch (error) {
      console.error("Помилка при завантаженні задач:", error);
    }
    return [];
  };

  // Завантажуємо налаштування при ініціалізації
  useEffect(() => {
    loadSettings();
  }, []);

  // Функція для завантаження налаштувань Siri AI
  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem(SIRI_SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        console.log("Завантажено налаштування Siri AI:", parsedSettings);
      }
    } catch (error) {
      console.error("Помилка при завантаженні налаштувань Siri AI:", error);
    }
  };

  // Функція для збереження налаштувань Siri AI
  const saveSettings = (settings: Settings) => {
    try {
      localStorage.setItem(SIRI_SETTINGS_KEY, JSON.stringify(settings));
      setSettings(settings);
      console.log("Збережено налаштування Siri AI:", settings);
    } catch (error) {
      console.error("Помилка при збереженні налаштувань Siri AI:", error);
    }
  };

  // Функція для формування привітання
  const getGreeting = () => {
    const { greeting, userName, userTitle } = settings;
    let fullGreeting = `${greeting}`;
    
    if (userName) {
      fullGreeting += `, ${userName}`;
    }
    
    if (userTitle && (!userName || userName.trim() === "")) {
      fullGreeting += `, ${userTitle}`;
    }
    
    return fullGreeting;
  };

  // Ініціалізація розпізнавання мови
  useEffect(() => {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'uk-UA'; // Українська мова за замовчуванням
      recognition.continuous = false; // Встановлюємо на false для одноразового розпізнавання
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        // Отримуємо останній результат
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.toLowerCase().trim();
        
        // Виводимо розпізнаний текст для відлагодження
        console.log("Розпізнаний текст:", transcript);
        
        setRecognizedText(transcript);
        setIsListening(false);
        
        // Розпізнаємо ключове слово або команду
        const hasActivationWord = COMMANDS.ACTIVATE.some(cmd => transcript.includes(cmd));
        const hasTaskCommand = COMMANDS.READ_TASKS.some(cmd => transcript.includes(cmd));
        const hasEditCommand = COMMANDS.EDIT_TASK.some(cmd => transcript.includes(cmd));
        
        if (hasActivationWord || hasTaskCommand) {
          // Вимикаємо мікрофон після команди
          recognition.stop();
          
          // Відповідаємо користувачу з налаштованим привітанням
          const greeting = getGreeting();
          speak(greeting);
          
          // Затримка перед виконанням команди мої задачі
          setTimeout(() => {
            handleTasksCommand();
          }, 2000);
        } else if (hasEditCommand) {
          // Вимикаємо мікрофон після команди
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          
          // Шукаємо час у команді (наприклад, "змінити задачу на 15:00")
          const timeMatch = transcript.match(/\d{1,2}:\d{2}/);
          if (timeMatch) {
            const timeToEdit = timeMatch[0];
            handleEditTaskCommand(timeToEdit);
          } else {
            speak("Будь ласка, вкажіть час задачі, яку хочете редагувати. Наприклад: змінити задачу на 15:00");
          }
        } else if (COMMANDS.STOP.some(cmd => transcript.includes(cmd))) {
          // Команда зупинки
          stopSpeaking();
          speak("Зупиняю озвучування");
        } else {
          // Якщо команда не розпізнана
          speak("Вибачте, я не розумію цю команду. Скажіть 'Siri' для перегляду задач або 'Редагувати' для зміни задачі.");
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Помилка розпізнавання мови:', event.error);
        toast({
          title: "Помилка голосового помічника",
          description: "Сталася помилка розпізнавання.",
          variant: "destructive",
        });
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log("Listening ended");
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      toast({
        title: "Не підтримується",
        description: "Ваш браузер не підтримує голосове розпізнавання",
        variant: "destructive",
      });
    }
    
    // Зупинка розпізнавання при виході
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesis && speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Ефект для створення анімації під час прослуховування або розмови
  useEffect(() => {
    let animationFrame: number;
    
    if (isListening || isSpeaking) {
      const animate = () => {
        const newWaveform = Array.from({length: 8}, () => 
          Math.floor(Math.random() * 40) + 10);
        setWaveform(newWaveform);
        animationFrame = requestAnimationFrame(animate);
      };
      
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      cancelAnimationFrame(animationFrame);
      if (!isListening && !isSpeaking) {
        setWaveform([]);
      }
    };
  }, [isListening, isSpeaking]);
  
  // Функція для початку прослуховування
  const startListening = () => {
    if (recognitionRef.current) {
      try {
        // Оновлюємо стан
        setIsListening(true);
        setRecognizedText("");
        
        // Генеруємо випадкові висоти для анімації
        const heights = Array.from({ length: 10 }, () => 
          Math.floor(Math.random() * 60) + 20
        );
        setWaveform(heights);
        
        // Запускаємо розпізнавання
        recognitionRef.current.start();
        
        // Оновлюємо анімацію кожні 100мс
        const interval = setInterval(() => {
          const newHeights = Array.from({ length: 10 }, () => 
            Math.floor(Math.random() * 60) + 20
          );
          setWaveform(newHeights);
        }, 100);
        
        // Зупиняємо анімацію після 5 секунд, якщо немає результату
        setTimeout(() => {
          if (isListening) {
            clearInterval(interval);
            setIsListening(false);
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }
        }, 5000);
        
        return () => clearInterval(interval);
      } catch (error) {
        console.error("Помилка при запуску розпізнавання:", error);
        setIsListening(false);
      }
    } else {
      console.error("Розпізнавання мови не підтримується");
    }
  };
  
  // Функція для синтезу мовлення через Google Cloud TTS
  const speakWithGoogleTTS = async (text: string) => {
    try {
      const settings = JSON.parse(localStorage.getItem(SIRI_SETTINGS_KEY) || '{}');
      
      if (!settings.googleApiKey) {
        throw new Error('API ключ Google Cloud не налаштовано');
      }

      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.googleApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'uk-UA',
            name: 'uk-UA-Wavenet-A',
            ssmlGender: 'FEMALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 0.9
          }
        })
      });

      if (!response.ok) {
        throw new Error('Помилка при зверненні до Google Cloud TTS');
      }

      const { audioContent } = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        toast({
          title: "Помилка відтворення",
          description: "Не вдалося відтворити аудіо",
          variant: "destructive"
        });
      };

      await audio.play();

    } catch (error) {
      console.error('Помилка синтезу мовлення:', error);
      // Якщо сталася помилка з Google TTS, використовуємо браузерний синтез
      speakWithBrowserTTS(text);
    }
  };

  // Функція для форматування тексту для кращої вимови
  const formatTextForSpeech = (text: string): string => {
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
    
    // Заміна цифр на слова для правильної вимови
    // Заміняємо години з хвилинами на слова
    text = text.replace(/(\d{1,2}):(\d{2})/g, (match, hours, minutes) => {
      // Визначити рід слова "година" залежно від числа
      const hoursNum = parseInt(hours);
      
      // Використовуємо спеціальне форматування для коректної вимови цифр з наголосами
      let hoursWord = "год'ин"; // явно вказуємо наголос на "и"
      if (hoursNum === 1 || hoursNum === 21) {
        hoursWord = "год'ина";
      } else if ((hoursNum >= 2 && hoursNum <= 4) || (hoursNum >= 22 && hoursNum <= 24)) {
        hoursWord = "год'ини";
      }
      
      // Визначити рід слова "хвилина" залежно від числа
      const minutesNum = parseInt(minutes);
      let minutesWord = "хвил'ин"; // явно вказуємо наголос на "и"
      if (minutesNum % 10 === 1 && minutesNum % 100 !== 11) {
        minutesWord = "хвил'ина";
      } else if ([2, 3, 4].includes(minutesNum % 10) && ![12, 13, 14].includes(minutesNum % 100)) {
        minutesWord = "хвил'ини";
      }
      
      // Спеціальний формат для кращої вимови цифр
      // Додаємо пробіл після кожної цифри для кращої вимови
      const formattedHours = hours.length === 1 ? hours : hours.split('').join(' ');
      const formattedMinutes = minutes.length === 2 ? minutes.split('').join(' ') : minutes;
      
      // Повертаємо відформатований час з наголосами
      return `${formattedHours} ${hoursWord} ${formattedMinutes} ${minutesWord}`;
    });
    
    // Заміна часу, коли він вказаний як "о 15:30" - форматуємо для кращої вимови
    text = text.replace(/о (\d{1,2}):(\d{2})/g, (match, hours, minutes) => {
      const hoursNum = parseInt(hours);
      
      // Правильна форма "годин" залежно від числа
      let hoursForm = "годин";
      if (hoursNum === 1 || hoursNum === 21) {
        hoursForm = "годину";
      } else if ([2, 3, 4].includes(hoursNum % 10) && ![12, 13, 14].includes(hoursNum)) {
        hoursForm = "години";
      }
      
      // Якщо час без хвилин (15:00)
      if (minutes === "00") {
        return `в ${hoursNum} ${hoursForm}`;
      }
      
      // Якщо є хвилини
      return `в ${hoursNum} ${hoursForm} ${minutes}`;
    });
    
    // Заміна чисел на слова з правильними відмінками
    text = text.replace(/(\d+) (задач|завдан|заплан)/g, (match, number, word) => {
      const num = parseInt(number);
      // Визначити правильну форму слова "задача"
      let taskWord = "зад'ач"; // явно вказуємо наголос
      if (num % 10 === 1 && num % 100 !== 11) {
        taskWord = "зад'ача";
      } else if ([2, 3, 4].includes(num % 10) && ![12, 13, 14].includes(num % 100)) {
        taskWord = "зад'ачі";
      }
      
      return `${number} ${taskWord}`;
    });
    
    return text;
  };

  // Перейменовуємо стару функцію speakText на speakWithBrowserTTS
  const speakWithBrowserTTS = (text: string) => {
    if (!window.speechSynthesis) {
      console.error("Браузер не підтримує синтез мовлення");
      return;
    }
    
    // Зупиняємо всі попередні вислови
    window.speechSynthesis.cancel();
    
    // Форматуємо текст для кращої вимови
    const formattedText = formatTextForSpeech(text);
    
    // Створюємо новий екземпляр висловлювання
    const utterance = new SpeechSynthesisUtterance(formattedText);
    
    // Встановлюємо голос
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Налаштування параметрів голосу
    utterance.volume = 1;      // Гучність (0-1)
    utterance.rate = 0.9;      // Швидкість (0.1-10)
    utterance.pitch = 0.9;     // Висота тону (0-2)
    
    // Налаштовуємо українську мову, якщо голос не український
    if (selectedVoice && !selectedVoice.lang.includes('uk')) {
      utterance.lang = 'uk-UA';
    }
    
    // Додаємо обробники подій
    utterance.onstart = () => {
      console.log("Siri AI почала говорити");
      setIsSpeaking(true);
      // Використовуємо наявну анімацію, яка вже є в коді (припускаємо що generateWaveform вже існує)
      setWaveform(Array.from({ length: 10 }, () => 0.2 + Math.random() * 0.8));
    };
    
    utterance.onend = () => {
      console.log("Siri AI закінчила говорити");
      setIsSpeaking(false);
      setWaveform([]);
    };
    
    utterance.onerror = (event) => {
      console.error("Помилка синтезу мовлення:", event);
      setIsSpeaking(false);
      setWaveform([]);
    };
    
    // Зберігаємо utterance в ref для можливого зупинення
    speechSynthesisRef.current = utterance;
    
    // Запускаємо синтез
    window.speechSynthesis.speak(utterance);
  };

  // Оновлена функція для озвучування тексту
  const speak = (text: string) => {
    if (!text) return;
    
    // Отримуємо налаштування
    const settings = JSON.parse(localStorage.getItem(SIRI_SETTINGS_KEY) || '{}');
    
    // Застосовуємо правильну вимову та паузи
    const processedText = addSpeechPauses(applyPronunciation(text));
    
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = "uk-UA";
    utterance.rate = settings?.voiceRate || 1;
    utterance.pitch = settings?.voicePitch || 1;
    
    window.speechSynthesis.speak(utterance);
  };

  // Функція для отримання подій з Google Calendar
  const getGoogleCalendarEvents = async () => {
    try {
      const settings = JSON.parse(localStorage.getItem(SIRI_SETTINGS_KEY) || '{}');
      
      if (!settings.googleApiKey) {
        return null;
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // Тут має бути ваш код для отримання подій з Google Calendar API
      // Це лише приклад структури даних
      const events = [
        {
          start: { dateTime: '2024-03-16T10:00:00' },
          summary: 'Зустріч з командою'
        },
        {
          start: { dateTime: '2024-03-16T14:30:00' },
          summary: 'Дзвінок із клієнтом'
        }
      ];

      return events;
    } catch (error) {
      console.error('Помилка отримання подій з календаря:', error);
      return null;
    }
  };

  // Функція для отримання налаштувань
  const getSettings = () => {
    try {
      return JSON.parse(localStorage.getItem(SIRI_SETTINGS_KEY) || '{}');
    } catch (error) {
      console.error("Помилка при зчитуванні налаштувань:", error);
      return {};
    }
  };

  // Функція для отримання задач на сьогодні
  const getTodayTasks = useCallback((allTasks: Task[]): Task[] => {
    const today = new Date();
    return allTasks.filter(task => 
      task.date.getDate() === today.getDate() &&
      task.date.getMonth() === today.getMonth() &&
      task.date.getFullYear() === today.getFullYear() &&
      !task.completed
    );
  }, []);

  // Функція для отримання всіх задач
  const getAllTasks = useCallback((): Task[] => {
    const savedTasksJson = localStorage.getItem("tasks");
    if (!savedTasksJson) return tasks;

    try {
      const parsedTasks = JSON.parse(savedTasksJson);
      return parsedTasks.map((task: any) => ({
        ...task,
        date: new Date(task.date)
      }));
    } catch (error) {
      console.error("Помилка при зчитуванні задач:", error);
      return tasks;
    }
  }, [tasks]);

  // Оновлена функція обробки команди "задачі"
  const handleTasksCommand = useCallback(async () => {
    try {
      const settings = JSON.parse(localStorage.getItem(SIRI_SETTINGS_KEY) || '{}');
      await speak(formatGreeting(settings));

      const allTasks = getAllTasks();
      const todayTasks = getTodayTasks(allTasks);
      await speak(formatTasksText(todayTasks, settings));
    } catch (error) {
      console.error("Помилка при обробці задач:", error);
      await speak("Вибачте, виникла помилка при обробці ваших задач. Чим ще можу допомогти?");
    }
  }, [getAllTasks, getTodayTasks, speak]);

  // Функція для отримання перекладу категорії
  const getCategoryLabel = (category: string): string => {
    const categoryTranslations: Record<string, string> = {
      "work": "Робота",
      "personal": "Особисте",
      "health": "Здоров'я",
      "education": "Навчання",
      "finance": "Фінанси"
    };
    return categoryTranslations[category] || category;
  };

  // Переривання мовлення
  const stopSpeaking = () => {
    if (speechSynthesis && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  
  // Функція для отримання форматованого тексту місяця
  const getMonthName = (month: number): string => {
    const months = [
      'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 
      'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'
    ];
    return months[month];
  };
  
  // Функція для групування задач по місяцях
  const groupTasksByMonth = (tasksList: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasksList.forEach(task => {
      const taskDate = new Date(task.date);
      const monthKey = `${taskDate.getFullYear()}-${taskDate.getMonth()}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      
      grouped[monthKey].push(task);
    });
    
    return grouped;
  };

  // Функція для редагування задачі
  const handleEditTaskCommand = async (timeToEdit: string) => {
    try {
      // Отримуємо всі задачі з localStorage
      const savedTasksJson = localStorage.getItem("tasks");
      let allTasks: Task[] = [];
      
      if (savedTasksJson) {
        const parsedTasks = JSON.parse(savedTasksJson);
        allTasks = parsedTasks.map((task: any) => ({
          ...task,
          date: new Date(task.date)
        }));
      } else {
        allTasks = tasks;
      }

      // Знаходимо задачу на вказаний час
      const today = new Date();
      const [hours, minutes] = timeToEdit.split(':').map(Number);
      
      const taskToEdit = allTasks.find(task => {
        const taskDate = new Date(task.date);
        return taskDate.getDate() === today.getDate() &&
               taskDate.getMonth() === today.getMonth() &&
               taskDate.getFullYear() === today.getFullYear() &&
               taskDate.getHours() === hours &&
               taskDate.getMinutes() === minutes;
      });

      if (taskToEdit) {
        await speak(`Знайдено задачу на ${timeToEdit}: ${taskToEdit.title}. Що ви хочете змінити?`);
        // Тут можна додати логіку для зміни задачі через голосові команди
        // Наприклад, очікувати наступну команду з новим текстом задачі
      } else {
        await speak(`Вибачте, я не знайшов задачу на ${timeToEdit}. Спробуйте вказати інший час.`);
      }
    } catch (error) {
      console.error("Помилка при редагуванні задачі:", error);
      await speak("Вибачте, виникла помилка при редагуванні задачі.");
    }
  };

  // Компонент налаштувань Siri AI
  const SettingsPanel = () => {
    const [settings, setSettings] = useState<Settings>({...settings});
    
    const handleSave = () => {
      saveSettings(settings);
      setShowSettings(false);
      
      // Тестове привітання
      const greeting = `${settings.greeting}${settings.userName ? ', ' + settings.userName : ''}${settings.userTitle && !settings.userName ? ', ' + settings.userTitle : ''}`;
      speak(`${greeting}. Налаштування збережено.`);
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card p-6 rounded-lg shadow-lg w-[400px] space-y-4">
          <h2 className="text-lg font-bold">Налаштування Siri AI</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Привітання</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
                value={settings.greeting}
                onChange={(e) => setSettings({...settings, greeting: e.target.value})}
                placeholder="Да"
              />
              <p className="text-xs text-muted-foreground">Наприклад: Да, Слухаю, Так</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ваше ім'я (опціонально)</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
                value={settings.userName}
                onChange={(e) => setSettings({...settings, userName: e.target.value})}
                placeholder="Залиште порожнім, щоб не використовувати"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Звертання</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
                value={settings.userTitle}
                onChange={(e) => setSettings({...settings, userTitle: e.target.value})}
                placeholder="сер"
              />
              <p className="text-xs text-muted-foreground">Наприклад: шефе, бос, пане, мій повелитель</p>
            </div>
            
            <div className="pt-2">
              <p className="text-sm font-medium">Звучатиме як:</p>
              <p className="text-sm">"{`${settings.greeting}${settings.userName ? ', ' + settings.userName : ''}${settings.userTitle && !settings.userName ? ', ' + settings.userTitle : ''}`}. Перевіряю ваші задачі."</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button 
              className="px-4 py-2 border rounded-md"
              onClick={() => setShowSettings(false)}
            >
              Скасувати
            </button>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              onClick={handleSave}
            >
              Зберегти
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-28 right-1 z-50 flex flex-col items-end gap-2">
      {/* Показуємо діалог налаштувань, якщо showSettings = true */}
      {showSettings && <SettingsPanel />}
      
      {/* Спливаюча підказка/статус */}
      {(isSpeaking || isListening) && (
        <div className="bg-card p-3 rounded-lg shadow-lg animate-fade-in flex items-center gap-2 max-w-sm">
          {/* Голосові хвилі */}
          <div className="flex items-center h-8 gap-[2px]">
            {waveform.map((height, index) => (
              <div 
                key={index}
                className={`w-[2px] ${isListening ? "bg-yellow-400" : "bg-blue-400"} animate-pulse-fast`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          
          <div className="flex flex-col">
            {isListening && <span className="text-xs font-bold text-yellow-400">Слухаю...</span>}
            {isSpeaking && <span className="text-xs text-blue-400">Озвучую задачі...</span>}
            {recognizedText && <span className="text-xs">{recognizedText}</span>}
          </div>
          
          {/* Кнопка вимкнення голосу */}
          {isSpeaking && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={stopSpeaking}
            >
              <VolumeX className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

SiriAssistant.displayName = "SiriAssistant";

// Експортуємо додаткові властивості для використання в інших компонентах
export { type SiriAssistantProps }; 