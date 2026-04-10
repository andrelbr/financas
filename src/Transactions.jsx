import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    payer: 'Casal',
    category_id: '',
    is_installment: false,
    total_installments: 2,
    is_recurring: false,
    recurring_months: 12
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const [transRes, catRes] = await Promise.all([
        axios.get(`/api/transactions?month=${month}&year=${year}`),
        axios.get('/api/categories')
      ]);
      setTransactions(transRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: catRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id)
      };
      await axios.post('/api/transactions', payload);
      setIsModalOpen(false);
      setFormData({
        ...formData,
        description: '',
        amount: '',
        is_installment: false,
        is_recurring: false
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar transação');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-500 text-sm">Gerencie suas receitas e despesas detalhadas.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center shadow-lg">
          <Plus className="w-5 h-5 mr-1" />
          Nova Transação
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/50">
          <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-gray-200">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="px-3 py-1 hover:bg-gray-50 rounded-lg text-sm text-gray-600">Anterior</button>
            <span className="font-medium min-w-[120px] text-center capitalize text-primary">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="px-3 py-1 hover:bg-gray-50 rounded-lg text-sm text-gray-600">Próximo</button>
          </div>
        </div>
        
        {loading ? (
           <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Descrição</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium">Pagador</th>
                  <th className="px-6 py-4 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Nenhuma transação neste mês.</td></tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {format(parseISO(t.date), 'dd MMM, yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center">
                          {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4 text-success mr-2" /> : <ArrowDownCircle className="w-4 h-4 text-danger mr-2" />}
                          {t.description}
                        </div>
                        {t.is_installment && <span className="ml-6 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">Parcela {t.installment_number}/{t.total_installments}</span>}
                        {t.is_recurring && <span className="ml-6 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full mt-1 inline-block">Recorrente mensal</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${t.category?.color}20`, color: t.category?.color }}>
                          {t.category?.name || 'Geral'}
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
        )}
      </div>

      {/* Modal Nova Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg shadow-2xl bg-white/95">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Lançar Registro</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`py-2 rounded-xl border font-medium transition-colors ${formData.type === 'expense' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>Despesa</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`py-2 rounded-xl border font-medium transition-colors ${formData.type === 'income' ? 'bg-success/10 border-success/30 text-success' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>Receita</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input required type="text" className="input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Supermercado Assaí" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
                  <input required type="number" step="0.01" className="input-field" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input required type="date" className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select required className="input-field" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                    {categories.filter(c => c.type === formData.type).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quem pagou?</label>
                  <select className="input-field" value={formData.payer} onChange={e => setFormData({...formData, payer: e.target.value})}>
                    <option value="Casal">Casal (Dinheiro em comum)</option>
                    <option value="André">André</option>
                    <option value="Sofia">Sofia</option>
                  </select>
                </div>
              </div>

              {formData.type === 'expense' && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm text-gray-700">
                      <input type="checkbox" className="rounded text-primary" checked={formData.is_installment} onChange={e => setFormData({...formData, is_installment: e.target.checked, is_recurring: false})} />
                      <span>Compra Parcelada</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-gray-700">
                      <input type="checkbox" className="rounded text-primary" checked={formData.is_recurring} onChange={e => setFormData({...formData, is_recurring: e.target.checked, is_installment: false})} />
                      <span>Despesa Recorrente Fixa</span>
                    </label>
                  </div>
                  
                  {formData.is_installment && (
                     <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">Em quantas vezes? (O valor total será rachado e agendado)</label>
                       <input type="number" min="2" max="48" className="input-field py-1 text-sm" value={formData.total_installments} onChange={e => setFormData({...formData, total_installments: parseInt(e.target.value)})} />
                     </div>
                  )}

                  {formData.is_recurring && (
                     <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">Projetar para quantos meses futuros? (O valor integral se repetirá)</label>
                       <input type="number" min="2" max="60" className="input-field py-1 text-sm" value={formData.recurring_months} onChange={e => setFormData({...formData, recurring_months: parseInt(e.target.value)})} />
                     </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
