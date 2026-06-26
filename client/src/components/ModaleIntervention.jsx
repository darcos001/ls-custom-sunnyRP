import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appelApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ModaleIntervention({ type, surFermer, surCree }) {
  const { employe } = useAuth();
  const [catalogue, setCatalogue] = useState([]);
  const [catalogueId, setCatalogueId] = useState('');
  const [nomPrestation, setNomPrestation] = useState('');
  const [plaque, setPlaque] = useState('');
  const [marqueVehicule, setMarqueVehicule] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [prix, setPrix] = useState('');
  const [coutMateriel, setCoutMateriel] = useState('');
  const [notes, setNotes] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  useEffect(() => {
    appelApi(`/catalogue?type=${type}`).then(setCatalogue).catch(() => {});
  }, [type]);

  function choisirItemCatalogue(id) {
    setCatalogueId(id);
    const item = catalogue.find((c) => String(c.id) === String(id));
    if (item) {
      setNomPrestation(item.nom);
      setPrix(item.prix);
      setCoutMateriel(item.cout_materiel);
    }
  }

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur('');
    if (!nomPrestation || !plaque || !marqueVehicule || !nomClient || !prix) {
      setErreur('Merci de remplir tous les champs obligatoires');
      return;
    }
    setEnvoiEnCours(true);
    try {
      await appelApi('/interventions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          catalogue_id: catalogueId || null,
          nom_prestation: nomPrestation,
          plaque,
          marque_vehicule: marqueVehicule,
          nom_client: nomClient,
          employe_id: employe.id,
          prix: Number(prix),
          cout_materiel: Number(coutMateriel) || 0,
          notes,
        }),
      });
      surCree();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const titre = type === 'custom' ? 'Nouveau Custom' : 'Nouvelle Réparation';
  const couleur = type === 'custom' ? 'bg-accent-amber' : 'bg-accent-blue';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-panel rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{titre}</h2>
          <button onClick={surFermer} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={gererSoumission} className="flex flex-col gap-4">
          {catalogue.length > 0 && (
            <Champ label="Prestation (catalogue)">
              <select
                value={catalogueId}
                onChange={(e) => choisirItemCatalogue(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              >
                <option value="">— Choisir dans le catalogue (ou saisie libre) —</option>
                {catalogue.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} — {c.prix}$
                  </option>
                ))}
              </select>
            </Champ>
          )}

          <Champ label="Nom de la prestation *">
            <input
              value={nomPrestation}
              onChange={(e) => setNomPrestation(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: Moteur, Peinture..."
            />
          </Champ>

          <div className="grid grid-cols-2 gap-4">
            <Champ label="Plaque *">
              <input
                value={plaque}
                onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                placeholder="AB-123-CD"
              />
            </Champ>
            <Champ label="Marque du véhicule *">
              <input
                value={marqueVehicule}
                onChange={(e) => setMarqueVehicule(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
                placeholder="Ex: Karin Sultan"
              />
            </Champ>
          </div>

          <Champ label="Nom du client *">
            <input
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: John Doe"
            />
          </Champ>

          <div className="grid grid-cols-2 gap-4">
            <Champ label="Prix ($) *">
              <input
                type="number"
                min="0"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              />
            </Champ>
            <Champ label="Coût matériel ($)">
              <input
                type="number"
                min="0"
                value={coutMateriel}
                onChange={(e) => setCoutMateriel(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              />
            </Champ>
          </div>

          <Champ label="Notes (optionnel)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10 resize-none"
            />
          </Champ>

          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

          <button
            type="submit"
            disabled={envoiEnCours}
            className={`${couleur} text-white font-semibold py-2.5 rounded-lg text-sm mt-1 disabled:opacity-60`}
          >
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
