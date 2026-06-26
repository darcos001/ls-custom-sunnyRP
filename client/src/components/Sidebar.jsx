import { NavLink } from 'react-router-dom';
import {
  Home, UserCircle, Wrench, ShoppingBag, IdCard, Car, FileText, Clock, File,
} from 'lucide-react';

const liens = [
  { to: '/', label: 'Tableau de bord', icon: Home },
  { to: '/profil', label: 'Mon profil', icon: UserCircle },
  { to: '/repas-custom', label: 'Répas/Custom', icon: Wrench },
  { to: '/catalogue', label: 'Catalogue', icon: ShoppingBag },
  { to: '/clients', label: 'Fiches Clients', icon: IdCard },
  { to: '/employes', label: 'Équipe', icon: Car },
  { to: '/contrats', label: 'Contrats', icon: FileText },
  { to: '/badgeuse', label: 'Badgeuse', icon: Clock },
];

export default function Sidebar() {
  return (
    <aside className="w-[300px] bg-bg-panel border-r border-white/5 flex flex-col py-6 px-4 shrink-0">
      <div className="flex flex-col items-center mb-8">
        <div className="w-28 h-28 rounded-2xl bg-black flex items-center justify-center overflow-hidden ring-1 ring-white/10">
          <div className="text-center">
            <div className="text-amber-400 font-extrabold text-lg leading-none">LS</div>
            <div className="text-amber-400 font-extrabold text-lg leading-none">CUSTOM</div>
            <div className="text-[8px] text-gray-400 mt-1 tracking-wide">LOS SANTOS CUSTOMS</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {liens.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-blue text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8">
        <div className="text-xs text-gray-500 tracking-wider px-4 mb-2">DOCUMENTS</div>
        <NavLink
          to="/documents"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-accent-blue text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <File size={18} />
          Mes documents
        </NavLink>
      </div>
    </aside>
  );
}
