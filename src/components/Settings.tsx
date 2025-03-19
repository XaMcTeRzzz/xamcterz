import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { BotIcon, CheckIcon, SaveIcon, CalendarIcon, MailIcon, BellIcon, Moon, Sun, BellRing, Languages, Trash2, Mic, Clock, Send, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TelegramSettings, loadTelegramSettings, saveTelegramSettings, validateBotToken, sendTestReport } from "@/lib/telegram-service";
import { initReportScheduler } from "@/lib/report-scheduler";

// Додаємо імпорт для SpeechSynthesisUtterance, щоб протестувати звучання привітання
declare global {
  interface Window {
    speechSynthesis: SpeechSynthesis;
    SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;
  }
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
  voiceLanguage: string;
  voiceName: string;
  voiceRate: number;
  voicePitch: number;
}

// Константа для ключа localStorage
const SIRI_SETTINGS_KEY = "siri_settings";

// Оновлюємо дефолтні налаштування
const DEFAULT_SIRI_SETTINGS: SiriSettings = {
  greeting: "Привіт",
  userName: "",
  userTitle: "",
  useGoogleTTS: false,
  googleApiKey: "",
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
  
  // Додаємо стан для налаштувань Telegram
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(loadTelegramSettings());
  const [isTesting, setIsTesting] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  
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

  // Функція для завантаження налаштувань Siri AI
  const loadSiriSettings = () => {
    try {
      const savedSettings = localStorage.getItem(SIRI_SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as SiriSettings;
        setSiriSettings(parsedSettings);
        console.log("Завантажено налаштування Siri AI:", parsedSettings);
      }
    } catch (error) {
      console.error("Помилка при завантаженні налаштувань Siri AI:", error);
    }
  };

  // Функція для збереження налаштувань Siri AI
  const saveSiriSettings = (settings: SiriSettings) => {
    try {
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
    }
  };

  // Функція для тестування привітання
  const testGreeting = () => {
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
    
    if (siriSettings.voiceName) {
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === siriSettings.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
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
    
    localStorage.setItem("theme", newTheme);
  };

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    applyTheme(newTheme);
    
    toast({
      title: "Тема змінена",
      description: `Обрано ${
        newTheme === "dark" ? "темну" : newTheme === "light" ? "світлу" : "системну"
      } тему`,
    });
  };

  const handleClearData = () => {
    const confirmed = window.confirm("Ви впевнені, що хочете видалити всі задачі? Цю дію неможливо скасувати.");
    
    if (confirmed) {
      localStorage.removeItem("tasks");
      
      toast({
        title: "Всі дані видалено",
        description: "Всі задачі були успішно видалені",
      });
      
      // Перезавантажуємо сторінку для оновлення стану
      window.location.reload();
    }
  };

  // Save settings to localStorage
  const onSubmit = (values: SettingsFormValues) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("userSettings", JSON.stringify(values));
      setIsSaving(false);
      toast({
        title: "Налаштування збережено",
        description: "Ваші параметри були успішно збережені",
      });
    }, 800);
  };

  // Обробник зміни налаштувань Siri AI
  const handleSiriSettingsChange = (field: keyof SiriSettings, value: string | number | boolean) => {
    setSiriSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Обробник зміни налаштувань Telegram
  const handleTelegramSettingChange = (field: keyof TelegramSettings, value: any) => {
    setTelegramSettings(prev => {
      const newSettings = { ...prev, [field]: value };
      saveTelegramSettings(newSettings);
      return newSettings;
    });
  };

  // Обробник зміни налаштувань розкладу
  const handleScheduleSettingChange = (field: keyof TelegramSettings['reportSchedule'], value: any) => {
    setTelegramSettings(prev => {
      const newSettings = { 
        ...prev, 
        reportSchedule: { 
          ...prev.reportSchedule, 
          [field]: value 
        } 
      };
      saveTelegramSettings(newSettings);
      return newSettings;
    });
  };

  // Перевірка валідності токена бота
  const handleValidateToken = async () => {
    if (!telegramSettings.botToken) {
      toast({
        title: "Помилка",
        description: "Введіть токен бота",
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
          description: "Токен бота успішно перевірено",
        });
      } else {
        toast({
          title: "Невалідний токен",
          description: "Перевірте правильність введеного токена",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Помилка перевірки токена:", error);
      setIsTokenValid(false);
      toast({
        title: "Помилка",
        description: "Не вдалося перевірити токен бота",
        variant: "destructive",
      });
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Відправка тестового звіту
  const handleSendTestReport = async () => {
    if (!telegramSettings.botToken || !telegramSettings.chatId) {
      toast({
        title: "Помилка",
        description: "Введіть токен бота та ID чату",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const success = await sendTestReport();

      if (success) {
        toast({
          title: "Тестовий звіт відправлено",
          description: "Перевірте повідомлення у Telegram",
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

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-xl font-semibold text-primary">Налаштування</h2>
      
      {/* Додаємо картку з налаштуваннями Siri AI */}
      <Card>
        <CardHeader>
          <CardTitle>
            Голосовий асистент "Siri AI"
          </CardTitle>
          <CardDescription>
            Налаштуйте голосового асистента під себе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Форма налаштувань */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="greeting">Привітання</Label>
              <Input
                id="greeting"
                value={siriSettings.greeting}
                onChange={(e) => handleSiriSettingsChange("greeting", e.target.value)}
                placeholder="Наприклад: Привіт"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userName">Ваше ім'я</Label>
              <Input
                id="userName"
                value={siriSettings.userName}
                onChange={(e) => handleSiriSettingsChange("userName", e.target.value)}
                placeholder="Як до вас звертатися"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userTitle">Звертання</Label>
              <Input
                id="userTitle"
                value={siriSettings.userTitle}
                onChange={(e) => handleSiriSettingsChange("userTitle", e.target.value)}
                placeholder="Наприклад: пане"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Приклад привітання</Label>
              <p className="text-sm">"{siriSettings.greeting}. Я Siri AI, ваш особистий асистент.{siriSettings.userName ? ` ${siriSettings.userName},` : ''} {siriSettings.userTitle}. Давайте подивимося на ваші задачі на сьогодні."</p>
              <Button onClick={testGreeting} variant="outline" size="sm">
                Тест привітання
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => saveSiriSettings(siriSettings)}>
            Зберегти налаштування
          </Button>
        </CardFooter>
      </Card>
      
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
                              <SelectItem value="1">Понеділок</SelectItem>
                              <SelectItem value="2">Вівторок</SelectItem>
                              <SelectItem value="3">Середа</SelectItem>
                              <SelectItem value="4">Четвер</SelectItem>
                              <SelectItem value="5">П'ятниця</SelectItem>
                              <SelectItem value="6">Субота</SelectItem>
                              <SelectItem value="0">Неділя</SelectItem>
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
              </div>
            </>
          )}
        </CardContent>
        {telegramSettings.enabled && (
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendTestReport}
              disabled={isTesting || !telegramSettings.botToken || !telegramSettings.chatId}
              className="flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
              {isTesting ? "Відправка..." : "Надіслати тестовий звіт"}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Telegram Integration */}
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Telegram інтеграція</h3>
                <p className="text-sm text-muted-foreground">Отримуйте сповіщення через Telegram</p>
              </div>
              <FormField
                control={form.control}
                name="telegramBotEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("telegramBotEnabled") && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="telegramUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ваш Telegram username</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">@</span>
                          <Input placeholder="username" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Введіть ваш username без символу @
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="welcomeMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Привітальне повідомлення</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Введіть текст, який бот надішле вам після з'єднання" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Email Integration */}
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Email сповіщення</h3>
                <p className="text-sm text-muted-foreground">Отримуйте нагадування на пошту</p>
              </div>
              <FormField
                control={form.control}
                name="emailEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("emailEnabled") && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email адреса</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your@email.com" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Google Calendar Integration */}
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">Синхронізуйте задачі з Google Calendar</p>
              </div>
              <FormField
                control={form.control}
                name="googleCalendarEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("googleCalendarEnabled") && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="googleCalendarId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Google Calendar</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="calendar_id@group.calendar.google.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Знайдіть ID календаря в налаштуваннях Google Calendar
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <Button variant="outline" className="w-full" type="button">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Підключити Google Calendar
                </Button>
              </div>
            )}
          </div>

          {/* Reminders */}
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Нагадування</h3>
                <p className="text-sm text-muted-foreground">Налаштування сповіщень про задачі</p>
              </div>
              <FormField
                control={form.control}
                name="reminderEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("reminderEnabled") && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="defaultReminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Час нагадування за замовчуванням</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        Час, коли ви бажаєте отримувати нагадування
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <SaveIcon className="mr-2 h-4 w-4 animate-spin" />
                Зберігаємо...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Зберегти налаштування
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
