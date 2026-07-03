import { useState, useEffect } from 'react';
import { Paintbrush, Wrench, DollarSign, TrendingUp, Search, Filter, RotateCcw, Trash2 } from 'lucide-react';
import CarteStat from '../components/CarteStat.jsx';
import ModaleIntervention from '../components/ModaleIntervention.jsx';
import { appelApi, formaterArgent, formaterDate } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function RepasCustom() {
  const { employe } = useAuth();
  const [stats, setStats] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modaleOuverte, setModaleOuverte] = useState(null);

  const [recherche, setRecherche] = useState('');
  const [filtreEmploye, setFiltreEmploye] = useState('');
  const [tri, setTri] = useState('recents');

  useEffect(() => {
    chargerTout();
  }, []);

  async function chargerTout() {
    setChargement(true);
    try {
      const [s, l, e] = await Promise.all([
        appelApi('/interventions/stats/semaine'),
        appelApi('/interventions'),
        appelApi('/employes'),
      ]);
      setStats(s);
      setLignes(l);
      setEmployes(e);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  }

  async function appliquerFiltres() {
    const params = new URLSearchParams();
    if (recherche) params.set('recherche', recherche);
    if (filtreEmploye) params.set('employe_id', filtreEmploye);
    if (tri) params.set('tri', tri);
    try {
      const l = await appelApi(`/interventions?${params.toString()}`);
      setLignes(l);
    } catch (err) {
      console.error(err);
    }
  }

  function reinitialiserFiltres() {
    setRecherche('');
    setFiltreEmploye('');
    setTri('recents');
    chargerTout();
  }

  async function supprimerLigne(id) {
    if (!confirm('Supprimer cette intervention ?')) return;
    try {
      await appelApi(`/interventions/${id}`, { method: 'DELETE' });
      setLignes((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  function gererInterventionCreee() {
    setModaleOuverte(null);
    chargerTout();
  }

  if (chargement) {
    return <div className="text-gray-400 text-sm">Chargement...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Répas/Custom</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModaleOuverte('custom')}
            className="flex items-center gap-2 bg-accent-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            <Paintbrush size={16} />
            Nouveau Custom
          </button>
          <button
            onClick={() => setModaleOuverte('reparation')}
            className="flex items-center gap-2 bg-accent-amber text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            <Wrench size={16} />
            Nouvelle Réparation
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white font-semibold">Statistiques de la semaine en cours</span>
          <span className="text-xs font-semibold text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-md">
            RELATIVE À AUJOURD'HUI
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <CarteStat
            icone={Paintbrush}
            couleur="#3b82f6"
            titre="Customs"
            valeur={stats.customs_count}
            sousValeur={formaterArgent(stats.customs_total)}
          />
          <CarteStat
            icone={Wrench}
            couleur="#3b82f6"
            titre="Réparations"
            valeur={stats.reparations_count}
            sousValeur={formaterArgent(stats.reparations_total)}
          />
          {employe.est_admin && (
            <CarteStat
              icone={DollarSign}
              couleur="#f59e0b"
              titre="Total Général"
              valeur={formaterArgent(stats.ca_total)}
              sousValeur="Revenus totaux"
              sousValeurCouleur="#9ca3af"
            />
          )}
          <CarteStat
            icone={TrendingUp}
            couleur="#22c55e"
            titre="Bénéfice (Customs)"
            valeur={formaterArgent(stats.customs_benefice)}
            sousValeur="Marge nette"
            sousValeurCouleur="#9ca3af"
          />
        </div>
      </div>

      <div className="bg-bg-panel rounded-xl p-6 flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 tracking-wider block mb-2">RECHERCHE</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un client, un véhicule, un prix, une description..."
              className="w-full bg-bg-input rounded-lg pl-10 pr-4 py-2.5 text-sm text-white border border-white/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 tracking-wider block mb-2">MÉCANICIEN</label>
            <select
              value={filtreEmploye}
              onChange={(e) => setFiltreEmploye(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
            >
              <option value="">Tous les mécaniciens</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom_affiche}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 tracking-wider block mb-2">TRI</label>
            <select
              value={tri}
              onChange={(e) => setTri(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
            >
              <option value="recents">Plus récents</option>
              <option value="anciens">Plus anciens</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={appliquerFiltres}
            className="flex-1 flex items-center justify-center gap-2 bg-accent-blue text-white font-semibold py-2.5 rounded-lg text-sm"
          >
            <Filter size={16} />
            Filtrer
          </button>
          <button
            onClick={reinitialiserFiltres}
            className="px-4 bg-bg-card text-gray-300 rounded-lg flex items-center justify-center"
            title="Réinitialiser"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="bg-bg-panel rounded-xl p-5 overflow-x-auto">
        {lignes.length === 0 ? (
          <p className="text-gray-500 text-sm py-10 text-center">Aucune intervention trouvée.</p>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                <th className="text-left pb-3 font-medium">Date</th>
                <th className="text-left pb-3 font-medium">Type</th>
                <th className="text-left pb-3 font-medium">Client</th>
                <th className="text-left pb-3 font-medium">Véhicule</th>
                <th className="text-left pb-3 font-medium">Plaque</th>
                <th className="text-left pb-3 font-medium">Mécano</th>
                <th className="text-right pb-3 font-medium">Prix</th>
                <th className="text-right pb-3 font-medium">Bénéfice</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-gray-300 whitespace-nowrap">{formaterDate(ligne.date_creation)}</td>
                  <td className="py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        ligne.type === 'custom'
                          ? 'bg-accent-blue/15 text-accent-blue'
                          : 'bg-accent-amber/15 text-accent-amber'
                      }`}
                    >
                      {ligne.nom_prestation}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{ligne.nom_client}</td>
                  <td className="py-3 text-gray-300">{ligne.marque_vehicule}</td>
                  <td className="py-3 text-gray-400 font-mono text-xs">{ligne.plaque}</td>
                  <td className="py-3 text-gray-300">{ligne.mecano_nom}</td>
                  <td className="py-3 text-right text-white font-semibold whitespace-nowrap">
                    {formaterArgent(ligne.prix)}
                  </td>
                  <td className="py-3 text-right text-accent-green font-semibold whitespace-nowrap">
                    +{formaterArgent(ligne.benefice)}
                  </td>
                  <td className="py-3 text-right">
                    {(ligne.employe_id === employe.id || employe.est_admin) && (
                      <button
                        onClick={() => supprimerLigne(ligne.id)}
                        className="text-gray-500 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modaleOuverte && (
        <ModaleIntervention
          type={modaleOuverte}
          surFermer={() => setModaleOuverte(null)}
          surCree={gererInterventionCreee}
        />
      )}
    </div>
  );
}
