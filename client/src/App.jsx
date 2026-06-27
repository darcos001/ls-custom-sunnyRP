import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
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
  const { employe, chargement } = useAuth();

  if (chargement) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;
  }
  if (!employe) {
    return <Navigate to="/connexion" replace />;
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
