import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Tag } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6'
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/categories', formData);
      setIsModalOpen(false);
      setFormData({ name: '', type: 'expense', color: '#3b82f6' });
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar categoria');
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 text-sm">Organize de onde seu dinheiro vem e para onde ele vai.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center shadow-lg">
          <Plus className="w-5 h-5 mr-1" />
          Nova Categoria
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Despesas */}
          <div className="glass-card p-0 overflow-hidden">
             <div className="p-4 border-b border-danger/10 bg-danger/5 flex items-center">
                <Tag className="w-5 h-5 text-danger mr-2" />
                <h3 className="font-bold text-gray-900">Categorias de Despesa</h3>
             </div>
             <div className="divide-y divide-gray-100">
               {expenseCategories.length === 0 ? (
                 <p className="p-4 text-sm text-gray-400">Nenhuma categoria encontrada.</p>
               ) : (
                 expenseCategories.map(cat => (
                   <div key={cat.id} className="p-4 flex items-center">
                     <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: cat.color }}></div>
                     <span className="font-medium text-gray-800">{cat.name}</span>
                   </div>
                 ))
               )}
             </div>
          </div>

          {/* Receitas */}
          <div className="glass-card p-0 overflow-hidden">
             <div className="p-4 border-b border-success/10 bg-success/5 flex items-center">
                <Tag className="w-5 h-5 text-success mr-2" />
                <h3 className="font-bold text-gray-900">Categorias de Receita</h3>
             </div>
             <div className="divide-y divide-gray-100">
               {incomeCategories.length === 0 ? (
                 <p className="p-4 text-sm text-gray-400">Nenhuma categoria encontrada.</p>
               ) : (
                 incomeCategories.map(cat => (
                   <div key={cat.id} className="p-4 flex items-center">
                     <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: cat.color }}></div>
                     <span className="font-medium text-gray-800">{cat.name}</span>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm shadow-2xl bg-white/95">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Criar Categoria</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`py-2 rounded-xl border font-medium transition-colors ${formData.type === 'expense' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>Para Despesas</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`py-2 rounded-xl border font-medium transition-colors ${formData.type === 'income' ? 'bg-success/10 border-success/30 text-success' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>Para Receitas</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Farmácia, Salário..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <div className="flex space-x-2">
                  <input required type="color" className="h-10 w-16 p-1 bg-white border border-gray-200 rounded-xl cursor-pointer" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                  <div className="flex-1 input-field flex items-center text-sm font-mono text-gray-500 uppercase">
                    {formData.color}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Categoria</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
