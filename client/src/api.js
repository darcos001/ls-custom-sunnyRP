// Adresse du serveur backend (à adapter si tu changes d'hébergeur ou de domaine)
const API_BASE = 'https://ls-custom-sunnyrp-production.up.railway.app/api';

export async function appelApi(chemin, options = {}) {
  const token = localStorage.getItem('ls_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const reponse = await fetch(`${API_BASE}${chemin}`, { ...options, headers });

  if (reponse.status === 401) {
    // Token invalide, expiré, ou sessions réinitialisées (ex: changement de JWT_SECRET).
    // On nettoie le token puis on recharge la page ACTUELLE (pas une nouvelle URL) :
    // ça évite de dépendre de la config du serveur statique pour une route directe,
    // et l'app elle-même (React Router) redirigera vers /connexion une fois le token absent.
    const dejaEnCours = sessionStorage.getItem('ls_redirection_en_cours');
    localStorage.removeItem('ls_token');
    localStorage.removeItem('ls_employe');
    if (!dejaEnCours) {
      sessionStorage.setItem('ls_redirection_en_cours', '1');
      window.location.reload();
    }
    throw new Error('Session expirée, reconnecte-toi');
  }

  const donnees = await reponse.json().catch(() => ({}));

  if (!reponse.ok) {
    throw new Error(donnees.erreur || 'Une erreur est survenue');
  }
  return donnees;
}

export function formaterArgent(montant) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(montant || 0) + ' $';
}

export function formaterDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
