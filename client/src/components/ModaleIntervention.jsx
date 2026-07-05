import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appelApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const PRIX_REPARATION_FIXE = 750;

export default function ModaleIntervention({ type, surFermer, surCree }) {
  const { employe } = useAuth();

  const [contrats, setContrats] = useState([]);
  const [contratId, setContratId] = useState('');
  const [plaquesContrat, setPlaquesContrat] = useState([]);
  const [plaqueManuelle, setPlaqueManuelle] = useState(false);

  const [description, setDescription] = useState('');
  const [plaque, setPlaque] = useState('');
  const [marqueVehicule, setMarqueVehicule] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [prix, setPrix] = useState('');
  const [notes, setNotes] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const estCustom = type === 'custom';
  const contratSelectionne = contrats.find((c) => String(c.id) === String(contratId));
  const prixReparationApplique =
    contratSelectionne && contratSelectionne.prix_reparation != null
      ? contratSelectionne.prix_reparation
      : PRIX_REPARATION_FIXE;

  useEffect(() => {
    appelApi('/contrats').then(setContrats).catch(() => {});
  }, []);

  async function choisirContrat(id) {
    setContratId(id);
    setPlaque('');
    setMarqueVehicule('');
    setNomClient('');
    setPlaqueManuelle(false);
    if (!id) { setPlaquesContrat([]); return; }
    try {
      const plaques = await appelApi(`/contrats/${id}/plaques`);
      setPlaquesContrat(plaques);
    } catch (e) {
      setPlaquesContrat([]);
    }
  }

  function choisirPlaque(valeur) {
    if (valeur === '__manuel__') {
      setPlaqueManuelle(true);
      setPlaque(''); setMarqueVehicule(''); setNomClient('');
      return;
    }
    const trouvee = plaquesContrat.find((p) => p.plaque === valeur);
    if (trouvee) {
      setPlaque(trouvee.plaque);
      setMarqueVehicule(trouvee.marque_vehicule);
      setNomClient(trouvee.nom_client);
      setPlaqueManuelle(false);
    }
  }

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur('');
    if (!plaque || !marqueVehicule || !nomClient) {
      setErreur('Plaque, marque du véhicule et nom du client sont obligatoires');
      return;
    }
    if (estCustom && !prix) { setErreur('Le prix est obligatoire pour un custom'); return; }
    setEnvoiEnCours(true);
    try {
      await appelApi('/interventions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          nom_prestation: estCustom ? (description || 'Custom') : 'Réparation',
          plaque, marque_vehicule: marqueVehicule, nom_client: nomClient,
          employe_id: employe.id,
          prix: estCustom ? Number(prix) : PRIX_REPARATION_FIXE,
          notes,
          contrat_id: contratId ? Number(contratId) : null,
        }),
      });
      surCree();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const titre = estCustom ? 'Nouveau Custom' : 'Nouvelle Réparation';
  const couleur = estCustom ? 'bg-accent-amber' : 'bg-accent-blue';
  const afficherSaisieManuelle = !contratId || plaqueManuelle || plaquesContrat.length === 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-panel rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{titre}</h2>
          <button onClick={surFermer} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={gererSoumission} className="flex flex-col gap-4">
          {!estCustom && (
            <div className="bg-bg-card rounded-lg px-4 py-3 text-sm text-gray-300">
              Prix : <span className="text-white font-semibold">{prixReparationApplique} $</span>
              {contratSelectionne && contratSelectionne.prix_reparation != null && (
                <span className="text-xs text-accent-blue ml-2">(tarif contrat {contratSelectionne.nom})</span>
              )}
            </div>
          )}

          <Champ label="Contrat / Entreprise (optionnel)">
            <select value={contratId} onChange={(e) => choisirContrat(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10">
              <option value="">— Aucun contrat (Particulier) —</option>
              {contrats.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Champ>

          {contratId && plaquesContrat.length > 0 && !plaqueManuelle && (
            <Champ label="Plaque *">
              <select value={plaque} onChange={(e) => choisirPlaque(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10">
                <option value="">— Choisir une plaque connue —</option>
                {plaquesContrat.map((p) => (
                  <option key={p.plaque} value={p.plaque}>
                    {p.plaque} — {p.marque_vehicule} ({p.nom_client})
                  </option>
                ))}
                <option value="__manuel__">+ Saisir une nouvelle plaque</option>
              </select>
            </Champ>
          )}

          {afficherSaisieManuelle && (
            <div className="grid grid-cols-2 gap-4">
              <Champ label="Plaque *">
                <input value={plaque} onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                  className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                  placeholder="AB-123-CD" />
              </Champ>
              <Champ label="Marque du véhicule *">
                <input value={marqueVehicule} onChange={(e) => setMarqueVehicule(e.target.value)}
                  className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                  placeholder="Ex: Karin Sultan" />
              </Champ>
            </div>
          )}

          {contratId && !plaqueManuelle && plaque && (
            <Champ label="Marque du véhicule *">
              <input value={marqueVehicule} onChange={(e) => setMarqueVehicule(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                placeholder="Ex: Karin Sultan" />
            </Champ>
          )}

          <Champ label="Nom du client *">
            <input value={nomClient} onChange={(e) => setNomClient(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: John Doe" />
          </Champ>

          {estCustom && (
            <>
              <Champ label="Description du custom (optionnel)">
                <input value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                  placeholder="Ex: Peinture + jantes" />
              </Champ>
              <Champ label="Prix ($) *">
                <input type="number" min="0" value={prix} onChange={(e) => setPrix(e.target.value)}
                  className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                  placeholder="Ex: 300" />
              </Champ>
            </>
          )}

          <Champ label="Notes (optionnel)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10 resize-none" />
          </Champ>

          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

          <button type="submit" disabled={envoiEnCours}
            className={`${couleur} text-white font-semibold py-2.5 rounded-lg text-sm mt-1 disabled:opacity-60`}>
            {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Champ({ label, children }) {
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
