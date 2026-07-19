import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { File, CheckCircle2, LogOut } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { appelApi } from './api.js';
import ContratFormatte from './components/ContratFormatte.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Connexion from './pages/Connexion.jsx';
import TableauDeBord from './pages/TableauDeBord.jsx';
import RepasCustom from './pages/RepasCustom.jsx';
import Catalogue from './pages/Catalogue.jsx';
import Employes from './pages/Employes.jsx';
import Profil from './pages/Profil.jsx';
import Clients from './pages/Clients.jsx';
import Contrats from './pages/Contrats.jsx';
import Badgeuse from './pages/Badgeuse.jsx';
import Documents from './pages/Documents.jsx';
import Paie from './pages/Paie.jsx';

function MisePagePrivee({ children }) {
  const { employe, chargement, deconnecter } = useAuth();
  const [contrat, setContrat] = useState(null);
  const [chargementContrat, setChargementContrat] = useState(true);
  const [signatureEnCours, setSignatureEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!employe) return;
    appelApi('/contrat-travail')
      .then(setContrat)
      .catch(() => setContrat(null))
      .finally(() => setChargementContrat(false));
  }, [employe]);

  if (chargement) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;
  }
  if (!employe) {
    return <Navigate to="/connexion" replace />;
  }

  const doitSigner = !employe.est_admin && !chargementContrat && contrat && !contrat.ma_signature;

  if (chargementContrat) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;
  }

  if (doitSigner) {
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

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-10">
        <div className="bg-bg-panel rounded-xl w-full max-w-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-2 text-white font-semibold text-lg">
              <File size={20} className="text-accent-blue" />
              Contrat de travail à signer
            </div>
            <button
              onClick={deconnecter}
              className="flex items-center gap-1 text-gray-400 hover:text-white text-xs font-semibold"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
          <p className="text-sm text-gray-400 no-print">
            Bienvenue {employe.nom_affiche}. Avant d'accéder au site, tu dois lire et signer le contrat de travail ci-dessous.
          </p>
          <div className="max-h-[420px] overflow-y-auto">
            <ContratFormatte contenu={contrat.contenu} />
          </div>
          {erreur && <p className="text-red-400 text-sm no-print">{erreur}</p>}
          <button
            onClick={signer}
            disabled={signatureEnCours}
            className="flex items-center justify-center gap-2 bg-accent-green text-white font-semibold text-sm px-5 py-3 rounded-lg disabled:opacity-60 no-print"
          >
            <CheckCircle2 size={18} />
            {signatureEnCours ? 'Signature...' : "J'ai lu et j'accepte — Signer le contrat"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/" element={<MisePagePrivee><TableauDeBord /></MisePagePrivee>} />
      <Route path="/profil" element={<MisePagePrivee><Profil /></MisePagePrivee>} />
      <Route path="/repas-custom" element={<MisePagePrivee><RepasCustom /></MisePagePrivee>} />
      <Route path="/catalogue" element={<MisePagePrivee><Catalogue /></MisePagePrivee>} />
      <Route path="/clients" element={<MisePagePrivee><Clients /></MisePagePrivee>} />
      <Route path="/employes" element={<MisePagePrivee><Employes /></MisePagePrivee>} />
      <Route path="/contrats" element={<MisePagePrivee><Contrats /></MisePagePrivee>} />
      <Route path="/badgeuse" element={<MisePagePrivee><Badgeuse /></MisePagePrivee>} />
      <Route path="/paie" element={<MisePagePrivee><Paie /></MisePagePrivee>} />
      <Route path="/documents" element={<MisePagePrivee><Documents /></MisePagePrivee>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
