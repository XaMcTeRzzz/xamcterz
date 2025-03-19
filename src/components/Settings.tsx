import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { BotIcon, CheckIcon, SaveIcon, CalendarIcon, MailIcon, BellIcon, Moon, Sun, BellRing, Languages, Trash2, Mic, Clock, Send, AlertCircle, UploadCloud, FileKey } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TelegramSettings, loadTelegramSettings, saveTelegramSettings, validateBotToken, sendTestReport } from "@/lib/telegram-service";
import { initReportScheduler } from "@/lib/report-scheduler";

// Додаємо інтерфейс для голосових опцій
interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isNative: boolean;
}

interface SettingsFormValues {
  telegramUsername: string;
  telegramBotEnabled: boolean;
  emailEnabled: boolean;
  emailAddress: string;
  googleCalendarEnabled: boolean;
  googleCalendarId: string;
  reminderEnabled: boolean;
  defaultReminderTime: string;
  welcomeMessage: string;
}

// Оновлюємо інтерфейс налаштувань Siri AI
interface SiriSettings {
  greeting: string;
  userName: string;
  userTitle: string;
  useGoogleTTS: boolean;
  googleApiKey: string;
  useCloudTTS: boolean; // Використовувати Google Cloud TTS API замість Web Speech API
  apiKeyFile: string; // Назва файлу з ключем API
  voiceLanguage: string;
  voiceName: string;
  voiceRate: number;
  voicePitch: number;
}

// Константа для ключа localStorage
const SIRI_SETTINGS_KEY = "siri_settings";
const GOOGLE_API_KEY_KEY = "google_tts_api_key"; // Ключ для зберігання API ключа

// Оновлюємо дефолтні налаштування
const DEFAULT_SIRI_SETTINGS: SiriSettings = {
  greeting: "Привіт",
  userName: "",
  userTitle: "",
  useGoogleTTS: false,
  googleApiKey: "",
  useCloudTTS: false,
  apiKeyFile: "",
  voiceLanguage: "uk-UA",
  voiceName: "",
  voiceRate: 1,
  voicePitch: 1,
};

export function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("uk");
  
  // Додаємо стан для налаштувань Siri AI
  const [siriSettings, setSiriSettings] = useState<SiriSettings>(DEFAULT_SIRI_SETTINGS);
  // Стан для відтворення тестового привітання
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Стан для файлу API ключа
  const [apiKeyFilename, setApiKeyFilename] = useState<string>("");
  const [apiKeyContent, setApiKeyContent] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Додаємо стан для налаштувань Telegram
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(loadTelegramSettings());
  const [isTesting, setIsTesting] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  
  // Додаємо стан для голосів
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  
  // Initialize form with values from localStorage
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      telegramUsername: "",
      telegramBotEnabled: false,
      emailEnabled: false,
      emailAddress: "",
      googleCalendarEnabled: false,
      googleCalendarId: "",
      reminderEnabled: true,
      defaultReminderTime: "30",
      welcomeMessage: "Вітаю! Я ваш бот-асистент для задач.",
    }
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      form.reset(parsedSettings);
    }
    
    // Завантажуємо налаштування Siri AI
    loadSiriSettings();
    
    // Завантажуємо налаштування Telegram при ініціалізації
    const settings = loadTelegramSettings();
    setTelegramSettings(settings);
    
    // Ініціалізуємо планувальник звітів
    initReportScheduler();
  }, [form]);

  // Додаємо ефект для завантаження голосів
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

  // Функція для завантаження ключа API з файлу
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Оновлюємо назву файлу
    setApiKeyFilename(file.name);
    
    // Читаємо вміст файлу
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Перевіряємо, чи це валідний JSON
        JSON.parse(content);
        
        // Зберігаємо вміст файлу
        setApiKeyContent(content);
        
        // Зберігаємо API ключ в localStorage
        localStorage.setItem(GOOGLE_API_KEY_KEY, content);
        
        // Оновлюємо налаштування
        handleSiriSettingsChange("apiKeyFile", file.name);
        handleSiriSettingsChange("useCloudTTS", true);
        
        toast({
          title: "API ключ завантажено",
          description: `Файл ${file.name} успішно завантажено`,
        });
      } catch (error) {
        console.error("Помилка при зчитуванні файлу API ключа:", error);
        toast({
          title: "Помилка завантаження",
          description: "Файл не є валідним JSON файлом ключа API",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Функція для видалення ключа API
  const handleRemoveApiKey = () => {
    localStorage.removeItem(GOOGLE_API_KEY_KEY);
    setApiKeyFilename("");
    setApiKeyContent("");
    
    // Оновлюємо налаштування
    handleSiriSettingsChange("apiKeyFile", "");
    handleSiriSettingsChange("useCloudTTS", false);
    
    // Очищаємо input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast({
      title: "API ключ видалено",
      description: "Ключ API успішно видалено",
    });
  };

  // Функція для завантаження налаштувань Siri AI
  const loadSiriSettings = () => {
    try {
      const savedSettings = localStorage.getItem(SIRI_SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as SiriSettings;
        setSiriSettings(parsedSettings);
        
        // Якщо є збережений файл ключа, встановлюємо його назву
        if (parsedSettings.apiKeyFile) {
          setApiKeyFilename(parsedSettings.apiKeyFile);
          
          // Перевіряємо, чи є збережений ключ в localStorage
          const savedApiKey = localStorage.getItem(GOOGLE_API_KEY_KEY);
          if (savedApiKey) {
            setApiKeyContent(savedApiKey);
          }
        }
        
        console.log("Завантажено налаштування Siri AI:", parsedSettings);
      }
    } catch (error) {
      console.error("Помилка при завантаженні налаштувань Siri AI:", error);
    }
  };

  // Функція для тестування привітання
  const testGreeting = () => {
    setIsSpeaking(true);
    
    let fullGreeting = siriSettings.greeting;
    if (siriSettings.userName) {
      fullGreeting += `, ${siriSettings.userName}`;
    }
    if (siriSettings.userTitle) {
      fullGreeting += `, ${siriSettings.userTitle}`;
    }
    fullGreeting += ". Це тестове привітання від Siri AI.";
    
    const utterance = new SpeechSynthesisUtterance(fullGreeting);
    utterance.lang = siriSettings.voiceLanguage;
    utterance.rate = siriSettings.voiceRate;
    utterance.pitch = siriSettings.voicePitch;
    
    // Вибір конкретного голосу, якщо він вказаний
    if (siriSettings.voiceName) {
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === siriSettings.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    // Обробник для завершення відтворення
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    // Обробник для помилки відтворення
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({
        title: "Помилка відтворення",
        description: "Не вдалося відтворити голосове привітання",
        variant: "destructive",
      });
    };
    
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // При першому завантаженні перевіряємо збережену тему
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: "dark" | "light" | "system") => {
    const root = window.document.documentElement;
    
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const handleClearData = () => {
    if (window.confirm("Ви впевнені, що хочете видалити всі задачі? Цю дію неможливо скасувати.")) {
      try {
        localStorage.removeItem("tasks");
        toast({
          title: "Дані видалено",
          description: "Всі задачі були успішно видалені",
        });
      } catch (error) {
        console.error("Помилка при видаленні даних:", error);
        toast({
          title: "Помилка",
          description: "Не вдалося видалити дані",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (values: SettingsFormValues) => {
    localStorage.setItem("userSettings", JSON.stringify(values));
    toast({
      title: "Налаштування збережено",
      description: "Ваші налаштування успішно збережено",
    });
  };

  const handleSiriSettingsChange = (field: keyof SiriSettings, value: string | number | boolean) => {
    setSiriSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTelegramSettingChange = (field: keyof TelegramSettings, value: any) => {
    setTelegramSettings(prev => {
      const newSettings = { ...prev, [field]: value };
      saveTelegramSettings(newSettings);
      return newSettings;
    });
  };

  const handleScheduleSettingChange = (field: keyof TelegramSettings['reportSchedule'], value: any) => {
    setTelegramSettings(prev => {
      const newSettings = { 
        ...prev, 
        reportSchedule: { ...prev.reportSchedule, [field]: value } 
      };
      saveTelegramSettings(newSettings);
      return newSettings;
    });
  };

  const handleValidateToken = async () => {
    if (!telegramSettings.botToken) {
      toast({
        title: "Помилка",
        description: "Введіть токен бота для перевірки",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidatingToken(true);
    setIsTokenValid(null);
    
    try {
      const isValid = await validateBotToken(telegramSettings.botToken);
      setIsTokenValid(isValid);
      
      if (isValid) {
        toast({
          title: "Токен валідний",
          description: "Токен бота пройшов перевірку",
        });
      } else {
        toast({
          title: "Токен невалідний",
          description: "Токен бота не пройшов перевірку. Перевірте правильність введення",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Помилка при валідації токена:", error);
      setIsTokenValid(false);
      toast({
        title: "Помилка перевірки",
        description: "Не вдалося перевірити токен бота",
        variant: "destructive",
      });
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleSendTestReport = async () => {
    if (!telegramSettings.botToken || !telegramSettings.chatId) {
      toast({
        title: "Помилка",
        description: "Введіть токен бота та ID чату для відправки тестового звіту",
        variant: "destructive",
      });
      return;
    }
    
    setIsTesting(true);
    
    try {
      const result = await sendTestReport();
      
      if (result) {
        toast({
          title: "Тестовий звіт відправлено",
          description: "Перевірте свій Telegram",
        });
      } else {
        toast({
          title: "Помилка",
          description: "Не вдалося відправити тестовий звіт",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Помилка відправки тестового звіту:", error);
      toast({
        title: "Помилка",
        description: "Виникла помилка при відправці звіту",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Оновлюємо функцію renderSiriSettings, щоб додати функціонал завантаження API ключа
  const renderSiriSettings = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center"><Mic className="mr-2" size={20} />Налаштування Siri AI</CardTitle>
        <CardDescription>Налаштуйте голосового асистента для вашого додатка</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="greeting">Привітання</Label>
            <Input 
              id="greeting" 
              placeholder="Привіт" 
              value={siriSettings.greeting}
              onChange={(e) => handleSiriSettingsChange("greeting", e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userName">Ім'я користувача</Label>
              <Input 
                id="userName" 
                placeholder="Іван" 
                value={siriSettings.userName}
                onChange={(e) => handleSiriSettingsChange("userName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="userTitle">Звертання</Label>
              <Input 
                id="userTitle" 
                placeholder="пане" 
                value={siriSettings.userTitle}
                onChange={(e) => handleSiriSettingsChange("userTitle", e.target.value)}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="useGoogleTTS">Використовувати TTS</Label>
              <div className="text-sm text-muted-foreground">
                Увімкнути Text-to-Speech для озвучування
              </div>
            </div>
            <Switch 
              id="useGoogleTTS"
              checked={siriSettings.useGoogleTTS}
              onCheckedChange={(checked) => handleSiriSettingsChange("useGoogleTTS", checked)}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Google Cloud TTS API Key</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Завантажте файл з ключем API для використання Google Cloud TTS API
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                  id="api-key-file"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center"
                >
                  <UploadCloud className="mr-2" size={16} />
                  Завантажити ключ API
                </Button>
                
                {apiKeyFilename && (
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-2">
                      <FileKey className="inline mr-1" size={16} />
                      {apiKeyFilename}
                    </span>
                    <Button 
                      size="sm"
                      variant="ghost" 
                      onClick={handleRemoveApiKey}
                      title="Видалити ключ"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
              
              {apiKeyContent && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useCloudTTS">Використовувати Cloud TTS API</Label>
                    <div className="text-sm text-muted-foreground">
                      Використовувати розширені можливості Google Cloud TTS
                    </div>
                  </div>
                  <Switch 
                    id="useCloudTTS"
                    checked={siriSettings.useCloudTTS}
                    onCheckedChange={(checked) => handleSiriSettingsChange("useCloudTTS", checked)}
                  />
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="voiceLanguage">Мова голосу</Label>
              <Select 
                value={siriSettings.voiceLanguage}
                onValueChange={(value) => handleSiriSettingsChange("voiceLanguage", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть мову" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uk-UA">Українська</SelectItem>
                  <SelectItem value="en-US">Англійська (США)</SelectItem>
                  <SelectItem value="ru-RU">Російська</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Додаємо селектор для вибору конкретного голосу */}
            <div>
              <Label htmlFor="voiceName">Голос</Label>
              <Select 
                value={siriSettings.voiceName}
                onValueChange={(value) => handleSiriSettingsChange("voiceName", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть голос" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">За замовчуванням</SelectItem>
                  {availableVoices
                    .filter(voice => voice.lang.includes(siriSettings.voiceLanguage.split('-')[0]))
                    .map(voice => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} {voice.isNative ? '(Локальний)' : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="voiceRate">Швидкість</Label>
              <div className="flex items-center">
                <Input
                  id="voiceRate"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={siriSettings.voiceRate}
                  onChange={(e) => handleSiriSettingsChange("voiceRate", parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="ml-2 text-sm">{siriSettings.voiceRate}x</span>
              </div>
            </div>
          
            <div>
              <Label htmlFor="voicePitch">Висота голосу</Label>
              <div className="flex items-center">
                <Input
                  id="voicePitch"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={siriSettings.voicePitch}
                  onChange={(e) => handleSiriSettingsChange("voicePitch", parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="ml-2 text-sm">{siriSettings.voicePitch}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={testGreeting}
          disabled={isSpeaking}
        >
          {isSpeaking ? "Говорить..." : (
            <>
              <Mic className="mr-2" size={16} />
              Тестувати голос
            </>
          )}
        </Button>
        <Button 
          onClick={() => saveSiriSettings(siriSettings)}
          disabled={isSaving}
        >
          <SaveIcon className="mr-2" size={16} />
          Зберегти налаштування
        </Button>
      </CardFooter>
    </Card>
  );

  // Додаємо функцію для збереження налаштувань Siri AI
  const saveSiriSettings = (settings: SiriSettings) => {
    try {
      setIsSaving(true);
      localStorage.setItem(SIRI_SETTINGS_KEY, JSON.stringify(settings));
      setSiriSettings(settings);
      console.log("Збережено налаштування Siri AI:", settings);
      toast({
        title: "Налаштування Siri AI збережено",
        description: "Ваші налаштування успішно збережено",
      });
    } catch (error) {
      console.error("Помилка при збереженні налаштувань Siri AI:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування Siri AI",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-xl font-semibold text-primary">Налаштування</h2>
      
      {renderSiriSettings()}
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Зовнішній вигляд</CardTitle>
          <CardDescription>Змініть тему додатку</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>Тема</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={theme === "light" ? "default" : "outline"} 
                size="sm"
                onClick={() => handleThemeChange("light")}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Sun className="h-4 w-4" />
                <span className="sr-only">Світла</span>
              </Button>
              <Button 
                variant={theme === "dark" ? "default" : "outline"} 
                size="sm"
                onClick={() => handleThemeChange("dark")}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Moon className="h-4 w-4" />
                <span className="sr-only">Темна</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Сповіщення</CardTitle>
          <CardDescription>Налаштування сповіщень</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              <Label htmlFor="notifications">Сповіщення про задачі</Label>
            </div>
            <Switch 
              id="notifications" 
              checked={notifications} 
              onCheckedChange={setNotifications} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Мова</CardTitle>
          <CardDescription>Оберіть мову інтерфейсу</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              <span>Мова</span>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-1"
            >
              <option value="uk">Українська</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Дані</CardTitle>
          <CardDescription>Керування даними додатку</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleClearData}
            className="w-full flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Видалити всі задачі</span>
          </Button>
        </CardContent>
      </Card>

      {/* Telegram Bot Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="h-5 w-5" />
            Telegram Bot
          </CardTitle>
          <CardDescription>Налаштування бота для відправки звітів</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Увімкнути Telegram бота</Label>
              <p className="text-xs text-muted-foreground">Отримуйте звіти про задачі через Telegram</p>
            </div>
            <Switch 
              checked={telegramSettings.enabled} 
              onCheckedChange={(checked) => handleTelegramSettingChange('enabled', checked)}
            />
          </div>

          {telegramSettings.enabled && (
            <>
              <Separator className="my-2" />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-token">Токен бота</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bot-token"
                      type="password"
                      value={telegramSettings.botToken}
                      onChange={(e) => handleTelegramSettingChange('botToken', e.target.value)}
                      placeholder="123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleValidateToken}
                      disabled={isValidatingToken || !telegramSettings.botToken}
                    >
                      {isValidatingToken ? "Перевірка..." : "Перевірити"}
                    </Button>
                  </div>
                  {isTokenValid !== null && (
                    <p className={`text-xs ${isTokenValid ? "text-green-500" : "text-red-500"}`}>
                      {isTokenValid ? "✓ Токен валідний" : "✗ Токен невалідний"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Створіть бота через @BotFather в Telegram і отримайте токен
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat-id">ID чату</Label>
                  <Input
                    id="chat-id"
                    value={telegramSettings.chatId}
                    onChange={(e) => handleTelegramSettingChange('chatId', e.target.value)}
                    placeholder="123456789"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ваш особистий ID в Telegram або ID групового чату
                  </p>
                </div>

                <Separator className="my-2" />

                <div className="space-y-2">
                  <Label>Розклад звітів</Label>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Щоденний звіт</span>
                        <p className="text-xs text-muted-foreground">Отримуйте звіт про задачі щодня</p>
                      </div>
                      <Switch 
                        checked={telegramSettings.reportSchedule.daily} 
                        onCheckedChange={(checked) => handleScheduleSettingChange('daily', checked)}
                      />
                    </div>

                    {telegramSettings.reportSchedule.daily && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="daily-time">Час відправки</Label>
                        <Input
                          id="daily-time"
                          type="time"
                          value={telegramSettings.reportSchedule.dailyTime}
                          onChange={(e) => handleScheduleSettingChange('dailyTime', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Щотижневий звіт</span>
                        <p className="text-xs text-muted-foreground">Отримуйте підсумковий звіт за тиждень</p>
                      </div>
                      <Switch 
                        checked={telegramSettings.reportSchedule.weekly} 
                        onCheckedChange={(checked) => handleScheduleSettingChange('weekly', checked)}
                      />
                    </div>

                    {telegramSettings.reportSchedule.weekly && (
                      <div className="ml-6 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="weekly-day">День тижня</Label>
                          <Select 
                            value={telegramSettings.reportSchedule.weeklyDay.toString()} 
                            onValueChange={(value) => handleScheduleSettingChange('weeklyDay', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть день" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Неділя</SelectItem>
                              <SelectItem value="1">Понеділок</SelectItem>
                              <SelectItem value="2">Вівторок</SelectItem>
                              <SelectItem value="3">Середа</SelectItem>
                              <SelectItem value="4">Четвер</SelectItem>
                              <SelectItem value="5">П'ятниця</SelectItem>
                              <SelectItem value="6">Субота</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="weekly-time">Час відправки</Label>
                          <Input
                            id="weekly-time"
                            type="time"
                            value={telegramSettings.reportSchedule.weeklyTime}
                            onChange={(e) => handleScheduleSettingChange('weeklyTime', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTestReport}
                    disabled={isTesting || !telegramSettings.botToken || !telegramSettings.chatId}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isTesting ? "Відправка..." : "Відправити тестовий звіт"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="h-10"></div>
    </div>
  );
}
