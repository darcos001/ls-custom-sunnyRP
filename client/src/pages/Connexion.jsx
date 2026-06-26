import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { appelApi } from '../api.js';

export default function Connexion() {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiEnCours(true);
    try {
      const reponse = await appelApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifiant, mot_de_passe: motDePasse }),
      });
      connecter(reponse.token, reponse.employe);
      navigate('/');
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mb-4 ring-1 ring-white/10">
            <Wrench className="text-amber-400" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-accent-blue tracking-wide">LS CUSTOM</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des réparations & customs</p>
        </div>

        <form onSubmit={gererSoumission} className="bg-bg-panel rounded-xl p-6 flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Identifiant</label>
            <input
              type="text"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-4 py-2.5 text-white text-sm border border-white/10"
              placeholder="ton.identifiant"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full bg-bg-input rounded-lg px-4 py-2.5 text-white text-sm border border-white/10"
              placeholder="••••••••"
              required
            />
          </div>

          {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

          <button
            type="submit"
            disabled={envoiEnCours}
            className="mt-2 flex items-center justify-center gap-2 bg-accent-blue hover:bg-blue-600 transition-colors text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-60"
          >
            <LogIn size={16} />
            {envoiEnCours ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          Pas de compte ? Demande à un administrateur de t'en créer un.
        </p>
      </div>
    </div>
  );
}
