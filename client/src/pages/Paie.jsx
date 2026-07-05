import { useState, useEffect } from 'react';
import { Wallet, DollarSign, Wrench, Clock, RotateCcw } from 'lucide-react';
import { appelApi, formaterArgent } from '../api.js';

export default function Paie() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [reinitialisationEnCours, setReinitialisationEnCours] = useState(false);

  useEffect(() => {
    charger();
  }, []);

  function charger() {
    setChargement(true);
    appelApi('/badgeuse/paie')
      .then(setDonnees)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  async function reinitialiserPaie() {
    if (!confirm("Réinitialiser les paies ? Ça remet tous les compteurs à 0 (les commissions et heures déjà comptées seront considérées comme payées). Cette action est irréversible.")) return;
    setReinitialisationEnCours(true);
    try {
      await appelApi('/badgeuse/paie/reset', { method: 'POST' });
      charger();
    } catch (e) {
      alert(e.message);
    } finally {
      setReinitialisationEnCours(false);
    }
  }

  function formaterHeures(h) {
    const heures = Math.floor(h);
    const minutes = Math.round((h - heures) * 60);
    return `${heures}h${minutes.toString().padStart(2, '0')}`;
  }

  function formaterDateDepuis(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  if (chargement) return <p className="text-gray-400 text-sm">Chargement...</p>;
  if (erreur) return <p className="text-red-400 text-sm">{erreur}</p>;

  const totalGeneral = donnees.employes.reduce((s, e) => s + e.total_a_payer, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Paie</span>
        </div>
        <button
          onClick={reinitialiserPaie}
          disabled={reinitialisationEnCours}
          className="flex items-center gap-2 bg-bg-card text-white text-sm font-semibold px-4 py-2.5 rounded-lg border border-white/10 hover:border-red-400/50 disabled:opacity-60"
        >
          <RotateCcw size={16} />
          {reinitialisationEnCours ? 'Réinitialisation...' : 'Réinitialiser les paies'}
        </button>
      </div>

      <div className="bg-bg-panel rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Wallet size={18} className="text-accent-green" />
            Total à payer
          </div>
          <span className="text-2xl font-bold text-accent-green">{formaterArgent(totalGeneral)}</span>
        </div>
        <p className="text-gray-500 text-xs">
          Commissions des réparations/customs + heures de badgeuse ({donnees.taux_horaire} $/heure)
          {donnees.depuis && <> — depuis le {formaterDateDepuis(donnees.depuis)}</>}
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
