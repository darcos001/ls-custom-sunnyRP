import { useState, useEffect } from 'react';
import { IdCard, Search } from 'lucide-react';
import { appelApi, formaterArgent, formaterDate } from '../api.js';

export default function Clients() {
  const [interventions, setInterventions] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    appelApi('/interventions')
      .then(setInterventions)
      .finally(() => setChargement(false));
  }, []);

  // On regroupe les interventions par client (nom + plaque) pour construire des "fiches"
  const clients = {};
  interventions.forEach((i) => {
    const cle = `${i.nom_client}__${i.plaque}`;
    if (!clients[cle]) {
      clients[cle] = {
        nom_client: i.nom_client,
        plaque: i.plaque,
        vehicule: i.marque_vehicule,
        interventions: [],
        total_depense: 0,
      };
    }
    clients[cle].interventions.push(i);
    clients[cle].total_depense += i.prix;
  });

  const listeClients = Object.values(clients).filter((c) => {
    if (!recherche) return true;
    const r = recherche.toLowerCase();
    return c.nom_client.toLowerCase().includes(r) || c.plaque.toLowerCase().includes(r);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="text-gray-400 text-lg">
        Gestion / <span className="text-white font-semibold">Fiches Clients</span>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un client ou une plaque..."
          className="w-full bg-bg-input rounded-lg pl-10 pr-4 py-2.5 text-sm text-white border border-white/10"
        />
      </div>

      {chargement ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : listeClients.length === 0 ? (
        <p className="text-gray-500 text-sm py-10 text-center">Aucun client trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listeClients.map((c) => (
            <div key={`${c.nom_client}-${c.plaque}`} className="bg-bg-panel rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <IdCard size={18} className="text-accent-blue" />
                <h3 className="text-white font-semibold">{c.nom_client}</h3>
              </div>
              <div className="text-sm text-gray-400 space-y-1 mb-3">
                <div>Véhicule : {c.vehicule}</div>
                <div className="font-mono text-xs">Plaque : {c.plaque}</div>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
                <span className="text-gray-400">{c.interventions.length} intervention(s)</span>
                <span className="text-white font-semibold">{formaterArgent(c.total_depense)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
