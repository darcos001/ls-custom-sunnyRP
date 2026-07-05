import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Car, Package, DollarSign, TrendingUp, History, Paintbrush } from 'lucide-react';
import CarteStat from '../components/CarteStat.jsx';
import { appelApi, formaterArgent, formaterDate } from '../api.js';

export default function TableauDeBord() {
  const [stats, setStats] = useState(null);
  const [dernieresReparations, setDernieresReparations] = useState([]);
  const [derniersCustoms, setDerniersCustoms] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      const [s, reparations, customs] = await Promise.all([
        appelApi('/interventions/stats/semaine'),
        appelApi('/interventions?type=reparation&tri=recents'),
        appelApi('/interventions?type=custom&tri=recents'),
      ]);
      setStats(s);
      setDernieresReparations(reparations.slice(0, 5));
      setDerniersCustoms(customs.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  }

  if (chargement) {
    return <div className="text-gray-400 text-sm">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <CarteStat icone={Wrench} couleur="#3b82f6" titre="Réparations (Semaine)" valeur={stats.reparations_count} />
        <CarteStat icone={Car} couleur="#22c55e" titre="Customs (Semaine)" valeur={stats.customs_count} />
        <CarteStat icone={Package} couleur="#f59e0b" titre="Kits de réparation (Semaine)" valeur={stats.kits_count} />
        <CarteStat icone={DollarSign} couleur="#f59e0b" titre="CA Semaine" valeur={formaterArgent(stats.ca_total)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <CarteStat
          icone={TrendingUp}
          couleur="#22c55e"
          titre="Bénéfice Customs"
          valeur={formaterArgent(stats.customs_benefice)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <History size={18} className="text-accent-blue" />
              Dernières Réparations
            </div>
            <Link
              to="/repas-custom"
              className="text-xs font-semibold text-accent-blue border border-accent-blue/40 rounded-md px-3 py-1.5"
            >
              Voir tout
            </Link>
          </div>
          <TableauInterventions lignes={dernieresReparations} type="reparation" />
        </div>

        <div className="bg-bg-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Paintbrush size={18} className="text-accent-green" />
              Derniers Customs
            </div>
            <Link
              to="/repas-custom"
              className="text-xs font-semibold text-accent-green border border-accent-green/40 rounded-md px-3 py-1.5"
            >
              Voir tout
            </Link>
          </div>
          <TableauInterventions lignes={derniersCustoms} type="custom" />
        </div>
      </div>
    </div>
  );
}

function TableauInterventions({ lignes, type }) {
  if (lignes.length === 0) {
    return <p className="text-gray-500 text-sm py-6 text-center">Aucune intervention pour le moment.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
          <th className="text-left pb-2 font-medium">Date</th>
          <th className="text-left pb-2 font-medium">Mécano</th>
          {type === 'reparation' ? (
            <th className="text-left pb-2 font-medium">Type</th>
          ) : (
            <th className="text-left pb-2 font-medium">Bénéfice</th>
          )}
          {type === 'reparation' && <th className="text-right pb-2 font-medium">Prix</th>}
        </tr>
      </thead>
      <tbody>
        {lignes.map((ligne) => (
          <tr key={ligne.id} className="border-b border-white/5 last:border-0">
            <td className="py-3 text-gray-300">{formaterDate(ligne.date_creation)}</td>
            <td className="py-3 text-gray-300">{ligne.mecano_nom}</td>
            {type === 'reparation' ? (
              <td className="py-3">
                <span className="bg-accent-blue/15 text-accent-blue text-xs font-semibold px-2.5 py-1 rounded-md">
                  {ligne.nom_prestation}
                </span>
              </td>
            ) : (
              <td className="py-3 text-accent-green font-semibold">+{formaterArgent(ligne.benefice)}</td>
            )}
            {type === 'reparation' && (
              <td className="py-3 text-right text-white font-semibold">{formaterArgent(ligne.prix)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
