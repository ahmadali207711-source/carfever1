'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Save, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { saveSiteSettings, fetchAdminSettings } from '@/lib/admin-actions';

const SETTING_KEYS = [
  'site_name',
  'contact_email',
  'contact_phone',
  'currency',
  'stripe_public_key',
  'google_analytics_id',
] as const;

type SettingKey = (typeof SETTING_KEYS)[number];
type SettingsState = Record<SettingKey, string>;

const DEFAULTS: SettingsState = {
  site_name:            '',
  contact_email:        '',
  contact_phone:        '',
  currency:             'PKR',
  stripe_public_key:    '',
  google_analytics_id:  '',
};

const inputCls = "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0055FE] text-xs rounded-xl";

export default function AdminSettingsPage() {
  const [settings,     setSettings]     = useState<SettingsState>(DEFAULTS);
  const [fetching,     setFetching]     = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);

  const loadSettings = useCallback(async () => {
    setFetching(true);
    try {
      const data = await fetchAdminSettings();
      const loaded: SettingsState = { ...DEFAULTS };
      for (const key of SETTING_KEYS) {
        if (data[key] !== undefined) {
          loaded[key] = String(data[key]);
        }
      }
      setSettings(loaded);
    } catch (err: any) {
      toast.error(`Failed to load settings: ${err.message}`);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key: SettingKey) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSettings(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSiteSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const Skeleton = () => (
    <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Global marketplace and integration configurations.
          </p>
        </div>
        <button
          onClick={loadSettings}
          disabled={fetching}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6">

        {/* General Information */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-slate-900 text-base font-bold">General Information</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-400">Basic details about your marketplace.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {fetching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site_name" className="text-xs font-bold text-slate-700">
                    Site Name
                  </Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={handleChange('site_name')}
                    placeholder="Car Fever"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="text-xs font-bold text-slate-700">
                    Contact Email
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={handleChange('contact_email')}
                    placeholder="contact@carfever.com"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="text-xs font-bold text-slate-700">
                    Contact Phone
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={settings.contact_phone}
                    onChange={handleChange('contact_phone')}
                    placeholder="+92 300 1234567"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-xs font-bold text-slate-700">
                    Default Currency
                  </Label>
                  <Input
                    id="currency"
                    value={settings.currency}
                    onChange={handleChange('currency')}
                    placeholder="PKR"
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-slate-900 text-base font-bold">Integrations & API Keys</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-400">Manage external service credentials.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {fetching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => <Skeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe_public_key" className="text-xs font-bold text-slate-700">
                    Stripe Publishable Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="stripe_public_key"
                      type={showStripeKey ? 'text' : 'password'}
                      value={settings.stripe_public_key}
                      onChange={handleChange('stripe_public_key')}
                      placeholder="pk_test_…"
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showStripeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_analytics_id" className="text-xs font-bold text-slate-700">
                    Google Analytics ID
                  </Label>
                  <Input
                    id="google_analytics_id"
                    value={settings.google_analytics_id}
                    onChange={handleChange('google_analytics_id')}
                    placeholder="G-XXXXXXXXXX"
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-slate-100 px-6 py-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={fetching || saving}
              className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Settings</>
              )}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
