import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    income: 0, 
    expense: 0, 
    balance: 0, 
    transactions: [],
    category_data: [],
    payer_data: []
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const avatars = {
    "Casal": "https://i.ibb.co/p6Zz9shM/Whats-App-Image-2026-04-10-at-17-14-44.jpg",
    "Sofia": "https://i.ibb.co/vvJ3s1kT/Whats-App-Image-2026-04-10-at-17-14-43.jpg",
    "André": "https://i.ibb.co/zTGFLMQN/1749123367453.jpg"
  };

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

      {/* Cards Financeiros Principais */}
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

      {/* Seção Membros da Família */}
      <div className="glass-card p-6 border-white/40">
        <div className="flex items-center mb-6">
           <Users className="w-5 h-5 text-primary mr-2" />
           <h3 className="text-lg font-bold text-gray-900">Gastos por Membro</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {['André', 'Sofia', 'Casal'].map(name => {
            const data = stats.payer_data.find(p => p.name === name) || { value: 0 };
            return (
              <div key={name} className="flex items-center p-4 bg-white/40 rounded-2xl border border-white/60 shadow-sm group hover:bg-white hover:shadow-md transition-all">
                <div className="relative">
                  <img 
                    src={avatars[name]} 
                    alt={name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${name}&background=random`; }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
                    {Math.round((data.value / (stats.expense || 1)) * 100)}%
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{name}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(data.value)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Categoria */}
        <div className="glass-card min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Despesas por Categoria</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.category_data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.category_data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gastos por Pagador (Gráfico) */}
        <div className="glass-card min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Distribuição de Pagamentos</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.payer_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   formatter={(value) => formatCurrency(value)}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                <th className="px-6 py-4 font-medium">Via</th>
                <th className="px-6 py-4 font-medium text-center">Pagador</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs text-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700">{format(parseISO(t.date), 'dd', { locale: ptBR })}</span>
                        <span className="text-[10px] uppercase">{format(parseISO(t.date), 'MMM', { locale: ptBR })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {t.description}
                      {t.is_installment && <span className="ml-2 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase font-bold">Parcelado</span>}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{t.payment_method?.name}</span>
                          <span className="text-xs text-primary font-medium">{t.account?.name}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex justify-center">
                          <img 
                            src={avatars[t.payer]} 
                            alt={t.payer} 
                            className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                            title={t.payer}
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${t.payer}&background=random`; }}
                          />
                       </div>
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
