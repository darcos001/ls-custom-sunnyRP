import { File } from 'lucide-react';
import PageAVenir from '../components/PageAVenir.jsx';

export default function Documents() {
  return (
    <PageAVenir
      icone={File}
      titre="Mes documents"
      description="Cette section pourra stocker des fichiers (factures, justificatifs, contrats signés). Dis-moi quel type de documents tu veux y gérer et je la développerai."
    />
  );
}
