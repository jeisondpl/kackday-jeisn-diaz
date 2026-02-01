import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Centro de Alertas', to: '/inteligencia' },
  { label: 'Base de Conocimiento', to: '/knowledge' },
  { label: 'Asistente IA', to: '/chatbot' },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-corp-light md:flex">
      <aside className="md:w-64 bg-corp-dark">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg" />
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">UPTC Energía</p>
              <h1 className="text-lg font-semibold text-white">Panel Central</h1>
            </div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-corp-dark shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
