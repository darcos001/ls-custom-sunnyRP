import { useState, useEffect } from 'react';
import { UserCircle, DollarSign, Wrench, TrendingUp } from 'lucide-react';
import CarteStat from '../components/CarteStat.jsx';
import { appelApi, formaterArgent } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profil() {
  const { employe } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    appelApi(`/interventions/stats/employe/${employe.id}`).then(setStats);
  }, [employe.id]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-gray-400 text-lg">
        Gestion / <span className="text-white font-semibold">Mon profil</span>
      </div>

      <div className="bg-bg-panel rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-bg-card flex items-center justify-center text-accent-blue">
          <UserCircle size={36} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{employe.nom_affiche}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{ backgroundColor: `${employe.grade?.couleur}22`, color: employe.grade?.couleur }}
            >
              {employe.grade?.nom?.toUpperCase()}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bg-card text-gray-300">
              {employe.grade?.commission_pourcentage}% COMMISSION
            </span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <CarteStat
            icone={Wrench}
            couleur="#3b82f6"
            titre="Interventions réalisées"
            valeur={stats.interventions_count}
          />
          {employe.est_admin && (
            <CarteStat
              icone={DollarSign}
              couleur="#f59e0b"
              titre="Chiffre d'affaires généré"
              valeur={formaterArgent(stats.total_genere)}
            />
          )}
          <CarteStat
            icone={TrendingUp}
            couleur="#22c55e"
            titre="Commissions perçues"
            valeur={formaterArgent(stats.total_commission)}
          />
        </div>
      )}
    </div>
  );
}
