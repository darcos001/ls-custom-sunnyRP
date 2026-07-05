import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appelApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const PRIX_KIT = 750;

export default function ModaleKitReparation({ surFermer, surCree }) {
  const { employe } = useAuth();

  const [contrats, setContrats] = useState([]);
  const [contratId, setContratId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [nomClient, setNomClient] = useState('');
  const [notes, setNotes] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  useEffect(() => {
    appelApi('/contrats').then(setContrats).catch(() => {});
  }, []);

  const contratSelectionne = contrats.find((c) => String(c.id) === String(contratId));
  const prixUnitaireApplique =
    contratSelectionne && contratSelectionne.prix_kit != null ? contratSelectionne.prix_kit : PRIX_KIT;
  const total = (Number(quantite) || 0) * prixUnitaireApplique;

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur('');
    if (!quantite || Number(quantite) < 1) {
      setErreur('Indique un nombre de kits vendus (au moins 1)');
      return;
    }
    setEnvoiEnCours(true);
    try {
      await appelApi('/interventions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'reparation',
          nom_prestation: `Kit de réparation x${quantite}`,
          plaque: 'KIT-REPARATION',
          marque_vehicule: 'Kit de réparation',
          nom_client: nomClient || 'Client comptant',
          employe_id: employe.id,
          quantite: Number(quantite),
          notes,
          contrat_id: contratId ? Number(contratId) : null,
        }),
      });
      surCree();
    } catch (e2) {
      setErreur(e2.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-panel rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">🧰 Vente de kits de réparation</h2>
          <button onClick={surFermer} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={gererSoumission} className="flex flex-col gap-4">
          <div className="bg-bg-card rounded-lg px-4 py-3 text-sm text-gray-300">
            Prix : <span className="text-white font-semibold">{prixUnitaireApplique} $</span> / kit
            {contratSelectionne && contratSelectionne.prix_kit != null && (
              <span className="text-xs text-accent-blue ml-2">(tarif contrat {contratSelectionne.nom})</span>
            )}
          </div>

          <Champ label="Nombre de kits vendus *">
            <input
              type="number"
              min="1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              autoFocus
            />
          </Champ>

          <Champ label="Contrat / Entreprise (optionnel)">
            <select
              value={contratId}
              onChange={(e) => setContratId(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
            >
              <option value="">— Aucun contrat (Particulier) —</option>
              {contrats.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Champ>

          <Champ label="Nom du client (optionnel)">
            <input
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: John Doe"
            />
          </Champ>

          <Champ label="Notes (optionnel)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10 resize-none"
            />
          </Champ>

          <div className="bg-bg-card rounded-lg px-4 py-3 text-sm text-gray-300 flex justify-between items-center">
            <span>Total</span>
            <span className="text-white font-bold text-base">{total.toLocaleString('fr-FR')} $</span>
          </div>

          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

          <button
            type="submit"
            disabled={envoiEnCours}
            className="bg-accent-amber text-white font-semibold py-2.5 rounded-lg text-sm mt-1 disabled:opacity-60"
          >
            {envoiEnCours ? 'Enregistrement...' : 'Valider la vente'}
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
