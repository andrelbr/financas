import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar, Users, Filter, SearchX } from 'lucide-react';
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
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter State
  const [filters, setFilters] = useState({
    payer: '',
    category_id: '',
    account_id: '',
    payment_method_id: ''
  });

  const avatars = {
    "Casal": "https://i.ibb.co/p6Zz9shM/Whats-App-Image-2026-04-10-at-17-14-44.jpg",
    "Sofia": "https://i.ibb.co/vvJ3s1kT/Whats-App-Image-2026-04-10-at-17-14-43.jpg",
    "André": "https://i.ibb.co/zTGFLMQN/1749123367453.jpg"
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const params = new URLSearchParams({ month, year });
      if (filters.payer) params.append('payer', filters.payer);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.account_id) params.append('account_id', filters.account_id);
      if (filters.payment_method_id) params.append('payment_method_id', filters.payment_method_id);

      const [statsRes, catRes, accRes, payRes] = await Promise.all([
        axios.get(`/api/dashboard?${params.toString()}`),
        axios.get('/api/categories'),
        axios.get('/api/accounts'),
        axios.get('/api/payment-methods')
      ]);

      setStats(statsRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
      setPaymentMethods(payRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentDate, filters]);

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

      {/* Barra de Filtros Dashboard */}
      <div className="glass-card mb-6 p-4">
        <div className="flex items-center space-x-2 mb-4 text-gray-700">
           <Filter className="w-4 h-4" />
           <span className="text-xs font-bold uppercase tracking-wider">Filtros Avançados</span>
           { (filters.payer || filters.category_id || filters.account_id || filters.payment_method_id) && (
             <button onClick={() => setFilters({payer: '', category_id: '', account_id: '', payment_method_id: ''})} className="ml-auto text-[10px] bg-gray-100 px-2 py-1 rounded-lg hover:bg-gray-200 text-gray-600">Limpar Tudo</button>
           )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select className="input-field py-1.5 text-xs" value={filters.payer} onChange={e => setFilters({...filters, payer: e.target.value})}>
            <option value="">Todos Pagadores</option>
            <option value="André">André</option>
            <option value="Sofia">Sofia</option>
            <option value="Casal">Casal</option>
          </select>
          <select className="input-field py-1.5 text-xs" value={filters.category_id} onChange={e => setFilters({...filters, category_id: e.target.value})}>
            <option value="">Todas Categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input-field py-1.5 text-xs" value={filters.account_id} onChange={e => setFilters({...filters, account_id: e.target.value})}>
            <option value="">Todas Contas</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
          <select className="input-field py-1.5 text-xs" value={filters.payment_method_id} onChange={e => setFilters({...filters, payment_method_id: e.target.value})}>
            <option value="">Todas Formas Pagto</option>
            {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Cards Financeiros Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Saldo no Filtro</h3>
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
            <h3 className="text-gray-500 font-medium text-sm">Receitas Selecionadas</h3>
            <div className="p-2 rounded-full bg-success/20 text-success">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 relative z-10">{formatCurrency(stats.income)}</p>
        </div>

        <div className="glass-card flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-danger/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-gray-500 font-medium text-sm">Despesas Selecionadas</h3>
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
           <h3 className="text-lg font-bold text-gray-900">Resumo por Membro</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {['André', 'Sofia', 'Casal'].map(name => {
            const data = stats.payer_data.find(p => p.name === name) || { value: 0, income: 0, expense: 0, balance: 0 };
            return (
              <div key={name} className="flex flex-col p-4 bg-white/40 rounded-2xl border border-white/60 shadow-sm group hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <div className="relative">
                    <img 
                      src={avatars[name]} 
                      alt={name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${name}&background=random`; }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
                      {Math.round((data.expense / (stats.expense || 1)) * 100)}%
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{name}</p>
                    <p className="text-sm font-bold text-gray-900">Fluxo Individual</p>
                  </div>
                </div>
                
                <div className="space-y-2 border-t border-gray-100/50 pt-3 mt-auto">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center">
                      <ArrowUpCircle className="w-3 h-3 text-success mr-1" /> Receita
                    </span>
                    <span className="font-bold text-success">{formatCurrency(data.income)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center">
                      <ArrowDownCircle className="w-3 h-3 text-danger mr-1" /> Despesa
                    </span>
                    <span className="font-bold text-danger">{formatCurrency(data.expense)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2 mt-1">
                    <span className="text-gray-600 font-medium">Saldo</span>
                    <span className={`font-bold ${data.balance >= 0 ? 'text-primary' : 'text-danger'}`}>
                      {formatCurrency(data.balance)}
                    </span>
                  </div>
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
            {stats.category_data.length > 0 ? (
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
                      label={({ name, value, percent }) => 
                        `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={true}
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
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sem dados para este filtro</div>
            )}
          </div>
        </div>

        {/* Gráfico de Distribuição por Pagador */}
        <div className="glass-card min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Distribuição de Pagamentos</h3>
          <div className="h-[300px] w-full">
             {stats.payer_data.length > 0 ? (
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
             ) : (
                <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sem dados para este filtro</div>
             )}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="glass-card p-0 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Transações no Filtro</h3>
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
                    Nenhuma transação encontrada para este filtro.
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
