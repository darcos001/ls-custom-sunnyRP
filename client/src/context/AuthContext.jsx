import { createContext, useContext, useState, useEffect } from 'react';
import { appelApi } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [employe, setEmploye] = useState(null);
  const [token, setToken] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const tokenSauve = localStorage.getItem('ls_token');
    const employeSauve = localStorage.getItem('ls_employe');
    if (tokenSauve && employeSauve) {
      setToken(tokenSauve);
      setEmploye(JSON.parse(employeSauve));
    }
    setChargement(false);
  }, []);

  function connecter(nouveauToken, nouvelEmploye) {
    localStorage.setItem('ls_token', nouveauToken);
    localStorage.setItem('ls_employe', JSON.stringify(nouvelEmploye));
    setToken(nouveauToken);
    setEmploye(nouvelEmploye);
  }

  async function deconnecter() {
    try {
      await appelApi('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ employe_id: employe?.id }),
      });
    } catch (e) {
      // pas grave si ça échoue, on déconnecte localement quand même
    }
    localStorage.removeItem('ls_token');
    localStorage.removeItem('ls_employe');
    setToken(null);
    setEmploye(null);
  }

  return (
    <AuthContext.Provider value={{ employe, token, chargement, connecter, deconnecter, setEmploye }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
