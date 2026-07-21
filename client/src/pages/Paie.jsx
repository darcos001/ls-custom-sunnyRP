import { useState, useEffect } from 'react';
import { Wallet, DollarSign, Wrench, Clock, RotateCcw, History, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { appelApi, formaterArgent } from '../api.js';

export default function Paie() {
  const [donnees, setDonnees] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [ligneOuverte, setLigneOuverte] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [reinitialisationEnCours, setReinitialisationEnCours] = useState(false);

  useEffect(() => {
    charger();
  }, []);

  function charger() {
    setChargement(true);
    Promise.all([appelApi('/badgeuse/paie'), appelApi('/badgeuse/paie/historique')])
      .then(([p, h]) => {
        setDonnees(p);
        setHistorique(h);
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  async function reinitialiserPaie() {
    if (!confirm("Réinitialiser les paies ? Ça remet tous les compteurs à 0 (les commissions et heures déjà comptées seront considérées comme payées et archivées dans l'historique). Cette action est irréversible.")) return;
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

  function formaterDateCourte(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function exporterHistoriqueCSV() {
    const entetes = ['Date de paiement', 'Depuis', "Jusqu'à", 'Montant total'];
    const echapper = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lignesCSV = historique.map((h) => [
      formaterDateCourte(h.date_paiement),
      formaterDateCourte(h.depuis),
      formaterDateCourte(h.jusqu_a),
      h.montant_total,
    ].map(echapper).join(';'));
    const contenu = [entetes.join(';'), ...lignesCSV].join('\n');
    const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `historique_paies_${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
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

      <div className="bg-bg-panel rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <History size={18} className="text-accent-blue" />
            Historique des paies
          </div>
          {historique.length > 0 && (
            <button
              onClick={exporterHistoriqueCSV}
              className="flex items-center gap-2 bg-bg-card text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              <Download size={14} />
              Exporter en CSV
            </button>
          )}
        </div>

        {historique.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">
            Aucune paie enregistrée pour l'instant. Elle apparaîtra ici dès la première réinitialisation.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {historique.map((h) => (
              <div key={h.id} className="bg-bg-card rounded-lg overflow-hidden">
                <button
                  onClick={() => setLigneOuverte(ligneOuverte === h.id ? null : h.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="text-sm text-gray-300">
                    <span className="text-white font-medium">{formaterDateCourte(h.date_paiement)}</span>
                    <span className="text-gray-500 ml-2">
                      (du {formaterDateCourte(h.depuis)} au {formaterDateCourte(h.jusqu_a)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-accent-green font-semibold text-sm">{formaterArgent(h.montant_total)}</span>
                    {ligneOuverte === h.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>
                {ligneOuverte === h.id && (
                  <div className="px-4 pb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 uppercase border-b border-white/5">
                          <th className="text-left pb-2 font-medium">Employé</th>
                          <th className="text-right pb-2 font-medium">Commissions</th>
                          <th className="text-right pb-2 font-medium">Badgeuse</th>
                          <th className="text-right pb-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {h.employes.map((e) => (
                          <tr key={e.employe_id} className="border-b border-white/5 last:border-0">
                            <td className="py-2 text-white">{e.nom_affiche}</td>
                            <td className="py-2 text-right text-gray-300">{formaterArgent(e.montant_commissions)}</td>
                            <td className="py-2 text-right text-gray-300">{formaterArgent(e.montant_badgeuse)}</td>
                            <td className="py-2 text-right text-accent-green font-semibold">{formaterArgent(e.total_a_payer)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
