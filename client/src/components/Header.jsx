import { useState, useEffect } from 'react';
import { Wrench, Clock, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { appelApi } from '../api.js';

export default function Header() {
  const { employe, deconnecter, setEmploye } = useAuth();
  const [enService, setEnService] = useState(employe?.en_service ?? false);
  const [nbEnService, setNbEnService] = useState(0);
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    chargerCompteService();
    const intervalle = setInterval(chargerCompteService, 15000);
    return () => clearInterval(intervalle);
  }, []);

  async function chargerCompteService() {
    try {
      const r = await appelApi('/employes/en-service/compte');
      setNbEnService(r.en_service);
    } catch (e) {
      // silencieux
    }
  }

  async function basculerService() {
    const nouvelEtat = !enService;
    setEnService(nouvelEtat);
    try {
      await appelApi(`/employes/${employe.id}/service`, {
        method: 'POST',
        body: JSON.stringify({ en_service: nouvelEtat }),
      });
      chargerCompteService();
    } catch (e) {
      setEnService(!nouvelEtat); // on annule en cas d'échec
    }
  }

  if (!employe) return null;

  const initiales = employe.nom_affiche
    .split(' ')
    .map((m) => m[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-bg-panel rounded-xl mx-6 mt-6 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Wrench className="text-amber-400" size={22} />
          <span className="text-xl font-extrabold text-accent-blue tracking-wide">LS CUSTOM</span>
        </div>
        <span className="text-gray-400 text-sm">{employe.nom_affiche}</span>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-md bg-bg-card"
          style={{ color: employe.grade?.couleur }}
        >
          {employe.grade?.nom?.toUpperCase()}
        </span>
        <span className="text-xs font-semibold px-3 py-1 rounded-md bg-bg-card text-gray-300">
          {employe.grade?.commission_pourcentage}% COMMISSION
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={basculerService}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            enService ? 'bg-accent-green text-white' : 'bg-bg-card text-gray-300'
          }`}
        >
          <Clock size={16} />
          {enService ? 'En service' : 'Prise de service'}
        </button>

        <div className="flex items-center gap-2 bg-bg-card px-3 py-2 rounded-lg text-sm text-gray-200">
          <Users size={16} />
          {nbEnService} EN SERVICE
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOuvert((v) => !v)}
            className="w-10 h-10 rounded-full bg-bg-card flex items-center justify-center text-sm font-bold text-gray-200 relative"
          >
            {initiales}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-green ring-2 ring-bg-panel" />
          </button>
          {menuOuvert && (
            <div className="absolute right-0 mt-2 w-44 bg-bg-card rounded-lg shadow-lg ring-1 ring-white/10 overflow-hidden z-10">
              <button
                onClick={deconnecter}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-200 hover:bg-white/5"
              >
                <LogOut size={16} />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
