import React, { useState } from 'react';
import { UserProfile } from '../types';
import { LogIn, LogOut, CheckCircle2, User, Mail, Shield, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { saveUserProfileToSupabase } from '../services/supabaseService';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogin: (profile: UserProfile) => void;
  onLogout: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleDirect = async () => {
    setIsSigningIn(true);
    setErrorMsg('');
    try {
      const defaultEmail = email.trim() || (user?.email && !user.email.includes('guest') ? user.email : 'satria62317@gmail.com');
      const derivedName = name.trim() || (defaultEmail.includes('@') ? defaultEmail.split('@')[0] : 'Pengguna Google');
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

      const profile: UserProfile = {
        id: `usr_${defaultEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: formattedName,
        email: defaultEmail.toLowerCase(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=007a52,10b981`,
        isLoggedIn: true,
        provider: 'google',
        joinedAt: new Date().toISOString(),
      };

      await saveUserProfileToSupabase(profile).catch(() => {});

      setTimeout(() => {
        onLogin(profile);
        setIsSigningIn(false);
        onClose();
      }, 350);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login Google.');
      setIsSigningIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }

    const derivedName = name.trim() || email.split('@')[0];
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

    const profile: UserProfile = {
      id: `usr_${email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: formattedName,
      email: email.trim().toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=007a52,047857`,
      isLoggedIn: true,
      provider: 'google',
      joinedAt: new Date().toISOString(),
    };

    setIsSigningIn(true);
    await saveUserProfileToSupabase(profile).catch(() => {});

    setTimeout(() => {
      onLogin(profile);
      setIsSigningIn(false);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {user?.isLoggedIn ? 'Akun Anda' : 'Login / Ganti Akun'}
              </h3>
              <p className="text-xs text-slate-500">
                {user?.isLoggedIn ? 'Data tersinkron terpisah per akun' : 'Masuk untuk sinkronisasi data akun'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* State: Logged In */}
        {user?.isLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3.5">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border border-emerald-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold text-base flex items-center justify-center border border-emerald-800">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{user.name}</h4>
                  <span className="bg-emerald-200/80 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Terhubung
                  </span>
                </div>
                <p className="text-xs text-slate-600 truncate mt-0.5">{user.email}</p>
                <p className="text-[10px] text-slate-400 mt-1">Data Anda tersimpan khusus untuk akun ini</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun Ini</span>
              </button>
            </div>
          </div>
        ) : (
          /* State: Not Logged In */
          <div className="space-y-4">
            
            <button
              onClick={handleGoogleDirect}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm py-3 px-4 rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
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
              <span>{isSigningIn ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">
                Atau Masukkan Email
              </span>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Panggilan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Satria"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-[#007a52] hover:bg-[#006644] text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Masuk ke Akun Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
};
