import { useState, useCallback, useEffect, useMemo } from 'react';
import { differenceInDays, isBefore, startOfToday, format } from 'date-fns';
import { rmSqlClient } from '../../infrastructure/api/rmSqlClient.ts';
import { API_CONFIG } from '../../infrastructure/api/config.ts';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../dtos/ExternalEmployeeDTO.ts';

export interface EmployeeRayXData {
  chapa: string;
  name: string;
  role: string;
  costCenter: string;
  lastTimeOff?: string;
  vacationDeadline?: string;
  programmedStart?: string;
  programmedEnd?: string;
  programmedDays?: number;
  vacationBalance: number;
  predictedTimeOff?: string;
  timeOffRule?: string;
  category: 'VENCIDA' | 'NAO_RECOMENDAVEL' | 'ALTA' | 'MEDIA' | 'IDEAL' | 'REGULAR';
}

const CATEGORY_WEIGHTS = {
  VENCIDA: 1,
  NAO_RECOMENDAVEL: 2,
  ALTA: 3,
  MEDIA: 4,
  IDEAL: 5,
  REGULAR: 6
};

export function useEmployeeRayX() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EmployeeRayXData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  // Estados de Filtro
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCC, setSelectedCC] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedName, setSelectedName] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vacationsRaw, timeOffsRaw] = await Promise.all([
        rmSqlClient.executeSentence<ExternalVacationDTO>(API_CONFIG.SENTENCES.FERIAS),
        rmSqlClient.executeSentence<ExternalTimeOffDTO>(API_CONFIG.SENTENCES.FOLGA)
      ]);

      const today = startOfToday();

      // 1. Deduplicação de Vacations (Manter apenas o Ativo ou o com maior criticidade se duplicado)
      const vacationMap = new Map<string, ExternalVacationDTO>();
      vacationsRaw.forEach(v => {
         const existing = vacationMap.get(v.CHAPA);
         if (!existing || (v.CODSITUACAO === 'A' && existing.CODSITUACAO !== 'A')) {
            vacationMap.set(v.CHAPA, v);
         }
      });

      // 2. Mapeamento e Cruzamento
      const merged: EmployeeRayXData[] = Array.from(vacationMap.values()).map(v => {
        const t = timeOffsRaw.find(to => to.CHAPA === v.CHAPA);
        const predicted = t?.DATA_PREVISTA ? new Date(t.DATA_PREVISTA) : null;
        
        let category: EmployeeRayXData['category'] = 'REGULAR';
        if (predicted) {
          const days = differenceInDays(predicted, today);
          if (isBefore(predicted, today)) category = 'VENCIDA';
          else if (days < 30) category = 'NAO_RECOMENDAVEL';
          else if (days >= 30 && days < 45) category = 'ALTA';
          else if (days >= 45 && days < 60) category = 'MEDIA';
          else if (days >= 60 && days <= 90) category = 'IDEAL';
        }

        return {
          chapa: v.CHAPA,
          name: v.NOME.trim(),
          role: v.FUNCAO.trim(),
          costCenter: (v.DESCRICAO || '').trim(),
          vacationDeadline: v.PRAZO || v.LIMITE,
          vacationBalance: v.SALDO,
          programmedStart: v.PROGR_INICIO,
          programmedEnd: v.PROGR_FIM,
          programmedDays: v.PROGR_DIAS,
          lastTimeOff: t?.ULTIMA_FOLGA || undefined,
          predictedTimeOff: t?.DATA_PREVISTA || undefined,
          timeOffRule: t?.DESCRICAO || undefined,
          category
        };
      });

      setData(merged);
      setLastUpdate(format(new Date(), 'HH:mm'));
    } catch (err: any) {
      console.error('[Raio-X] Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados do RM TOTVS.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtro e Ordenação
  const filteredData = useMemo(() => {
    let result = data.filter(item => {
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesCC = !selectedCC || item.costCenter === selectedCC;
      const matchesRole = !selectedRole || item.role === selectedRole;
      const matchesName = !selectedName || item.name === selectedName;

      return matchesCategory && matchesCC && matchesRole && matchesName;
    });

    // Ordenação: Categoria (Peso) -> Data Prevista (ASC)
    result.sort((a, b) => {
      const weightA = CATEGORY_WEIGHTS[a.category];
      const weightB = CATEGORY_WEIGHTS[b.category];
      
      if (weightA !== weightB) return weightA - weightB;

      const timeA = a.predictedTimeOff ? new Date(a.predictedTimeOff).getTime() : Infinity;
      const timeB = b.predictedTimeOff ? new Date(b.predictedTimeOff).getTime() : Infinity;
      return timeA - timeB;
    });

    return result;
  }, [data, selectedCategory, selectedCC, selectedRole, selectedName]);

  // Contadores Precisos (Seguem os filtros de CC, Função e Nome)
  const counts = useMemo(() => {
    const pool = data.filter(item => {
      const matchesCC = !selectedCC || item.costCenter === selectedCC;
      const matchesRole = !selectedRole || item.role === selectedRole;
      const matchesName = !selectedName || item.name === selectedName;
      return matchesCC && matchesRole && matchesName;
    });

    return {
      VENCIDA: pool.filter(d => d.category === 'VENCIDA').length,
      NAO_RECOMENDAVEL: pool.filter(d => d.category === 'NAO_RECOMENDAVEL').length,
      ALTA: pool.filter(d => d.category === 'ALTA').length,
      MEDIA: pool.filter(d => d.category === 'MEDIA').length,
      IDEAL: pool.filter(d => d.category === 'IDEAL').length,
    };
  }, [data, selectedCC, selectedRole, selectedName]);

  // Listas Dinâmicas (Cascata)
  const costCenters = useMemo(() => 
    Array.from(new Set(data.map(d => d.costCenter))).sort()
  , [data]);

  const roles = useMemo(() => {
    const pool = selectedCC ? data.filter(d => d.costCenter === selectedCC) : data;
    return Array.from(new Set(pool.map(d => d.role))).sort();
  }, [data, selectedCC]);

  const names = useMemo(() => {
    const pool = data.filter(d => 
      (!selectedCC || d.costCenter === selectedCC) && 
      (!selectedRole || d.role === selectedRole)
    );
    return Array.from(new Set(pool.map(d => d.name))).sort();
  }, [data, selectedCC, selectedRole]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedCC('');
    setSelectedRole('');
    setSelectedName('');
  };

  return {
    loading,
    error,
    lastUpdate,
    data: filteredData,
    counts,
    selectedCategory,
    setSelectedCategory,
    selectedCC,
    setSelectedCC: (cc: string) => { setSelectedCC(cc); setSelectedRole(''); setSelectedName(''); },
    selectedRole,
    setSelectedRole: (role: string) => { setSelectedRole(role); setSelectedName(''); },
    selectedName,
    setSelectedName,
    costCenters,
    roles,
    names,
    clearFilters,
    refresh: fetchData
  };
}
