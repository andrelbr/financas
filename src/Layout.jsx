import { useAuth } from './AuthContext';
import { LogOut, Home, PieChart, Wallet, CreditCard, Menu } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Transações', href: '/transacoes', icon: CreditCard },
    { name: 'Categorias', href: '/categorias', icon: PieChart },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex flex-col w-64 glass-panel border-l-0 border-y-0 rounded-none border-r border-white/50 bg-white/40">
        <div className="h-16 flex items-center px-6 border-b border-white/50">
          <Wallet className="w-8 h-8 text-primary mr-3" />
          <span className="text-xl font-bold text-gray-900">Finanças</span>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                  active 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/50">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 bg-primary/20 text-primary font-bold rounded-full flex justify-center items-center mr-3">
              {user?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-danger hover:bg-danger/10 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden h-16 flex items-center justify-between px-4 bg-white/60 backdrop-blur-md border-b border-white/50 z-10">
          <div className="flex items-center">
            <Wallet className="w-6 h-6 text-primary mr-2" />
            <span className="font-bold text-gray-900">Finanças</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-0 z-20 bg-background/95 backdrop-blur-md flex flex-col pt-16">
            <div className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-gray-600 font-medium text-lg border-b border-gray-100"
                >
                  <item.icon className="w-6 h-6 mr-4 text-primary" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="p-6">
               <button onClick={logout} className="w-full btn-secondary text-danger border-danger/20 flex justify-center items-center">
                 <LogOut className="w-5 h-5 mr-2" /> Sair da conta
               </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
