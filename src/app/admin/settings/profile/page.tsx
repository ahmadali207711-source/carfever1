"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Save, ShieldCheck, RefreshCw, UserCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, updateProfile, changePassword, updateEmail } from "@/lib/profile-actions";
import type { ProfileData } from "@/lib/profile-actions";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Change email state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<"profile" | "email" | "password">("profile");

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setName(data.name || "");
      setPhone(data.phone || "");
      setBio(data.bio || "");
      setNewEmail(data.auth_email || data.email || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name,
        email: newEmail.trim() || undefined,
        phone: phone || undefined,
        bio: bio || undefined,
      });
      toast.success("Profile information updated successfully");
      loadProfileData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!emailPassword) {
      toast.error("Password is required to confirm email change");
      return;
    }
    setSavingEmail(true);
    try {
      await updateEmail(newEmail, emailPassword);
      toast.success("Email update requested! Please check your inbox for confirmation.");
      setEmailPassword("");
      loadProfileData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Security password updated successfully");
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
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#0055FE] animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Account Settings…</p>
      </div>
    );
  }

  const tabs = [
    { id: "profile" as const, label: "Personal Profile", icon: User },
    { id: "email" as const, label: "Email Address", icon: Mail },
    { id: "password" as const, label: "Security & Password", icon: Lock },
  ];

  const inputClass = "w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold text-xs";
  const labelClass = "block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Profile Summary Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0055FE] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
            {profile?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {profile?.name || "Account Profile"}
              </h1>
              {profile?.role && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0055FE] text-[10px] font-extrabold border border-blue-100 uppercase tracking-wider">
                  {profile.role.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{profile?.email || profile?.auth_email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadProfileData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Profile
          </button>
        </div>
      </div>

      {/* Modern High-Contrast Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-[#0055FE] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#0055FE]" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === "profile" && (
        <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#0055FE]" /> Personal Details
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Update your display name, contact phone number, and account biography.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Full Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ahmad Ali"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Primary Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className={inputClass}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1.5">
              Enter your preferred primary email address for notifications and account updates.
            </p>
          </div>

          <div>
            <label className={labelClass}>Account Bio / Notes</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              placeholder="Write a brief overview of your seller account or preferences..."
              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs resize-y"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-md shadow-blue-500/20 cursor-pointer text-xs"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Updates…
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Profile Details
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Email Address Update */}
      {activeTab === "email" && (
        <form onSubmit={handleUpdateEmail} className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#0055FE]" /> Update Account Email
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Change the email address used for login and notifications.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold text-amber-800">
              <strong>Security Note:</strong> Updating your email address requires password confirmation. A verification link will be dispatched to your new email.
            </div>
          </div>

          <div>
            <label className={labelClass}>Current Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={profile?.auth_email || profile?.email || ""}
                disabled
                className="w-full pl-11 pr-4 py-3 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-500 text-xs font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>New Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                placeholder="Enter current password to authorize"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              disabled={savingEmail}
              className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-md shadow-blue-500/20 cursor-pointer text-xs"
            >
              {savingEmail ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Updating Email…
                </span>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" /> Update Email Address
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#0055FE]" /> Account Password & Security
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ensure your account is using a strong password for maximum protection.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0055FE] shrink-0 mt-0.5" />
            <div className="text-xs font-semibold text-blue-800">
              Passwords must be at least 6 characters long. Make sure to choose a unique password that you do not use on other platforms.
            </div>
          </div>

          <div>
            <label className={labelClass}>Current Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your existing password"
                required
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              disabled={savingPw}
              className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-md shadow-blue-500/20 cursor-pointer text-xs"
            >
              {savingPw ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Changing Password…
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" /> Save New Password
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
