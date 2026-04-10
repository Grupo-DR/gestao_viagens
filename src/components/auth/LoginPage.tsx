import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { firebaseIdentityProvider } from '../../application/identity/firebaseIdentityProvider';
import { cn } from '../../lib/utils';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await firebaseIdentityProvider.login(email, password);
    } catch (err: any) {
      console.error('[Login] Erro:', err);
      if (err.code === 'auth/user-not-found') {
        setError('E-mail não cadastrado no sistema.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Formato de e-mail inválido.');
      } else {
        setError('Falha na autenticação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-900">
      {/* Wallpaper Background with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-110"
        style={{ backgroundImage: 'url("/wallpaper.jpg")' }}
      />
      <div className="absolute inset-0 z-1 bg-gradient-to-br from-slate-900/40 via-transparent to-slate-900/40 backdrop-blur-[2px]" />

      <div className="w-full max-w-[360px] relative z-10 animate-in fade-in zoom-in duration-1000">
        <div className="bg-white/[0.01] backdrop-blur-xl rounded-[40px] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.4)] p-8 space-y-8 overflow-hidden relative group">
          
          {/* Subtle light streak animation */}
          <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-20 group-hover:animate-[shimmer_2s_infinite]" />

          {/* Header */}
          <div className="text-center space-y-4 relative z-10">
            <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-white/10 transform transition-transform group-hover:scale-105">
               <img 
                 src="/logo.png" 
                 alt="Logo" 
                 className="w-14 h-14 object-contain"
                 onError={(e) => {
                   e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png';
                 }}
               />
            </div>
            <div className="space-y-1">
               <h1 className="text-4xl font-black text-white tracking-tighter leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                 DR TravelHub
               </h1>
               <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">
                 Gestão com agilidade e eficiência
               </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-4">
               {/* Email Field */}
               <div className="space-y-2">
                 <label className="px-6 text-[10px] font-black text-white/40 uppercase tracking-widest">E-mail Corporativo</label>
                 <div className="relative group/input">
                    <Mail className={cn(
                      "absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                      loading ? "text-white/20" : "text-white/40 group-focus-within/input:text-blue-400"
                    )} />
                    <input 
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@drconstrutora.com.br"
                      className="w-full pl-14 pr-8 py-5 bg-white/[0.08] border border-white/10 rounded-[28px] text-sm font-bold text-white outline-none focus:border-blue-400/40 focus:ring-8 focus:ring-blue-400/5 transition-all placeholder:text-white/20 disabled:opacity-50"
                    />
                 </div>
               </div>

               {/* Password Field */}
               <div className="space-y-2">
                 <label className="px-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Senha de Acesso</label>
                 <div className="relative group/input">
                    <Lock className={cn(
                      "absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                      loading ? "text-white/20" : "text-white/40 group-focus-within/input:text-blue-400"
                    )} />
                    <input 
                      type="password"
                      required
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-8 py-5 bg-white/[0.08] border border-white/10 rounded-[28px] text-sm font-bold text-white outline-none focus:border-blue-400/40 focus:ring-8 focus:ring-blue-400/5 transition-all placeholder:text-white/20 disabled:opacity-50"
                    />
                 </div>
               </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 px-6 py-4 bg-red-500/20 text-red-300 rounded-[24px] border border-red-500/30 animate-in slide-in-from-top-2 duration-300 backdrop-blur-md">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <span className="text-xs font-black uppercase tracking-tight">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-white text-slate-900 hover:bg-white/90 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-white/5 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group/btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Portal</span>
                  <div className="w-8 h-8 bg-slate-900/10 rounded-full flex items-center justify-center group-hover/btn:bg-slate-900/20 transition-all">
                     <ArrowRight className="w-4 h-4" />
                  </div>
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="text-center relative z-10 pt-4">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse" />
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                  Acesso Restrito
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
