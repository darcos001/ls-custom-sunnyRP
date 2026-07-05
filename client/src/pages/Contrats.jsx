import { useState, useEffect } from 'react';
import { Plus, X, Trash2, FileText, Pencil } from 'lucide-react';
import { appelApi, formaterArgent } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const PRIX_DEFAUT = 750;

export default function Contrats() {
  const { employe } = useAuth();
  const [contrats, setContrats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [contratEnEdition, setContratEnEdition] = useState(null);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const data = await appelApi('/contrats');
      setContrats(data);
    } finally {
      setChargement(false);
    }
  }

  async function supprimer(contrat) {
    if (!confirm(`Désactiver le contrat "${contrat.nom}" ? Les interventions liées seront conservées.`)) return;
    try {
      await appelApi(`/contrats/${contrat.id}`, { method: 'DELETE' });
      setContrats((prev) => prev.filter((c) => c.id !== contrat.id));
    } catch (e) {
      alert(e.message);
    }
  }

  if (chargement) return <p className="text-gray-400 text-sm">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Contrats</span>
        </div>
        {employe.est_admin && (
          <button
            onClick={() => { setContratEnEdition(null); setModaleOuverte(true); }}
            className="flex items-center gap-2 bg-accent-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            <Plus size={16} />
            Nouveau contrat
          </button>
        )}
      </div>

      {contrats.length === 0 ? (
        <div className="bg-bg-panel rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-bg-card flex items-center justify-center text-accent-blue">
            <FileText size={26} />
          </div>
          <p className="text-white font-semibold">Aucun contrat</p>
          <p className="text-gray-500 text-sm max-w-md">
            Crée des contrats pour des entreprises ou clients récurrents. Ils seront sélectionnables dans le formulaire de réparation/custom.
          </p>
        </div>
      ) : (
        <div className="bg-bg-panel rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[850px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                <th className="text-left pb-3 font-medium">Nom</th>
                <th className="text-left pb-3 font-medium">Description</th>
                <th className="text-left pb-3 font-medium">Plaques connues</th>
                <th className="text-right pb-3 font-medium">Prix réparation</th>
                <th className="text-right pb-3 font-medium">Prix kit</th>
                <th className="text-right pb-3 font-medium">Total semaine</th>
                <th className="text-right pb-3 font-medium">Total général</th>
                {employe.est_admin && <th className="pb-3"></th>}
              </tr>
            </thead>
            <tbody>
              {contrats.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-white font-semibold">{c.nom}</td>
                  <td className="py-3 text-gray-400 text-xs max-w-[200px] truncate">{c.description || '—'}</td>
                  <td className="py-3">
                    {c.plaques.length === 0 ? (
                      <span className="text-gray-500 text-xs">Aucune encore</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.plaques.slice(0, 3).map((p) => (
                          <span key={p.plaque} className="text-xs font-mono bg-bg-card px-2 py-0.5 rounded text-gray-300">
                            {p.plaque}
                          </span>
                        ))}
                        {c.plaques.length > 3 && <span className="text-xs text-gray-500">+{c.plaques.length - 3}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {c.prix_reparation != null ? (
                      <span className="text-white font-semibold">{formaterArgent(c.prix_reparation)}</span>
                    ) : (
                      <span className="text-gray-500 text-xs">{PRIX_DEFAUT} $ (défaut)</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {c.prix_kit != null ? (
                      <span className="text-white font-semibold">{formaterArgent(c.prix_kit)}</span>
                    ) : (
                      <span className="text-gray-500 text-xs">{PRIX_DEFAUT} $ (défaut)</span>
                    )}
                  </td>
                  <td className="py-3 text-right text-white font-semibold">{formaterArgent(c.total_semaine)}</td>
                  <td className="py-3 text-right">
                    <span className={c.total_impaye > 0 ? 'text-accent-amber font-semibold' : 'text-gray-400'}>
                      {formaterArgent(c.total_impaye)}
                    </span>
                  </td>
                  {employe.est_admin && (
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => { setContratEnEdition(c); setModaleOuverte(true); }}
                          className="text-gray-500 hover:text-accent-blue"
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => supprimer(c)} className="text-gray-500 hover:text-red-400" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modaleOuverte && (
        <ModaleContrat
          contrat={contratEnEdition}
          surFermer={() => setModaleOuverte(false)}
          surCree={() => { setModaleOuverte(false); charger(); }}
        />
      )}
    </div>
  );
}

function ModaleContrat({ contrat, surFermer, surCree }) {
  const modeEdition = !!contrat;
  const [nom, setNom] = useState(contrat?.nom || '');
  const [description, setDescription] = useState(contrat?.description || '');
  const [prixReparation, setPrixReparation] = useState(contrat?.prix_reparation ?? '');
  const [prixKit, setPrixKit] = useState(contrat?.prix_kit ?? '');
  const [erreur, setErreur] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererSoumission(e) {
    e.preventDefault();
    if (!nom.trim()) { setErreur('Le nom du contrat est obligatoire'); return; }
    setEnvoiEnCours(true);
    try {
      const corps = {
        nom,
        description,
        prix_reparation: prixReparation === '' ? null : Number(prixReparation),
        prix_kit: prixKit === '' ? null : Number(prixKit),
      };
      if (modeEdition) {
        await appelApi(`/contrats/${contrat.id}`, { method: 'PUT', body: JSON.stringify({ ...corps, actif: 1 }) });
      } else {
        await appelApi('/contrats', { method: 'POST', body: JSON.stringify(corps) });
      }
      surCree();
    } catch (e2) {
      setErreur(e2.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-panel rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{modeEdition ? 'Modifier le contrat' : 'Nouveau contrat'}</h2>
          <button onClick={surFermer} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={gererSoumission} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Nom du contrat / entreprise *</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: SASP, Dynasty 8, Gouv..." autoFocus />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Description (optionnel)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10 resize-none"
              placeholder="Ex: 5 réparations max par semaine..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Prix réparation ($)</label>
              <input type="number" min="0" value={prixReparation} onChange={(e) => setPrixReparation(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                placeholder={`${PRIX_DEFAUT} (défaut)`} />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Prix kit ($)</label>
              <input type="number" min="0" value={prixKit} onChange={(e) => setPrixKit(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                placeholder={`${PRIX_DEFAUT} (défaut)`} />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Laisse vide pour garder le prix par défaut ({PRIX_DEFAUT} $).
          </p>
          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}
          <button type="submit" disabled={envoiEnCours}
            className="bg-accent-blue text-white font-semibold py-2.5 rounded-lg text-sm mt-1 disabled:opacity-60">
            {envoiEnCours ? 'Enregistrement...' : modeEdition ? 'Enregistrer les modifications' : 'Créer le contrat'}
          </button>
        </form>
      </div>
    </div>
  );
}
