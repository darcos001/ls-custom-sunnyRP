import { useState, useEffect } from 'react';
import { Receipt, Plus, X, Trash2, Download } from 'lucide-react';
import { appelApi, formaterArgent } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Depenses() {
  const { employe } = useAuth();
  const [depenses, setDepenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [modaleOuverte, setModaleOuverte] = useState(false);

  useEffect(() => {
    if (employe?.est_admin) charger();
  }, [employe]);

  function charger() {
    setChargement(true);
    appelApi('/depenses')
      .then((d) => {
        setDepenses(d.depenses);
        setTotal(d.total);
      })
      .finally(() => setChargement(false));
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette dépense ?')) return;
    await appelApi(`/depenses/${id}`, { method: 'DELETE' });
    charger();
  }

  function formaterDate(iso) {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function exporterCSV() {
    const entetes = ['Date', 'Description', 'Catégorie', 'Montant', 'Enregistré par'];
    const echapper = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lignesCSV = depenses.map((d) => [
      formaterDate(d.date_creation), d.description, d.categorie || '', d.montant, d.employe_nom || '',
    ].map(echapper).join(';'));
    const contenu = [entetes.join(';'), ...lignesCSV].join('\n');
    const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `depenses_${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  if (!employe?.est_admin) {
    return <p className="text-gray-400 text-sm">Cette page est réservée aux administrateurs.</p>;
  }

  if (chargement) return <p className="text-gray-400 text-sm">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Dépenses</span>
        </div>
        <div className="flex gap-3">
          {depenses.length > 0 && (
            <button
              onClick={exporterCSV}
              className="flex items-center gap-2 bg-bg-card text-gray-300 text-sm font-semibold px-4 py-2.5 rounded-lg border border-white/10"
            >
              <Download size={16} />
              Exporter en CSV
            </button>
          )}
          <button
            onClick={() => setModaleOuverte(true)}
            className="flex items-center gap-2 bg-accent-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            <Plus size={16} />
            Nouvelle dépense
          </button>
        </div>
      </div>

      <div className="bg-bg-panel rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Receipt size={18} className="text-red-400" />
            Total des dépenses
          </div>
          <span className="text-2xl font-bold text-red-400">{formaterArgent(total)}</span>
        </div>
        <p className="text-gray-500 text-xs mt-1">
          Achats, avances, matériel divers — tout ce qui sort de la caisse du garage.
        </p>
      </div>

      <div className="bg-bg-panel rounded-xl p-5 overflow-x-auto">
        {depenses.length === 0 ? (
          <p className="text-gray-500 text-sm py-10 text-center">Aucune dépense enregistrée pour l'instant.</p>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                <th className="text-left pb-3 font-medium">Date</th>
                <th className="text-left pb-3 font-medium">Description</th>
                <th className="text-left pb-3 font-medium">Catégorie</th>
                <th className="text-left pb-3 font-medium">Enregistré par</th>
                <th className="text-right pb-3 font-medium">Montant</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {depenses.map((d) => (
                <tr key={d.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-gray-300 whitespace-nowrap">{formaterDate(d.date_creation)}</td>
                  <td className="py-3 text-white">{d.description}</td>
                  <td className="py-3 text-gray-400">{d.categorie || '—'}</td>
                  <td className="py-3 text-gray-400">{d.employe_nom || '—'}</td>
                  <td className="py-3 text-right text-red-400 font-semibold whitespace-nowrap">
                    -{formaterArgent(d.montant)}
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => supprimer(d.id)} className="text-gray-500 hover:text-red-400" title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modaleOuverte && (
        <ModaleDepense
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

function ModaleDepense({ surFermer, surCree }) {
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function enregistrer(e) {
    e.preventDefault();
    if (!description.trim() || !montant) {
      setErreur('Description et montant sont obligatoires');
      return;
    }
    setEnvoiEnCours(true);
    setErreur('');
    try {
      await appelApi('/depenses', {
        method: 'POST',
        body: JSON.stringify({ description, montant: Number(montant), categorie: categorie || null }),
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
      <div className="bg-bg-panel rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nouvelle dépense</h2>
          <button onClick={surFermer} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={enregistrer} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Description *</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: Achat de pièces détachées" autoFocus />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Montant ($) *</label>
            <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: 500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Catégorie (optionnel)</label>
            <input value={categorie} onChange={(e) => setCategorie(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-3 py-2.5 text-sm text-white border border-white/10"
              placeholder="Ex: Matériel, Avance employé, Décoration..." />
          </div>
          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}
          <button type="submit" disabled={envoiEnCours}
            className="bg-accent-blue text-white font-semibold py-2.5 rounded-lg text-sm mt-1 disabled:opacity-60">
            {envoiEnCours ? 'Enregistrement...' : 'Enregistrer la dépense'}
          </button>
        </form>
      </div>
    </div>
  );
}
