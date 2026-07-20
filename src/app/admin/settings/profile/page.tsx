"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Save, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, updateProfile, changePassword, updateEmail } from "@/lib/profile-actions";
import type { ProfileData } from "@/lib/profile-actions";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Status
  const [activeTab, setActiveTab] = useState<"profile" | "email" | "password">("profile");

  useEffect(() => {
    getProfile()
      .then(data => {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setNewEmail(data.auth_email);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, phone: phone || undefined, bio: bio || undefined });
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) { toast.error("Invalid email"); return; }
    if (!emailPassword) { toast.error("Password is required to change email"); return; }
    setSavingEmail(true);
    try {
      await updateEmail(newEmail, emailPassword);
      toast.success("Email updated! Check your new inbox for confirmation.");
      setEmailPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "email" as const, label: "Email", icon: Mail },
    { id: "password" as const, label: "Password", icon: Lock },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your personal information and security</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#0055FE] text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleUpdateProfile} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Email (read-only)</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type="email" value={profile?.auth_email || ""} disabled
                className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400 text-sm cursor-not-allowed" />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Use the Email tab to change your email address</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 1234567"
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm resize-none" />
          </div>

          <Button type="submit" disabled={saving}
            className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 px-8">
            {saving ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
          </Button>
        </form>
      )}

      {/* Email Tab */}
      {activeTab === "email" && (
        <form onSubmit={handleUpdateEmail} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <strong>Caution:</strong> Changing your email will log you out. You&apos;ll need to verify the new address.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Current Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type="email" value={profile?.auth_email || ""} disabled
                className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400 text-sm cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">New Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
            </div>
          </div>

          <Button type="submit" disabled={savingEmail}
            className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 px-8">
            {savingEmail ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</span> : <><Mail className="w-4 h-4 mr-2" /> Update Email</>}
          </Button>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                Your password must be at least 6 characters. We&apos;ll verify your current password before updating.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type={showPw ? "text" : "password"} value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-10 pr-10 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type={showPw ? "text" : "password"} value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input type={showPw ? "text" : "password"} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
            </div>
          </div>

          <Button type="submit" disabled={savingPw}
            className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 px-8">
            {savingPw ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</span> : <><Lock className="w-4 h-4 mr-2" /> Change Password</>}
          </Button>
        </form>
      )}
    </div>
  );
}
