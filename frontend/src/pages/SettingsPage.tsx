import { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Key,
  Globe,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfile({ name, email });
      toast.success('Gespeichert', 'Dein Profil wurde aktualisiert.');
    } catch {
      toast.error('Fehler', 'Profil konnte nicht aktualisiert werden.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="h-8 w-8 text-cyan-400" />
          Einstellungen
        </h1>
        <p className="mt-1 text-slate-400">
          Verwalte dein Konto und Präferenzen
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Darstellung
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Sicherheit
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Abrechnung
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>
                Verwalte deine persönlichen Informationen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar size="xl">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.split(' ').map((n) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Bild ändern
                  </Button>
                  <p className="mt-1 text-xs text-slate-500">
                    JPG, PNG oder GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dein Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} isLoading={isLoading}>
                  Änderungen speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Darstellung</CardTitle>
              <CardDescription>
                Passe das Aussehen der App an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-slate-400 mb-4">
                  Wähle zwischen Hell, Dunkel oder System
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'light', icon: Sun, label: 'Hell' },
                    { value: 'dark', icon: Moon, label: 'Dunkel' },
                    { value: 'system', icon: Monitor, label: 'System' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                        theme === option.value
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <option.icon
                        className={`h-6 w-6 ${
                          theme === option.value ? 'text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                      <span
                        className={
                          theme === option.value ? 'text-white' : 'text-slate-400'
                        }
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Language */}
              <div>
                <Label className="text-base">Sprache</Label>
                <p className="text-sm text-slate-400 mb-4">
                  Wähle deine bevorzugte Sprache
                </p>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <select className="flex h-10 w-full max-w-xs rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
              <CardDescription>
                Konfiguriere deine Benachrichtigungseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: 'E-Mail Benachrichtigungen',
                  description: 'Erhalte Updates per E-Mail',
                  enabled: true,
                },
                {
                  title: 'Chat-Benachrichtigungen',
                  description: 'Benachrichtige mich bei neuen Antworten',
                  enabled: true,
                },
                {
                  title: 'Team-Updates',
                  description: 'Benachrichtigungen über Team-Aktivitäten',
                  enabled: false,
                },
                {
                  title: 'Marketing',
                  description: 'Neuigkeiten und Produktupdates',
                  enabled: false,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={item.enabled}
                    className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sicherheit</CardTitle>
              <CardDescription>
                Verwalte deine Sicherheitseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div>
                <Label className="text-base">Passwort ändern</Label>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Aktuelles Passwort</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Neues Passwort</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <Button variant="outline">Passwort aktualisieren</Button>
                </div>
              </div>

              <Separator />

              {/* API Keys */}
              <div>
                <Label className="text-base">API-Schlüssel</Label>
                <p className="text-sm text-slate-400 mb-4">
                  Verwalte deine API-Schlüssel für externe Integrationen
                </p>
                <Button variant="outline" leftIcon={<Key className="h-4 w-4" />}>
                  Neuen API-Schlüssel erstellen
                </Button>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div>
                <Label className="text-base text-red-400">Gefahrenzone</Label>
                <p className="text-sm text-slate-400 mb-4">
                  Irreversible Aktionen
                </p>
                <Button variant="destructive">Konto löschen</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Abrechnung</CardTitle>
              <CardDescription>
                Verwalte dein Abonnement und Zahlungsmethoden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Aktueller Plan</p>
                    <p className="text-xl font-semibold text-white capitalize">
                      {user?.plan || 'Free'}
                    </p>
                  </div>
                  <Button>Upgraden</Button>
                </div>
              </div>

              {/* Usage */}
              <div>
                <Label className="text-base">Nutzung diesen Monat</Label>
                <div className="mt-4 space-y-3">
                  {[
                    { label: 'API Calls', used: 1250, limit: 5000 },
                    { label: 'Nachrichten', used: 342, limit: 1000 },
                    { label: 'Speicher', used: 45, limit: 100, unit: 'MB' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-white">
                          {item.used} / {item.limit} {item.unit || ''}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${(item.used / item.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
