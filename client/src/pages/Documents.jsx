import { useState, useEffect } from 'react';
import { CheckCircle2, Pencil, X, Users } from 'lucide-react';
import { appelApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ContratFormatte from '../components/ContratFormatte.jsx';

export default function Documents() {
  const { employe } = useAuth();
  const [contrat, setContrat] = useState(null);
  const [signatures, setSignatures] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [modaleEditionOuverte, setModaleEditionOuverte] = useState(false);
  const [signatureEnCours, setSignatureEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    try {
      const c = await appelApi('/contrat-travail');
      setContrat(c);
      if (employe.est_admin) {
        const s = await appelApi('/contrat-travail/signatures');
        setSignatures(s);
      }
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function signer() {
    setSignatureEnCours(true);
    setErreur('');
    try {
      const r = await appelApi('/contrat-travail/signer', { method: 'POST' });
      setContrat((c) => ({ ...c, ma_signature: { date_signature: r.date_signature } }));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setSignatureEnCours(false);
    }
  }

  function formaterDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (chargement) return <p className="text-gray-400 text-sm">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Mes documents</span>
        </div>
        {employe.est_admin && (
          <button
            onClick={() => setModaleEditionOuverte(true)}
            className="flex items-center gap-2 bg-bg-card text-white text-sm font-semibold px-4 py-2.5 rounded-lg border border-white/10"
          >
            <Pencil size={16} />
            Modifier le contrat
          </button>
        )}
      </div>

      <div className="bg-bg-panel rounded-xl p-6">
        <ContratFormatte contenu={contrat.contenu} />

        {erreur && <p className="text-red-400 text-sm mt-3 no-print">{erreur}</p>}

        <div className="mt-5 no-print">
          {contrat.ma_signature ? (
            <div className="flex items-center gap-2 bg-accent-green/10 text-accent-green text-sm font-semibold px-4 py-3 rounded-lg">
              <CheckCircle2 size={18} />
              Tu as signé ce contrat le {formaterDate(contrat.ma_signature.date_signature)}
            </div>
          ) : (
            <button
              onClick={signer}
              disabled={signatureEnCours}
              className="bg-accent-green text-white font-semibold text-sm px-5 py-3 rounded-lg disabled:opacity-60"
            >
              {signatureEnCours ? 'Signature...' : "J'ai lu et j'accepte — Signer le contrat"}
            </button>
          )}
        </div>
      </div>

      {employe.est_admin && signatures && (
        <div className="bg-bg-panel rounded-xl p-5 no-print">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-accent-blue" />
            <h3 className="text-white font-semibold">Suivi des signatures (version {signatures.version})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                <th className="text-left pb-3 font-medium">Employé</th>
                <th className="text-left pb-3 font-medium">Statut</th>
                <th className="text-left pb-3 font-medium">Date de signature</th>
              </tr>
            </thead>
            <tbody>
              {signatures.employes.map((s) => (
                <tr key={s.employe_id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-white font-medium">{s.nom_affiche}</td>
                  <td className="py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        s.a_signe ? 'bg-accent-green/15 text-accent-green' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {s.a_signe ? 'Signé' : 'Non signé'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">{s.date_signature ? formaterDate(s.date_signature) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modaleEditionOuverte && (
        <ModaleEditionContrat
          contenuActuel={contrat.contenu}
          surFermer={() => setModaleEditionOuverte(false)}
          surEnregistre={() => {
            setModaleEditionOuverte(false);
            charger();
          }}
        />
      )}
    </div>
  );
}

function ModaleEditionContrat({ contenuActuel, surFermer, surEnregistre }) {
  const [contenu, setContenu] = useState(contenuActuel);
  const [erreur, setErreur] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function enregistrer() {
    if (!contenu.trim()) {
      setErreur('Le contrat ne peut pas être vide');
      return;
    }
    setEnvoiEnCours(true);
    setErreur('');
    try {
      await appelApi('/contrat-travail', { method: 'PUT', body: JSON.stringify({ contenu }) });
      surEnregistre();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-panel rounded-xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Modifier le contrat de travail</h2>
          <button onClick={surFermer} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-accent-amber bg-accent-amber/10 rounded-lg px-3 py-2 mb-4">
          ⚠️ Modifier le contrat annule toutes les signatures existantes : chaque employé devra resigner la nouvelle version. Astuce : structure ton texte avec des lignes "Article 1 — Titre" suivies du paragraphe pour garder la mise en forme automatique.
        </p>
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={16}
          className="w-full flex-1 bg-bg-input rounded-lg px-4 py-3 text-sm text-white border border-white/10 resize-none font-mono"
        />
        {erreur && <p className="text-red-400 text-sm mt-2">{erreur}</p>}
        <button
          onClick={enregistrer}
          disabled={envoiEnCours}
          className="bg-accent-blue text-white font-semibold py-2.5 rounded-lg text-sm mt-4 disabled:opacity-60"
        >
          {envoiEnCours ? 'Enregistrement...' : 'Enregistrer et invalider les signatures'}
        </button>
      </div>
    </div>
  );
}
