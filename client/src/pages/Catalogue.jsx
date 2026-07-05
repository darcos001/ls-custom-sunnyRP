import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, ShoppingBag, Car } from 'lucide-react';
import { appelApi, formaterArgent } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Catalogue() {
  const { employe } = useAuth();
  const [items, setItems] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [itemEnEdition, setItemEnEdition] = useState(null);
  const [marques, setMarques] = useState([]);
  const [nouvelleMarque, setNouvelleMarque] = useState('');

  useEffect(() => {
    charger();
    chargerMarques();
  }, []);

  async function chargerMarques() {
    try {
      const data = await appelApi('/marques');
      setMarques(data);
    } catch (e) {}
  }

  async function ajouterMarque(e) {
    e.preventDefault();
    if (!nouvelleMarque.trim()) return;
    try {
      await appelApi('/marques', { method: 'POST', body: JSON.stringify({ nom: nouvelleMarque }) });
      setNouvelleMarque('');
      chargerMarques();
    } catch (e) {
      alert(e.message);
    }
  }

  async function supprimerMarque(id) {
    if (!confirm('Retirer cette marque de la liste ?')) return;
    await appelApi(`/marques/${id}`, { method: 'DELETE' });
    chargerMarques();
  }

  async function charger() {
    setChargement(true);
    try {
      const data = await appelApi('/catalogue');
      setItems(data);
    } finally {
      setChargement(false);
    }
  }

  async function supprimer(id) {
    if (!confirm('Désactiver cette prestation du catalogue ?')) return;
    await appelApi(`/catalogue/${id}`, { method: 'DELETE' });
    charger();
  }

  const reparations = items.filter((i) => i.type === 'reparation');
  const customs = items.filter((i) => i.type === 'custom');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Catalogue</span>
        </div>
        {employe.est_admin && (
          <button
            onClick={() => {
              setItemEnEdition(null);
              setModaleOuverte(true);
            }}
            className="flex items-center gap-2 bg-accent-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            <Plus size={16} />
            Ajouter une prestation
          </button>
        )}
      </div>

      {chargement ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BlocCatalogue
            titre="Réparations"
            couleur="#f59e0b"
            items={reparations}
            estAdmin={employe.est_admin}
            surEdition={(item) => {
              setItemEnEdition(item);
              setModaleOuverte(true);
            }}
            surSuppression={supprimer}
          />
          <BlocCatalogue
            titre="Customs"
            couleur="#3b82f6"
            items={customs}
            estAdmin={employe.est_admin}
            surEdition={(item) => {
              setItemEnEdition(item);
              setModaleOuverte(true);
            }}
            surSuppression={supprimer}
          />
        </div>
      )}

      <div className="bg-bg-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Car size={18} className="text-accent-blue" />
          <h3 className="text-white font-semibold">Marques de véhicules</h3>
        </div>
        <p className="text-gray-500 text-xs mb-4">
          Cette liste se remplit automatiquement à chaque réparation/custom enregistré. Tu peux aussi en ajouter manuellement ici pour qu'elles soient disponibles à l'avance dans le menu déroulant.
        </p>
        <form onSubmit={ajouterMarque} className="flex gap-2 mb-4">
          <input
            value={nouvelleMarque}
            onChange={(e) => setNouvelleMarque(e.target.value)}
            placeholder="Ex: Karin Sultan"
            className="flex-1 bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
          />
          <button type="submit" className="bg-accent-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
            Ajouter
          </button>
        </form>
        {marques.length === 0 ? (
          <p className="text-gray-500 text-sm py-2 text-center">Aucune marque enregistrée pour l'instant.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {marques.map((m) => (
              <span key={m.id} className="flex items-center gap-2 text-xs font-mono bg-bg-card px-3 py-1.5 rounded text-gray-300">
                {m.nom}
                {employe.est_admin && (
                  <button onClick={() => supprimerMarque(m.id)} className="text-gray-500 hover:text-red-400">
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {modaleOuverte && (
        <ModaleCatalogue
          item={itemEnEdition}
          surFermer={() => setModaleOuverte(false)}
          surEnregistre={() => {
            setModaleOuverte(false);
            charger();
          }}
        />
      )}
    </div>
  );
}

function BlocCatalogue({ titre, couleur, items, estAdmin, surEdition, surSuppression }) {
  return (
    <div className="bg-bg-panel rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag size={18} style={{ color: couleur }} />
        <h3 className="text-white font-semibold">{titre}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">Aucune prestation.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-bg-card rounded-lg px-4 py-3"
            >
              <div>
                <div className="text-white text-sm font-medium">{item.nom}</div>
                <div className="text-gray-500 text-xs mt-0.5">
                  Coût matériel : {formaterArgent(item.cout_materiel)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold text-sm">{formaterArgent(item.prix)}</span>
                {estAdmin && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => surEdition(item)} className="text-gray-500 hover:text-accent-blue">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => surSuppression(item.id)} className="text-gray-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModaleCatalogue({ item, surFermer, surEnregistre }) {
  const [nom, setNom] = useState(item?.nom || '');
  const [type, setType] = useState(item?.type || 'reparation');
  const [prix, setPrix] = useState(item?.prix ?? '');
  const [coutMateriel, setCoutMateriel] = useState(item?.cout_materiel ?? '');
  const [erreur, setErreur] = useState('');

  async function gererSoumission(e) {
    e.preventDefault();
    if (!nom || !prix) {
      setErreur('Nom et prix sont requis');
      return;
    }
    try {
      const corps = JSON.stringify({
        nom,
        type,
        prix: Number(prix),
        cout_materiel: Number(coutMateriel) || 0,
        actif: 1,
      });
      if (item) {
        await appelApi(`/catalogue/${item.id}`, { method: 'PUT', body: corps });
      } else {
        await appelApi('/catalogue', { method: 'POST', body: corps });
      }
      surEnregistre();
    } catch (e) {
      setErreur(e.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-panel rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">
            {item ? 'Modifier la prestation' : 'Nouvelle prestation'}
          </h2>
          <button onClick={surFermer} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={gererSoumission} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
            >
              <option value="reparation">Réparation</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Prix ($)</label>
              <input
                type="number"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Coût matériel ($)</label>
              <input
                type="number"
                value={coutMateriel}
                onChange={(e) => setCoutMateriel(e.target.value)}
                className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              />
            </div>
          </div>
          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}
          <button type="submit" className="bg-accent-blue text-white font-semibold py-2.5 rounded-lg text-sm mt-1">
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
