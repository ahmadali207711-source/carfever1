'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Save,
  Loader2,
  RefreshCw,
  Phone,
  Share2,
  Layout,
  Globe,
  MapPin,
  Clock,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { saveSiteSettings, fetchAdminSettings } from '@/lib/admin-actions';

const SETTING_KEYS = [
  // General & Landing Page
  'site_name',
  'site_tagline',
  'hero_title',
  'hero_subtitle',
  'cta_text',
  'announcement_banner',
  'footer_copyright',

  // Contact & Location Details
  'contact_email',
  'contact_phone',
  'emergency_hotline',
  'business_address',
  'city',
  'working_hours',

  // Social Media Links
  'social_facebook',
  'social_instagram',
  'social_twitter',
  'social_youtube',
  'social_linkedin',
  'whatsapp_number',
] as const;

type SettingKey = (typeof SETTING_KEYS)[number];
type SettingsState = Record<SettingKey, string>;

const DEFAULTS: SettingsState = {
  site_name: 'Car Fever',
  site_tagline: 'Pakistan\'s Premier Car Marketplace & Inspection Service',
  hero_title: 'Find, Inspect & Drive Your Dream Car With Confidence',
  hero_subtitle: 'Verified listings, 200+ point expert inspections, and seamless buying & selling.',
  cta_text: 'Explore Verified Cars',
  announcement_banner: '🔥 Certified 200+ Point Car Inspection Services Now Live in Major Cities!',
  footer_copyright: '© 2026 Car Fever Pakistan. All Rights Reserved.',

  contact_email: 'support@carfever.pk',
  contact_phone: '+92 300 1234567',
  emergency_hotline: '+92 800 2273383',
  business_address: 'Plaza #45, Main Boulevard, Gulberg III',
  city: 'Lahore, Pakistan',
  working_hours: 'Mon - Sat: 9:00 AM - 8:00 PM',

  social_facebook: 'https://facebook.com/carfeverpk',
  social_instagram: 'https://instagram.com/carfeverpk',
  social_twitter: 'https://x.com/carfeverpk',
  social_youtube: 'https://youtube.com/@carfeverpk',
  social_linkedin: 'https://linkedin.com/company/carfeverpk',
  whatsapp_number: '+923001234567',
};

const inputCls = "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0055FE] text-xs rounded-xl shadow-xs";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'contact' | 'social' | 'landing'>('all');

  const loadSettings = useCallback(async () => {
    setFetching(true);
    try {
      const data = await fetchAdminSettings();
      const loaded: SettingsState = { ...DEFAULTS };
      for (const key of SETTING_KEYS) {
        if (data[key] !== undefined && data[key] !== null) {
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setSettings(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSiteSettings(settings);
      toast.success('Site settings updated successfully!');
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Site & Landing Page Settings</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Manage all contact information, social links, and landing page content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            disabled={fetching}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Button
            onClick={handleSave}
            disabled={fetching || saving}
            className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer h-9 px-4"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          { id: 'all', label: 'All Settings', icon: Globe },
          { id: 'contact', label: 'Contact & Location', icon: Phone },
          { id: 'social', label: 'Social Media', icon: Share2 },
          { id: 'landing', label: 'Landing Page & Branding', icon: Layout },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-[#0055FE] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6">

        {/* 1. Contact & Location Details */}
        {(activeTab === 'all' || activeTab === 'contact') && (
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0055FE] flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 text-base font-bold">Contact & Location Details</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">Public contact channels, phone numbers, and physical showroom address.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {fetching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Support Email Address
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={handleChange('contact_email')}
                      placeholder="support@carfever.pk"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="text-xs font-bold text-slate-700">
                      Primary Contact Phone
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
                    <Label htmlFor="emergency_hotline" className="text-xs font-bold text-slate-700">
                      Emergency / Support Hotline
                    </Label>
                    <Input
                      id="emergency_hotline"
                      type="tel"
                      value={settings.emergency_hotline}
                      onChange={handleChange('emergency_hotline')}
                      placeholder="+92 800 2273383"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="working_hours" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Support / Showroom Working Hours
                    </Label>
                    <Input
                      id="working_hours"
                      value={settings.working_hours}
                      onChange={handleChange('working_hours')}
                      placeholder="Mon - Sat: 9:00 AM - 8:00 PM"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      City / Region
                    </Label>
                    <Input
                      id="city"
                      value={settings.city}
                      onChange={handleChange('city')}
                      placeholder="Lahore, Pakistan"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="business_address" className="text-xs font-bold text-slate-700">
                      Showroom / Office Physical Address
                    </Label>
                    <Input
                      id="business_address"
                      value={settings.business_address}
                      onChange={handleChange('business_address')}
                      placeholder="Plaza #45, Main Boulevard, Gulberg III, Lahore"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 2. Social Media & Link Connections */}
        {(activeTab === 'all' || activeTab === 'social') && (
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 text-base font-bold">Social Media & Direct Links</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">Connect your official social channels and WhatsApp instant chat.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {fetching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp Direct Chat Number
                    </Label>
                    <Input
                      id="whatsapp_number"
                      type="tel"
                      value={settings.whatsapp_number}
                      onChange={handleChange('whatsapp_number')}
                      placeholder="+923001234567"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_facebook" className="text-xs font-bold text-slate-700">
                      Facebook Page URL
                    </Label>
                    <Input
                      id="social_facebook"
                      type="url"
                      value={settings.social_facebook}
                      onChange={handleChange('social_facebook')}
                      placeholder="https://facebook.com/carfeverpk"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_instagram" className="text-xs font-bold text-slate-700">
                      Instagram Profile URL
                    </Label>
                    <Input
                      id="social_instagram"
                      type="url"
                      value={settings.social_instagram}
                      onChange={handleChange('social_instagram')}
                      placeholder="https://instagram.com/carfeverpk"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_twitter" className="text-xs font-bold text-slate-700">
                      Twitter / X Handle URL
                    </Label>
                    <Input
                      id="social_twitter"
                      type="url"
                      value={settings.social_twitter}
                      onChange={handleChange('social_twitter')}
                      placeholder="https://x.com/carfeverpk"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_youtube" className="text-xs font-bold text-slate-700">
                      YouTube Channel URL
                    </Label>
                    <Input
                      id="social_youtube"
                      type="url"
                      value={settings.social_youtube}
                      onChange={handleChange('social_youtube')}
                      placeholder="https://youtube.com/@carfeverpk"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_linkedin" className="text-xs font-bold text-slate-700">
                      LinkedIn Page URL
                    </Label>
                    <Input
                      id="social_linkedin"
                      type="url"
                      value={settings.social_linkedin}
                      onChange={handleChange('social_linkedin')}
                      placeholder="https://linkedin.com/company/carfeverpk"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 3. Landing Page Content & Branding */}
        {(activeTab === 'all' || activeTab === 'landing') && (
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 text-base font-bold">Landing Page & Branding</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">Configure marketplace title, hero section copy, banner message, and copyright text.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {fetching ? (
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name" className="text-xs font-bold text-slate-700">
                      Platform Name
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
                    <Label htmlFor="cta_text" className="text-xs font-bold text-slate-700">
                      Primary Hero Call-To-Action Button
                    </Label>
                    <Input
                      id="cta_text"
                      value={settings.cta_text}
                      onChange={handleChange('cta_text')}
                      placeholder="Explore Verified Cars"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="site_tagline" className="text-xs font-bold text-slate-700">
                      Brand Tagline
                    </Label>
                    <Input
                      id="site_tagline"
                      value={settings.site_tagline}
                      onChange={handleChange('site_tagline')}
                      placeholder="Pakistan's Premier Car Marketplace & Inspection Service"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="hero_title" className="text-xs font-bold text-slate-700">
                      Landing Page Main Hero Title
                    </Label>
                    <Input
                      id="hero_title"
                      value={settings.hero_title}
                      onChange={handleChange('hero_title')}
                      placeholder="Find, Inspect & Drive Your Dream Car With Confidence"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="hero_subtitle" className="text-xs font-bold text-slate-700">
                      Landing Page Hero Subtitle
                    </Label>
                    <Textarea
                      id="hero_subtitle"
                      rows={2}
                      value={settings.hero_subtitle}
                      onChange={handleChange('hero_subtitle')}
                      placeholder="Verified listings, 200+ point expert inspections, and seamless buying & selling."
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0055FE] text-xs rounded-xl shadow-xs"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="announcement_banner" className="text-xs font-bold text-slate-700">
                      Top Header Announcement Bar Message
                    </Label>
                    <Input
                      id="announcement_banner"
                      value={settings.announcement_banner}
                      onChange={handleChange('announcement_banner')}
                      placeholder="🔥 Certified 200+ Point Car Inspection Services Now Live!"
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="footer_copyright" className="text-xs font-bold text-slate-700">
                      Footer Copyright & Legal Disclaimer
                    </Label>
                    <Input
                      id="footer_copyright"
                      value={settings.footer_copyright}
                      onChange={handleChange('footer_copyright')}
                      placeholder="© 2026 Car Fever Pakistan. All Rights Reserved."
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
                  <><Save className="w-4 h-4 mr-2" /> Save All Settings</>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

      </div>
    </div>
  );
}
