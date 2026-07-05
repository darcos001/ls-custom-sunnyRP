import { useState, useEffect } from 'react';
import { X, Car } from 'lucide-react';
import { appelApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Catalogue() {
  const { employe } = useAuth();
  const [marques, setMarques] = useState([]);
  const [nouvelleMarque, setNouvelleMarque] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    chargerMarques();
  }, []);

  async function chargerMarques() {
    setChargement(true);
    try {
      const data = await appelApi('/marques');
      setMarques(data);
    } finally {
      setChargement(false);
    }
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Catalogue</span>
        </div>
      </div>

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
        {chargement ? (
          <p className="text-gray-400 text-sm">Chargement...</p>
        ) : marques.length === 0 ? (
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
    </div>
  );
}
