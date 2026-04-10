import React from 'react';
import { Clock, LogOut, ShieldAlert } from 'lucide-react';
import { useIdentity } from '../../application/identity/IdentityContext';

export function PendingAccessScreen() {
  const { currentUser, logout } = useIdentity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-6">
      {/* Fundo animado sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Card principal */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[40px] border border-slate-200/60 shadow-2xl shadow-slate-900/10 overflow-hidden">
          
          {/* Header âmbar */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-10 flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-[28px] flex items-center justify-center border-2 border-white/30 shadow-xl">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Acesso Pendente
              </h1>
              <p className="text-amber-100 font-medium text-sm mt-1">
                Aguardando aprovação do Administrador
              </p>
            </div>
          </div>

          {/* Corpo */}
          <div className="p-10 space-y-8">
            {/* Info do usuário */}
            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-black text-slate-600 text-lg shrink-0">
                {(currentUser?.name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-sm truncate">{currentUser?.name ?? 'Usuário'}</p>
                <p className="text-xs text-slate-500 font-medium truncate">{currentUser?.email}</p>
              </div>
            </div>

            {/* Mensagem explicativa */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-slate-900 text-sm">Conta em análise</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Seu cadastro foi registrado com sucesso. O administrador do sistema 
                    precisa definir seu nível de acesso antes que você possa utilizar o portal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-slate-900 text-sm">O que acontece agora?</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    O administrador foi notificado. Assim que seu acesso for ativado, 
                    você poderá entrar normalmente com as mesmas credenciais.
                  </p>
                </div>
              </div>
            </div>

            {/* Indicador de status */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                Aguardando liberação de acesso
              </span>
            </div>

            {/* Botão Sair */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sair e usar outra conta
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[10px] text-slate-400 font-medium mt-6">
          TravelHub · DR Construtora · Acesso controlado por RBAC
        </p>
      </div>
    </div>
  );
}
