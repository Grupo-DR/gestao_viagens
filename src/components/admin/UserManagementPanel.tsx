import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Users, Pencil, Check, X, Loader2,
  ChevronDown, AlertTriangle, Clock, UserPlus, Unlock, KeyRound, Copy
} from 'lucide-react';
import { UserRole } from '../../domain/enums';
import {
  listAllUsers,
  updateUserAccess,
  upsertUser,
  ManagedUser,
} from '../../application/services/userManagementService';
import { CostCenterCheckboxList } from './CostCenterCheckboxList';
import { cn } from '../../lib/utils';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

// ──────────────────────────────────────────────
// Config visual por papel
// ──────────────────────────────────────────────

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  [UserRole.MASTER]:         { label: 'Master',         color: 'bg-purple-100 text-purple-700 border-purple-200' },
  [UserRole.ADMINISTRATIVO]: { label: 'Administrativo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  [UserRole.CAPITAL_HUMANO]: { label: 'Capital Humano', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  [UserRole.COMPRADOR]:      { label: 'Comprador',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
  [UserRole.GESTOR]:         { label: 'Gestor',         color: 'bg-slate-100 text-slate-700 border-slate-200' },
  [UserRole.PENDENTE]:       { label: 'Pendente',       color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

const ASSIGNABLE_ROLES = Object.values(UserRole).filter(r => r !== UserRole.PENDENTE);
const UNRESTRICTED_ROLES = new Set<UserRole>([UserRole.MASTER, UserRole.CAPITAL_HUMANO]);

// ──────────────────────────────────────────────
// Sub-componente: Linha de usuário ativo
// ──────────────────────────────────────────────

interface EditState {
  uid: string;
  role: UserRole;
  selectedCCs: string[];
}

interface ActiveUserRowProps {
  key?: React.Key;
  user: ManagedUser;
  onSave: (uid: string, role: UserRole, ccs: string[]) => Promise<void>;
  saving: string | null;
  onGenerateLink: (uid: string, email: string, name: string) => void;
  isGeneratingLink: boolean;
}

function ActiveUserRow({ user, onSave, saving, onGenerateLink, isGeneratingLink }: ActiveUserRowProps) {
  const [editState, setEditState] = useState<EditState | null>(null);
  const isEditing = editState !== null;
  const isSaving = saving === user.uid;
  const roleCfg = ROLE_CONFIG[user.role];

  const startEdit = () => setEditState({
    uid: user.uid,
    role: user.role,
    selectedCCs: [...user.allowedCostCenters],
  });

  const save = async () => {
    if (!editState) return;
    await onSave(user.uid, editState.role, editState.selectedCCs);
    setEditState(null);
  };

  const isUnrestricted = !isEditing
    ? UNRESTRICTED_ROLES.has(user.role)
    : editState ? UNRESTRICTED_ROLES.has(editState.role) : false;

  return (
    <div className={cn('px-8 py-6 transition-colors', isEditing ? 'bg-slate-50/80' : 'hover:bg-slate-50/50')}>
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 font-black text-slate-600 text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-black text-slate-900 text-sm">{user.name}</p>
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wide', roleCfg.color)}>
              {roleCfg.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{user.email}</p>

          {!isEditing && (
            <div className="mt-2">
              {UNRESTRICTED_ROLES.has(user.role) ? (
                <span className="text-[10px] text-emerald-600 font-bold">✓ Acesso irrestrito a todos os centros de custo</span>
              ) : user.allowedCostCenters.length === 0 ? (
                <span className="text-[10px] text-amber-600 font-bold">⚠ Nenhum centro de custo liberado</span>
              ) : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.allowedCostCenters.slice(0, 3).map(cc => (
                    <span key={cc} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 truncate max-w-[200px]">{cc}</span>
                  ))}
                  {user.allowedCostCenters.length > 3 && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full border border-purple-100">
                      +{user.allowedCostCenters.length - 3} mais
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {isEditing && editState && (
            <div className="mt-5 space-y-5">
              {/* Seletor de papel */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Papel do Usuário</label>
                <div className="relative inline-block">
                  <select
                    value={editState.role}
                    onChange={e => setEditState(prev => prev ? { ...prev, role: e.target.value as UserRole } : prev)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {ASSIGNABLE_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Lista de Checkboxes de CCs */}
              <div className="space-y-1.5 max-w-lg">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Centros de Custo Permitidos
                </label>
                <CostCenterCheckboxList
                  selected={editState.selectedCCs}
                  onChange={ccs => setEditState(prev => prev ? { ...prev, selectedCCs: ccs } : prev)}
                  disabled={isUnrestricted}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <button onClick={save} disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-all disabled:opacity-50">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Salvar
              </button>
              <button onClick={() => setEditState(null)} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onGenerateLink(user.uid, user.email, user.name)} disabled={isGeneratingLink}
                className="flex items-center justify-center p-2 border border-slate-200 text-slate-400 rounded-xl hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all disabled:opacity-50"
                title="Gerar link de redefinição de senha">
                {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              </button>
              <button onClick={startEdit}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
                <Pencil className="w-3 h-3" /> Editar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Sub-componente: Card de usuário pendente
// ──────────────────────────────────────────────

interface PendingUserCardProps {
  key?: React.Key;
  user: ManagedUser;
  onApprove: (uid: string, role: UserRole, ccs: string[]) => Promise<void>;
  saving: string | null;
}

function PendingUserCard({ user, onApprove, saving }: PendingUserCardProps) {
  const [role, setRole] = useState<UserRole>(UserRole.GESTOR);
  const [selectedCCs, setSelectedCCs] = useState<string[]>([]);
  const isSaving = saving === user.uid;
  const isUnrestricted = UNRESTRICTED_ROLES.has(role);

  const approve = async () => {
    await onApprove(user.uid, role, selectedCCs);
  };

  return (
    <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl space-y-5">
      {/* Info do usuário */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center font-black text-amber-700 text-sm shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm">{user.name}</p>
          <p className="text-xs text-slate-500 font-medium">{user.email}</p>
          {user.createdAt && (
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">
              Solicitado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black border uppercase bg-orange-100 text-orange-700 border-orange-200 shrink-0">
          Pendente
        </span>
      </div>

      {/* Papel */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Papel a Atribuir</label>
        <div className="relative inline-block">
          <select value={role} onChange={e => setRole(e.target.value as UserRole)}
            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer">
            {ASSIGNABLE_ROLES.map(r => (
              <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* CCs com Checkboxes */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Centros de Custo Permitidos
        </label>
        <CostCenterCheckboxList
          selected={selectedCCs}
          onChange={setSelectedCCs}
          disabled={isUnrestricted}
        />
      </div>

      <button onClick={approve} disabled={isSaving}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all disabled:opacity-50">
        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
        Aprovar e Liberar Acesso
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Painel principal
// ──────────────────────────────────────────────

export function UserManagementPanel() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal de Link de Redefinição
  const [linkModal, setLinkModal] = useState<{isOpen: boolean; link: string; targetName: string}>({
      isOpen: false, link: '', targetName: ''
  });
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  // Pré-cadastro
  const [showPreRegister, setShowPreRegister] = useState(false);
  const [preEmail, setPreEmail] = useState('');
  const [preName, setPreName] = useState('');
  const [preRole, setPreRole] = useState<UserRole>(UserRole.GESTOR);
  const [preSelectedCCs, setPreSelectedCCs] = useState<string[]>([]);
  const [savingPre, setSavingPre] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await listAllUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const pendingUsers = users.filter(u => u.role === UserRole.PENDENTE);
  const activeUsers = users.filter(u => u.role !== UserRole.PENDENTE);

  const handleSave = async (uid: string, role: UserRole, ccs: string[]) => {
    setSaving(uid);
    setError(null);
    try {
      await updateUserAccess(uid, role, ccs);
      await loadUsers();
    } catch {
      setError('Falha ao salvar. Verifique as permissões do Firestore.');
    } finally {
      setSaving(null);
    }
  };

  const handleGeneratePasswordResetLink = async (uid: string, email: string, name: string) => {
    if (!window.confirm(`Gerar link de redefinição de senha para ${name}?`)) return;
    setGeneratingLink(uid);
    try {
        const resetPassword = httpsCallable(functions, 'adminGeneratePasswordResetLink');
        const result = await resetPassword({ email });
        const link = (result.data as any).link;
        setLinkModal({ isOpen: true, link, targetName: name });
    } catch (err: any) {
        setError(err.message || 'Erro ao gerar link de redefinição');
    } finally {
        setGeneratingLink(null);
    }
  };

  const handlePreRegister = async () => {
    if (!preEmail.trim()) return;
    setSavingPre(true);
    setError(null);
    try {
      const tempUid = `pre_${Date.now()}_${preEmail.replace(/[^a-z0-9]/gi, '_')}`;
      await upsertUser({
        uid: tempUid,
        name: preName || preEmail.split('@')[0],
        email: preEmail.trim(),
        role: preRole,
        allowedCostCenters: preSelectedCCs,
      });
      setPreEmail('');
      setPreName('');
      setPreSelectedCCs([]);
      setPreRole(UserRole.GESTOR);
      setShowPreRegister(false);
      await loadUsers();
    } catch {
      setError('Falha ao pré-cadastrar usuário.');
    } finally {
      setSavingPre(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 font-medium text-sm">Configure papéis e centros de custo permitidos.</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 text-[10px] font-black uppercase tracking-widest">MASTER ONLY</span>
          <button onClick={() => setShowPreRegister(!showPreRegister)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-all">
            <UserPlus className="w-4 h-4" /> Pré-cadastrar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-6 py-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-black">{error}</span>
        </div>
      )}

      {/* ── FORMULÁRIO DE PRÉ-CADASTRO ── */}
      {showPreRegister && (
        <div className="bg-purple-50 rounded-[32px] border border-purple-100 p-8 space-y-6 animate-in slide-in-from-top-4">
          <div>
            <h2 className="font-black text-purple-900 text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Pré-cadastrar Novo Usuário
            </h2>
            <p className="text-xs text-purple-700 mt-1">
              Configure o acesso aqui. Na primeira vez que o usuário logar, terá acesso imediato.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Nome</label>
              <input value={preName} onChange={e => setPreName(e.target.value)}
                placeholder="Nome completo"
                className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">E-mail *</label>
              <input value={preEmail} onChange={e => setPreEmail(e.target.value)}
                placeholder="email@grupodr.com.br" type="email"
                className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Papel</label>
            <div className="relative inline-block">
              <select value={preRole} onChange={e => setPreRole(e.target.value as UserRole)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-purple-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
              Centros de Custo Permitidos
            </label>
            <CostCenterCheckboxList
              selected={preSelectedCCs}
              onChange={setPreSelectedCCs}
              disabled={UNRESTRICTED_ROLES.has(preRole)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handlePreRegister} disabled={savingPre || !preEmail.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-all disabled:opacity-50">
              {savingPre ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Salvar Pré-cadastro
            </button>
            <button onClick={() => setShowPreRegister(false)}
              className="px-5 py-2.5 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-100 transition-all">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── SEÇÃO 1: Pendentes de aprovação ── */}
      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-[32px] border-2 border-amber-200 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-amber-50 flex items-center gap-3 bg-amber-50">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
              {pendingUsers.length} aguardando aprovação
            </span>
          </div>
          <div className="p-6 grid gap-4">
            {pendingUsers.map(user => (
              <PendingUserCard key={user.uid} user={user} onApprove={handleSave} saving={saving} />
            ))}
          </div>
        </div>
      )}

      {/* ── SEÇÃO 2: Usuários Ativos ── */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {activeUsers.length} usuário{activeUsers.length !== 1 ? 's' : ''} ativo{activeUsers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="text-sm font-bold text-slate-400">Carregando...</span>
          </div>
        ) : activeUsers.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-slate-400">Nenhum usuário ativo ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {activeUsers.map(user => (
              <ActiveUserRow 
                key={user.uid} 
                user={user} 
                onSave={handleSave} 
                saving={saving}
                onGenerateLink={handleGeneratePasswordResetLink}
                isGeneratingLink={generatingLink === user.uid}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal do Link de Redefinição */}
      {linkModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900">Link Gerado</h3>
                            <p className="text-xs font-medium text-slate-500">Para {linkModal.targetName}</p>
                        </div>
                    </div>
                    <button onClick={() => setLinkModal({ isOpen: false, link: '', targetName: '' })} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4 bg-slate-50/50">
                    <p className="text-sm text-slate-600 font-medium">
                        Copie o link abaixo e envie para o usuário. Ele poderá escolher uma nova senha de forma segura.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={linkModal.link}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none truncate"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(linkModal.link);
                                alert('Link copiado para a área de transferência!');
                            }}
                            className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all shrink-0"
                        >
                            <Copy className="w-4 h-4" /> Copiar
                        </button>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100">
                    <button
                        onClick={() => setLinkModal({ isOpen: false, link: '', targetName: '' })}
                        className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-black hover:bg-slate-200 transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
