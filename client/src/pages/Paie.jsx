import { useState, useEffect } from 'react';
import { Wallet, DollarSign, Wrench, Clock } from 'lucide-react';
import { appelApi, formaterArgent } from '../api.js';

export default function Paie() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    appelApi('/badgeuse/paie')
      .then(setDonnees)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, []);

  function formaterHeures(h) {
    const heures = Math.floor(h);
    const minutes = Math.round((h - heures) * 60);
    return `${heures}h${minutes.toString().padStart(2, '0')}`;
  }

  if (chargement) return <p className="text-gray-400 text-sm">Chargement...</p>;
  if (erreur) return <p className="text-red-400 text-sm">{erreur}</p>;

  const totalGeneral = donnees.employes.reduce((s, e) => s + e.total_a_payer, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-gray-400 text-lg">
        Gestion / <span className="text-white font-semibold">Paie</span>
      </div>

      <div className="bg-bg-panel rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Wallet size={18} className="text-accent-green" />
            Total à payer cette semaine
          </div>
          <span className="text-2xl font-bold text-accent-green">{formaterArgent(totalGeneral)}</span>
        </div>
        <p className="text-gray-500 text-xs">
          Commissions des réparations/customs + heures de badgeuse ({donnees.taux_horaire} $/heure)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {donnees.employes.map((e) => (
          <div key={e.employe_id} className="bg-bg-panel rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{e.nom_affiche}</h3>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-md"
                style={{ backgroundColor: `${e.couleur}22`, color: e.couleur }}
              >
                {e.grade_nom} · {e.commission_pourcentage}%
              </span>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Wrench size={14} />
                  Commissions ({e.interventions_count})
                </span>
                <span className="text-white font-medium">{formaterArgent(e.montant_commissions)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  Badgeuse ({formaterHeures(e.heures_badgeuse)})
                </span>
                <span className="text-white font-medium">{formaterArgent(e.montant_badgeuse)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-gray-300 text-sm font-medium">
                <DollarSign size={15} />
                Total à payer
              </span>
              <span className="text-accent-green font-bold text-lg">{formaterArgent(e.total_a_payer)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
