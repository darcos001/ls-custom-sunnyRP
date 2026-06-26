import { FileText } from 'lucide-react';
import PageAVenir from '../components/PageAVenir.jsx';

export default function Contrats() {
  return (
    <PageAVenir
      icone={FileText}
      titre="Contrats"
      description="Cette section pourra gérer les contrats d'embauche et les accords avec les clients. Dis-moi ce que tu veux y mettre exactement et je la développerai."
    />
  );
}
