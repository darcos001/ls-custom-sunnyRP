import { useState, useEffect } from 'react';
import { Clock, DollarSign, Hourglass, Users } from 'lucide-react';
import CarteStat from '../components/CarteStat.jsx';
import { appelApi, formaterArgent } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Badgeuse() {
  const { employe } = useAuth();
  const [donnees, setDonnees] = useState(null);
  const [equipe, setEquipe] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    try {
      const mesDonnees = await appelApi('/badgeuse/moi');
      setDonnees(mesDonnees);
      if (employe.est_admin) {
        const donneesEquipe = await appelApi('/badgeuse/equipe');
        setEquipe(donneesEquipe);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  function formaterHeures(h) {
    const heures = Math.floor(h);
    const minutes = Math.round((h - heures) * 60);
    return `${heures}h${minutes.toString().padStart(2, '0')}`;
  }

  function formaterDateHeure(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  if (chargement) {
    return <p className="text-gray-400 text-sm">Chargement...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-gray-400 text-lg">
        Gestion / <span className="text-white font-semibold">Badgeuse</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <CarteStat
          icone={Hourglass}
          couleur="#3b82f6"
          titre="Heures cette semaine"
          valeur={formaterHeures(donnees.heures_semaine)}
        />
        <CarteStat
          icone={DollarSign}
          couleur="#f59e0b"
          titre="À percevoir (semaine)"
          valeur={formaterArgent(donnees.montant_semaine)}
          sousValeur={`${donnees.taux_horaire} $/heure`}
          sousValeurCouleur="#9ca3af"
        />
        <CarteStat
          icone={Hourglass}
          couleur="#a855f7"
          titre="Heures totales"
          valeur={formaterHeures(donnees.heures_total)}
        />
        <CarteStat
          icone={DollarSign}
          couleur="#22c55e"
          titre="À percevoir (total)"
          valeur={formaterArgent(donnees.montant_total)}
        />
      </div>

      <div className="bg-bg-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 text-white font-semibold">
          <Clock size={18} className="text-accent-blue" />
          Mon historique de service
        </div>

        {donnees.sessions.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">Aucune session enregistrée pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                <th className="text-left pb-2 font-medium">Début</th>
                <th className="text-left pb-2 font-medium">Fin</th>
                <th className="text-right pb-2 font-medium">Durée</th>
                <th className="text-right pb-2 font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              {donnees.sessions.map((s) => {
                const debut = new Date(s.debut).getTime();
                const fin = s.fin ? new Date(s.fin).getTime() : Date.now();
                const heures = (fin - debut) / (1000 * 60 * 60);
                return (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 text-gray-300">{formaterDateHeure(s.debut)}</td>
                    <td className="py-2.5 text-gray-300">
                      {s.fin ? (
                        formaterDateHeure(s.fin)
                      ) : (
                        <span className="text-accent-green font-semibold">En cours</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-white">{formaterHeures(heures)}</td>
                    <td className="py-2.5 text-right text-accent-green font-semibold">
                      {formaterArgent(heures * donnees.taux_horaire)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {employe.est_admin && equipe && (
        <div className="bg-bg-panel rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4 text-white font-semibold">
            <Users size={18} className="text-accent-amber" />
            Équipe — heures de service
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                <th className="text-left pb-2 font-medium">Employé</th>
                <th className="text-left pb-2 font-medium">Statut</th>
                <th className="text-right pb-2 font-medium">Heures (semaine)</th>
                <th className="text-right pb-2 font-medium">Montant (semaine)</th>
                <th className="text-right pb-2 font-medium">Heures (total)</th>
                <th className="text-right pb-2 font-medium">Montant (total)</th>
              </tr>
            </thead>
            <tbody>
              {equipe.employes.map((e) => (
                <tr key={e.employe_id} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 text-white font-medium">{e.nom_affiche}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        e.en_service ? 'bg-accent-green/15 text-accent-green' : 'bg-gray-500/15 text-gray-400'
                      }`}
                    >
                      {e.en_service ? 'En service' : 'Hors service'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-gray-300">{formaterHeures(e.heures_semaine)}</td>
                  <td className="py-2.5 text-right text-white font-semibold">{formaterArgent(e.montant_semaine)}</td>
                  <td className="py-2.5 text-right text-gray-300">{formaterHeures(e.heures_total)}</td>
                  <td className="py-2.5 text-right text-white font-semibold">{formaterArgent(e.montant_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
