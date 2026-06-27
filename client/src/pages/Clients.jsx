import { useState, useEffect } from 'react';
import { Contact, Search, Car, User, DollarSign, Wrench, Paintbrush } from 'lucide-react';
import { appelApi, formaterArgent, formaterDate } from '../api.js';

export default function Clients() {
  const [interventions, setInterventions] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);

  const [plaqueSaisie, setPlaqueSaisie] = useState('');
  const [resultatPlaque, setResultatPlaque] = useState(null);
  const [plaqueRecherchee, setPlaqueRecherchee] = useState('');

  useEffect(() => {
    appelApi('/interventions')
      .then(setInterventions)
      .finally(() => setChargement(false));
  }, []);

  function rechercherPlaque(e) {
    e.preventDefault();
    const cible = plaqueSaisie.trim().toUpperCase();
    setPlaqueRecherchee(cible);
    if (!cible) {
      setResultatPlaque(null);
      return;
    }
    const trouvees = interventions
      .filter((i) => i.plaque.toUpperCase() === cible)
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    setResultatPlaque(trouvees);
  }

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

  const totalPlaque = resultatPlaque ? resultatPlaque.reduce((s, i) => s + i.prix, 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-gray-400 text-lg">
        Gestion / <span className="text-white font-semibold">Fiches Clients</span>
      </div>

      <div className="bg-bg-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 text-white font-semibold">
          <Car size={18} className="text-accent-blue" />
          Historique d'un véhicule par plaque
        </div>
        <form onSubmit={rechercherPlaque} className="flex gap-3 flex-wrap">
          <input
            value={plaqueSaisie}
            onChange={(e) => setPlaqueSaisie(e.target.value.toUpperCase())}
            placeholder="Ex: AB-123-CD"
            className="flex-1 min-w-[200px] bg-bg-input rounded-lg px-4 py-2.5 text-sm text-white border border-white/10 font-mono"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-accent-blue text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
          >
            <Search size={16} />
            Rechercher
          </button>
        </form>

        {resultatPlaque !== null && (
          <div className="mt-5">
            {resultatPlaque.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Aucune intervention trouvée pour la plaque <span className="font-mono">{plaqueRecherchee}</span>.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoCarte
                    icone={Car}
                    couleur="#3b82f6"
                    label="Véhicule"
                    valeur={resultatPlaque[0].marque_vehicule}
                  />
                  <InfoCarte
                    icone={User}
                    couleur="#a855f7"
                    label="Client le plus récent"
                    valeur={resultatPlaque[0].nom_client}
                  />
                  <InfoCarte
                    icone={DollarSign}
                    couleur="#22c55e"
                    label="Total dépensé"
                    valeur={formaterArgent(totalPlaque)}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                        <th className="text-left pb-2 font-medium">Date</th>
                        <th className="text-left pb-2 font-medium">Type</th>
                        <th className="text-left pb-2 font-medium">Client</th>
                        <th className="text-left pb-2 font-medium">Mécano</th>
                        <th className="text-right pb-2 font-medium">Prix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultatPlaque.map((i) => (
                        <tr key={i.id} className="border-b border-white/5 last:border-0">
                          <td className="py-2.5 text-gray-300 whitespace-nowrap">
                            {formaterDate(i.date_creation)}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md ${
                                i.type === 'custom'
                                  ? 'bg-accent-blue/15 text-accent-blue'
                                  : 'bg-accent-amber/15 text-accent-amber'
                              }`}
                            >
                              {i.type === 'custom' ? <Paintbrush size={12} /> : <Wrench size={12} />}
                              {i.nom_prestation}
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-300">{i.nom_client}</td>
                          <td className="py-2.5 text-gray-300">{i.mecano_nom}</td>
                          <td className="py-2.5 text-right text-white font-semibold whitespace-nowrap">
                            {formaterArgent(i.prix)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
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
                <Contact size={18} className="text-accent-blue" />
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

function InfoCarte({ icone: Icon, couleur, label, valeur }) {
  return (
    <div className="bg-bg-card rounded-lg p-4 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${couleur}22`, color: couleur }}
      >
        <Icon size={16} />
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-white font-semibold text-sm">{valeur}</div>
      </div>
    </div>
  );
}
