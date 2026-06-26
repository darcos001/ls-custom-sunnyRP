import { Clock } from 'lucide-react';
import PageAVenir from '../components/PageAVenir.jsx';

export default function Badgeuse() {
  return (
    <PageAVenir
      icone={Clock}
      titre="Badgeuse"
      description="Cette section pourra suivre les heures de service de chaque employé (prise/fin de service, durée totale). Le bouton 'Prise de service' du header enregistre déjà le statut — on peut construire l'historique complet ensuite."
    />
  );
}
