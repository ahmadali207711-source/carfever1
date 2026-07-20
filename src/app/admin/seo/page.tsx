'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateSEOSettings, fetchAdminSeo, type SEOSettingsPayload } from '@/lib/admin-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DbSEOSetting } from '@/lib/supabase/types';

const PAGES: { path: string; name: string }[] = [
  { path: 'home',        name: 'Home Page' },
  { path: 'buy-car',     name: 'Buy Car' },
  { path: 'sell-car',    name: 'Sell Car' },
  { path: 'inspections', name: 'Inspections' },
  { path: 'blog',        name: 'Blog' },
  { path: 'about',       name: 'About Us' },
  { path: 'contact',     name: 'Contact' },
];

const EMPTY_FORM = {
  meta_title:       '',
  meta_description: '',
  canonical_url:    '',
  og_image:         '',
  schema_markup:    '',
};

type FormState = typeof EMPTY_FORM;

function schemaToString(value: DbSEOSetting['schema_markup']): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export default function AdminSEOPage() {
  const [selectedPath, setSelectedPath] = useState<string>(PAGES[0].path);
  const [formData,     setFormData]     = useState<FormState>(EMPTY_FORM);
  const [fetching,     setFetching]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [schemaError,  setSchemaError]  = useState<string | null>(null);

  const fetchSettings = useCallback(async (path: string) => {
    setFetching(true);
    setSchemaError(null);

    try {
      const allSeo = await fetchAdminSeo();
      const data = allSeo.find((item: any) => item.page_path === path);

      if (data) {
        setFormData({
          meta_title:       data.meta_title       ?? '',
          meta_description: data.meta_description ?? '',
          canonical_url:    data.canonical_url    ?? '',
          og_image:         data.og_image         ?? '',
          schema_markup:    schemaToString(data.schema_markup),
        });
      } else {
        setFormData(EMPTY_FORM);
      }
    } catch (err: any) {
      toast.error(`Failed to load SEO settings: ${err.message}`);
      setFormData(EMPTY_FORM);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings(selectedPath);
  }, [selectedPath, fetchSettings]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'schema_markup') setSchemaError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSchemaError(null);

    let parsedSchema: object | undefined;
    if (formData.schema_markup.trim()) {
      try {
        parsedSchema = JSON.parse(formData.schema_markup);
      } catch (err: any) {
        setSchemaError(`Invalid JSON: ${err.message}`);
        toast.error('JSON Schema syntax error. Check formatting below.');
        setSaving(false);
        return;
      }
    }

    const payload: SEOSettingsPayload = {
      meta_title:       formData.meta_title.trim()       || null,
      meta_description: formData.meta_description.trim() || null,
      canonical_url:    formData.canonical_url.trim()    || null,
      og_image:         formData.og_image.trim()         || null,
      schema_markup:    parsedSchema as any,
    };

    try {
      await updateSEOSettings(selectedPath, payload);
      toast.success(`SEO settings saved for "${selectedPath}"!`);
      await fetchSettings(selectedPath);
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedPage = PAGES.find(p => p.path === selectedPath) ?? PAGES[0];
  const isBusy = fetching || saving;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          SEO & Meta Management
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Configure page titles, descriptions, open graph cards, and JSON-LD schema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation panel */}
        <div className="md:col-span-4 lg:col-span-3">
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 text-sm font-bold">Select Page</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-400">
                Choose a page to edit its SEO settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <nav className="space-y-1">
                {PAGES.map(page => {
                  const active = selectedPath === page.path;
                  return (
                    <button
                      key={page.path}
                      onClick={() => setSelectedPath(page.path)}
                      disabled={fetching}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-blue-50 text-[#0055FE] border border-blue-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <span>{page.name}</span>
                      <Globe className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#0055FE]' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Form panel */}
        <div className="md:col-span-8 lg:col-span-9">
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-slate-900 text-lg font-extrabold">
                  {selectedPage.name}
                  <span className="ml-2 text-xs font-semibold text-slate-400">SEO Settings</span>
                </CardTitle>
                <CardDescription className="mt-1 font-mono text-xs text-slate-400">
                  page_path: <span className="text-slate-700 font-bold">&quot;{selectedPath}&quot;</span>
                </CardDescription>
              </div>
              <Button
                onClick={handleSave}
                disabled={isBusy}
                className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs shrink-0 rounded-xl cursor-pointer"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Settings</>
                )}
              </Button>
            </CardHeader>

            <CardContent>
              {fetching ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-[#0055FE]" />
                  <span className="text-xs font-semibold">Loading settings…</span>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6">

                  {/* Meta Title */}
                  <div className="space-y-2">
                    <Label htmlFor="meta_title" className="text-slate-700 text-xs font-bold">
                      Meta Title
                    </Label>
                    <Input
                      id="meta_title"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0055FE] text-xs rounded-xl"
                      placeholder="e.g. Buy Used Cars in Pakistan | Car Fever"
                    />
                    <div className="flex justify-between text-[11px] font-medium text-slate-400">
                      <span>Ideal: 50–60 characters</span>
                      <span className={formData.meta_title.length > 60 ? 'text-amber-600 font-bold' : ''}>
                        {formData.meta_title.length} / 60
                      </span>
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-2">
                    <Label htmlFor="meta_description" className="text-slate-700 text-xs font-bold">
                      Meta Description
                    </Label>
                    <Textarea
                      id="meta_description"
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleChange}
                      rows={3}
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0055FE] text-xs rounded-xl resize-none"
                      placeholder="A compelling one-sentence description that appears in search results…"
                    />
                    <div className="flex justify-between text-[11px] font-medium text-slate-400">
                      <span>Ideal: 150–160 characters</span>
                      <span className={formData.meta_description.length > 160 ? 'text-amber-600 font-bold' : ''}>
                        {formData.meta_description.length} / 160
                      </span>
                    </div>
                  </div>

                  {/* Canonical & OG Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="canonical_url" className="text-slate-700 text-xs font-bold">
                        Canonical URL
                      </Label>
                      <Input
                        id="canonical_url"
                        name="canonical_url"
                        value={formData.canonical_url}
                        onChange={handleChange}
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0055FE] text-xs rounded-xl"
                        placeholder="https://carfever.com/buy-car"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og_image" className="text-slate-700 text-xs font-bold">
                        OG Image URL
                      </Label>
                      <Input
                        id="og_image"
                        name="og_image"
                        value={formData.og_image}
                        onChange={handleChange}
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#0055FE] text-xs rounded-xl"
                        placeholder="https://…/og-image.jpg"
                      />
                    </div>
                  </div>

                  {/* Schema Markup */}
                  <div className="space-y-2">
                    <Label htmlFor="schema_markup" className="text-slate-700 text-xs font-bold">
                      JSON-LD Structured Data Schema
                    </Label>
                    <Textarea
                      id="schema_markup"
                      name="schema_markup"
                      value={formData.schema_markup}
                      onChange={handleChange}
                      rows={5}
                      className="bg-slate-50 border-slate-200 text-slate-900 font-mono text-xs rounded-xl focus:border-[#0055FE]"
                      placeholder='{ "@context": "https://schema.org", "@type": "WebPage", "name": "Buy Car" }'
                    />
                    {schemaError && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {schemaError}
                      </p>
                    )}
                  </div>

                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
