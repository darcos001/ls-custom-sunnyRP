import { useState, useEffect } from 'react';
import { Plus, X, ShieldCheck, Trash2 } from 'lucide-react';
import { appelApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Employes() {
  const { employe } = useAuth();
  const [liste, setListe] = useState([]);
  const [grades, setGrades] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modaleOuverte, setModaleOuverte] = useState(false);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    try {
      const [l, g] = await Promise.all([appelApi('/employes'), appelApi('/grades')]);
      setListe(l);
      setGrades(g);
    } finally {
      setChargement(false);
    }
  }

  async function supprimerEmploye(emp) {
    const confirmation = confirm(
      `Supprimer ${emp.nom_affiche} ? Cette action retire aussi tout son historique de réparations/customs et est irréversible.`
    );
    if (!confirmation) return;
    try {
      await appelApi(`/employes/${emp.id}`, { method: 'DELETE' });
      setListe((prev) => prev.filter((e) => e.id !== emp.id));
    } catch (e) {
      alert(e.message);
    }
  }

  if (chargement) return <p className="text-gray-400 text-sm">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Équipe</span>
        </div>
        {employe.est_admin && (
          <button
            onClick={() => setModaleOuverte(true)}
            className="flex items-center gap-2 bg-accent-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            <Plus size={16} />
            Ajouter un employé
          </button>
        )}
      </div>

      <div className="bg-bg-panel rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
              <th className="text-left pb-3 font-medium">Nom</th>
              <th className="text-left pb-3 font-medium">Identifiant</th>
              <th className="text-left pb-3 font-medium">Grade</th>
              <th className="text-left pb-3 font-medium">Commission</th>
              <th className="text-left pb-3 font-medium">Statut</th>
              <th className="text-left pb-3 font-medium">Rôle</th>
              {employe.est_admin && <th className="pb-3"></th>}
            </tr>
          </thead>
          <tbody>
            {liste.map((e) => (
              <tr key={e.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 text-white font-medium">{e.nom_affiche}</td>
                <td className="py-3 text-gray-400 font-mono text-xs">{e.identifiant}</td>
                <td className="py-3">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-md"
                    style={{ backgroundColor: `${e.couleur}22`, color: e.couleur }}
                  >
                    {e.grade_nom}
                  </span>
                </td>
                <td className="py-3 text-gray-300">{e.commission_pourcentage}%</td>
                <td className="py-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      e.en_service ? 'bg-accent-green/15 text-accent-green' : 'bg-gray-500/15 text-gray-400'
                    }`}
                  >
                    {e.en_service ? 'En service' : 'Hors service'}
                  </span>
                </td>
                <td className="py-3">
                  {e.est_admin ? (
                    <span className="flex items-center gap-1 text-accent-amber text-xs font-semibold">
                      <ShieldCheck size={14} /> Admin
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">Employé</span>
                  )}
                </td>
                {employe.est_admin && (
                  <td className="py-3 text-right">
                    {e.id !== employe.id && (
                      <button
                        onClick={() => supprimerEmploye(e)}
                        className="text-gray-500 hover:text-red-400"
                        title="Supprimer cet employé"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modaleOuverte && (
        <ModaleEmploye
          grades={grades}
          surFermer={() => setModaleOuverte(false)}
          surCree={() => {
            setModaleOuverte(false);
            charger();
          }}
        />
      )}
    </div>
  );
}

function ModaleEmploye({ grades, surFermer, surCree }) {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nomAffiche, setNomAffiche] = useState('');
  const [gradeId, setGradeId] = useState(grades[0]?.id || '');
  const [estAdmin, setEstAdmin] = useState(false);
  const [erreur, setErreur] = useState('');

  async function gererSoumission(e) {
    e.preventDefault();
    if (!identifiant || !motDePasse || !nomAffiche || !gradeId) {
      setErreur('Tous les champs sont requis');
      return;
    }
    try {
      await appelApi('/employes', {
        method: 'POST',
        body: JSON.stringify({
          identifiant,
          mot_de_passe: motDePasse,
          nom_affiche: nomAffiche,
          grade_id: Number(gradeId),
          est_admin: estAdmin,
        }),
      });
      surCree();
    } catch (e) {
      setErreur(e.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-panel rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nouvel employé</h2>
          <button onClick={surFermer} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={gererSoumission} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Nom affiché</label>
            <input
              value={nomAffiche}
              onChange={(e) => setNomAffiche(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: jesus rivera"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Identifiant de connexion</label>
            <input
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="ex: jesus.rivera"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Grade</label>
            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom} ({g.commission_pourcentage}%)
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={estAdmin} onChange={(e) => setEstAdmin(e.target.checked)} />
            Donner les droits administrateur
          </label>
          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}
          <button type="submit" className="bg-accent-blue text-white font-semibold py-2.5 rounded-lg text-sm mt-1">
            Créer l'employé
          </button>
        </form>
      </div>
    </div>
  );
}
