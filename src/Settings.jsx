import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Tag, Pencil, Trash2, CreditCard, Building2, LayoutGrid } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('categories');
  const [data, setData] = useState({ categories: [], accounts: [], paymentMethods: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, accRes, payRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/accounts'),
        axios.get('/api/payment-methods')
      ]);
      setData({
        categories: catRes.data,
        accounts: accRes.data,
        paymentMethods: payRes.data
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type, item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name,
        type: item.type || 'expense',
        color: item.color || '#3b82f6'
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', type: 'expense', color: '#3b82f6' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      let url = '';
      if (type === 'categories') url = `/api/categories/${id}`;
      if (type === 'accounts') url = `/api/accounts/${id}`;
      if (type === 'paymentMethods') url = `/api/payment-methods/${id}`;
      
      await axios.delete(url);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao excluir item. Ele pode estar em uso.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = '';
      let payload = { name: formData.name };
      
      if (activeTab === 'categories') {
        url = editingId ? `/api/categories/${editingId}` : '/api/categories';
        payload = { ...payload, type: formData.type, color: formData.color };
      } else if (activeTab === 'accounts') {
        url = editingId ? `/api/accounts/${editingId}` : '/api/accounts';
        payload = { ...payload, color: formData.color };
      } else if (activeTab === 'paymentMethods') {
        url = editingId ? `/api/payment-methods/${editingId}` : '/api/payment-methods';
      }

      if (editingId) {
        await axios.put(url, payload);
      } else {
        await axios.post(url, payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar informações');
    }
  };

  const renderList = (items, type) => {
    return (
      <div className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">Nenhum item configurado.</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="p-4 flex items-center justify-between group hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center">
                {item.color && (
                  <div className="w-4 h-4 rounded-full mr-3 shadow-sm" style={{ backgroundColor: item.color }}></div>
                )}
                <span className="font-medium text-gray-800">{item.name}</span>
                {item.type && (
                   <span className={`ml-3 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${item.type === 'income' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                     {item.type === 'income' ? 'Receita' : 'Despesa'}
                   </span>
                )}
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(type, item)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(type, item.id)} className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 text-sm">Personalize suas categorias, contas bancárias e métodos de pagamento.</p>
        </div>
        <button onClick={() => openModal(activeTab)} className="btn-primary flex items-center shadow-lg">
          <Plus className="w-5 h-5 mr-1" />
          Novo Registro
        </button>
      </div>

      <div className="flex space-x-1 bg-white/50 p-1 rounded-2xl border border-gray-200 w-full md:w-fit">
        <button onClick={() => setActiveTab('categories')} className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'categories' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <LayoutGrid className="w-4 h-4 mr-2" /> Categorias
        </button>
        <button onClick={() => setActiveTab('accounts')} className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'accounts' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Building2 className="w-4 h-4 mr-2" /> Contas
        </button>
        <button onClick={() => setActiveTab('paymentMethods')} className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'paymentMethods' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <CreditCard className="w-4 h-4 mr-2" /> Métodos de Pagamento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeTab === 'categories' && (
            <>
              <div className="glass-card p-0 overflow-hidden">
                <div className="p-4 border-b border-danger/10 bg-danger/5 flex items-center"><Tag className="w-4 h-4 text-danger mr-2" /><span className="font-bold">Despesas</span></div>
                {renderList(data.categories.filter(c => c.type === 'expense'), 'categories')}
              </div>
              <div className="glass-card p-0 overflow-hidden">
                <div className="p-4 border-b border-success/10 bg-success/5 flex items-center"><Tag className="w-4 h-4 text-success mr-2" /><span className="font-bold">Receitas</span></div>
                {renderList(data.categories.filter(c => c.type === 'income'), 'categories')}
              </div>
            </>
          )}

          {activeTab === 'accounts' && (
            <div className="glass-card p-0 overflow-hidden md:col-span-2">
               <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center"><Building2 className="w-4 h-4 text-primary mr-2" /><span className="font-bold">Minhas Contas Financeiras</span></div>
               {renderList(data.accounts, 'accounts')}
            </div>
          )}

          {activeTab === 'paymentMethods' && (
            <div className="glass-card p-0 overflow-hidden md:col-span-2">
               <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center"><CreditCard className="w-4 h-4 text-primary mr-2" /><span className="font-bold">Métodos de Pagamento Aceitos</span></div>
               {renderList(data.paymentMethods, 'paymentMethods')}
            </div>
          )}
        </div>
      )}

      {/* Modal Genérico */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm shadow-2xl bg-white/95 border-primary/20">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Editar Registro' : 'Novo Registro'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'categories' && !editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`py-2 rounded-xl border font-medium transition-colors ${formData.type === 'expense' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>Despesa</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`py-2 rounded-xl border font-medium transition-colors ${formData.type === 'income' ? 'bg-success/10 border-success/30 text-success' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>Receita</button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Itaú, Pix, Supermercado..." />
              </div>

              {(activeTab === 'categories' || activeTab === 'accounts') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Identificação</label>
                  <div className="flex space-x-2">
                    <input required type="color" className="h-10 w-16 p-1 bg-white border border-gray-200 rounded-xl cursor-pointer" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                    <div className="flex-1 input-field flex items-center text-sm font-mono text-gray-500 uppercase">{formData.color}</div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
