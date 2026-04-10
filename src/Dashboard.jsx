import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await axios.get(`/api/dashboard?month=${month}&year=${year}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentDate]);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading && !stats.transactions.length) {
    return <div className="flex h-full items-center justify-center pt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-gray-500 text-sm">Acompanhe suas finanças este mês.</p>
        </div>
        <div className="flex items-center space-x-4 bg-white/60 p-2 rounded-xl border border-gray-200">
          <button onClick={() => changeMonth(-1)} className="px-3 md:px-4 py-1.5 hover:bg-white rounded-lg transition-colors text-sm font-medium text-gray-600">
            Anterior
          </button>
          <div className="flex items-center font-medium min-w-[120px] justify-center text-primary capitalize">
            <Calendar className="w-4 h-4 mr-2" />
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <button onClick={() => changeMonth(1)} className="px-3 md:px-4 py-1.5 hover:bg-white rounded-lg transition-colors text-sm font-medium text-gray-600">
            Próximo
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Saldo Total</h3>
            <div className={`p-2 rounded-full ${stats.balance >= 0 ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-gray-900' : 'text-danger'}`}>
            {formatCurrency(stats.balance)}
          </p>
        </div>

        <div className="glass-card flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-gray-500 font-medium text-sm">Receitas</h3>
            <div className="p-2 rounded-full bg-success/20 text-success">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 relative z-10">{formatCurrency(stats.income)}</p>
        </div>

        <div className="glass-card flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-danger/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-gray-500 font-medium text-sm">Despesas</h3>
            <div className="p-2 rounded-full bg-danger/10 text-danger">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 relative z-10">{formatCurrency(stats.expense)}</p>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="glass-card p-0 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Transações Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Descrição</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Pagador</th>
                <th className="px-6 py-4 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Nenhuma transação neste período.
                  </td>
                </tr>
              ) : (
                stats.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {format(parseISO(t.date), 'dd MMM, yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {t.description}
                      {t.is_installment && <span className="ml-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">Parcelado</span>}
                      {t.is_recurring && <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Recorrente</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${t.category.color}20`, color: t.category.color }}
                      >
                        {t.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {t.payer}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-success' : 'text-gray-900'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
