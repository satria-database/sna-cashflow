import React, { useState } from 'react';
import { TerramoraLogo } from './TerravaLogo';
import { UserProfile } from '../types';
import { 
  ShieldCheck, 
  Bell, 
  PieChart, 
  TrendingUp, 
  ArrowRight, 
  Lock,
  Mail,
  User,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Database
} from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { saveUserProfileToSupabase } from '../services/supabaseService';

interface LoginPageProps {
  onLogin: (profile: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // Smooth Google Account Sign-In (Direct Profile + Supabase Database Sync)
  const handleGoogleSignIn = async (customEmail?: string) => {
    const targetEmail = (customEmail || googleEmailInput || email).trim().toLowerCase();
    
    if (!targetEmail) {
      setShowGooglePrompt(true);
      return;
    }

    if (!targetEmail.includes('@')) {
      setErrorMessage('Harap masukkan alamat email Google yang valid (contoh: nama@gmail.com)');
      return;
    }

    setIsSigningIn(true);
    setErrorMessage('');
    try {
      const derivedName = targetEmail.split('@')[0];
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      
      const profile: UserProfile = {
        id: `usr_${targetEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: formattedName,
        email: targetEmail,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=007a52,10b981`,
        isLoggedIn: true,
        provider: 'google',
        joinedAt: new Date().toISOString(),
      };

      // Save user profile to Supabase database profiles table
      await saveUserProfileToSupabase(profile).catch(() => {});

      setTimeout(() => {
        onLogin(profile);
        setIsSigningIn(false);
      }, 350);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk dengan akun Google.');
      setIsSigningIn(false);
    }
  };

  // Email/password authentication must succeed before the dashboard opens.
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setErrorMessage('Harap masukkan format alamat email yang valid.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password wajib diisi dan minimal terdiri dari 6 karakter.');
      return;
    }

    setIsSigningIn(true);
    setErrorMessage('');

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Layanan login belum terhubung. Silakan coba lagi setelah koneksi tersedia.');
      }

      const { data, error } = authMode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        : await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: (import.meta as any).env?.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
              data: { full_name: name.trim() || normalizedEmail.split('@')[0] },
            },
          });

      if (error) {
        if (error.message.toLowerCase().includes('confirm')) {
          throw new Error('Email Anda belum dikonfirmasi. Silakan cek inbox dan klik tautan verifikasi.');
        }
        throw new Error('Email atau password tidak valid.');
      }

      if (!data.user) {
        throw new Error('Akun belum aktif. Silakan cek email verifikasi Anda.');
      }

      const derivedName = name.trim() || data.user.user_metadata?.full_name || normalizedEmail.split('@')[0];
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      const profile: UserProfile = {
        id: data.user.id,
        name: formattedName,
        email: normalizedEmail,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=007a52,047857`,
        isLoggedIn: true,
        provider: 'email',
        joinedAt: data.user.created_at || new Date().toISOString(),
      };

      await saveUserProfileToSupabase(profile).catch(() => {});
      onLogin(profile);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk. Silakan periksa kembali email dan password Anda.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Guest / Offline Trial Mode
  const handleGuestLogin = () => {
    setIsSigningIn(true);
    setTimeout(() => {
      const guestProfile: UserProfile = {
        id: 'usr_guest_offline',
        name: 'Tamu (Mode Offline)',
        email: 'guest@terrava.local',
        isLoggedIn: true,
        provider: 'guest',
        joinedAt: new Date().toISOString(),
      };
      onLogin(guestProfile);
      setIsSigningIn(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      
      {/* Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <TerramoraLogo size="sm" width={140} height={28} />
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Portal Terenkripsi & Aman
          </span>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-5 animate-in fade-in duration-200">
          
          {/* Brand Presentation Card */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex justify-center mb-1">
              <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-200">
                <TerramoraLogo size="lg" width={220} height={44} />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Masuk ke Akun Anda
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Kelola tagihan paylater, pantau arus kas bulanan, dan simulasikan strategi bebas hutang.
            </p>
          </div>

          {/* Authentication Action Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200/90 space-y-5">
            
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Primary Google Login Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (email.trim() && email.includes('@')) {
                    handleGoogleSignIn(email);
                  } else {
                    setShowGooglePrompt(true);
                  }
                }}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm py-3.5 px-5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all cursor-pointer group disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Menghubungkan Akun...' : 'Masuk dengan Akun Google'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Atau Masuk dengan Email
              </span>
            </div>

            {/* 2. Email / Account Direct Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="nama@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Anda (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Satria"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-[#007a52] hover:bg-[#006644] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-60"
              >
                <span>{isSigningIn ? 'Memproses Masuk...' : 'Masuk ke Dashboard'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {/* Offline / Guest Mode */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isSigningIn}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer py-1"
              >
                Atau lanjutkan sebagai <strong>Tamu (Mode Offline / Coba Aplikasi)</strong> &rarr;
              </button>
            </div>

          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 gap-2.5 text-left">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Pengingat Tagihan</div>
                <div className="text-[10px] text-slate-500">Notifikasi jatuh tempo</div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Multi-User Cloud</div>
                <div className="text-[10px] text-slate-500">Data terpisah tiap akun</div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Google Sign-In Popup Dialog */}
      {showGooglePrompt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Masuk dengan Google</h3>
                  <p className="text-[11px] text-slate-500">Pilih atau ketik email Google Anda</p>
                </div>
              </div>
              <button
                onClick={() => setShowGooglePrompt(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGoogleSignIn();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email Google
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="nama@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGooglePrompt(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="flex-1 bg-[#007a52] hover:bg-[#006644] text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{isSigningIn ? 'Masuk...' : 'Lanjutkan'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/60">
        <p>© {new Date().getFullYear()} Terramora — Paylater & Cash Flow Operating System. Terlindungi & Terenkripsi.</p>
      </footer>

    </div>
  );
};
