import { Wrench, Printer } from 'lucide-react';

// Découpe le texte brut du contrat en blocs : articles ("Article N — Titre" + corps) ou paragraphes simples
function parserContrat(texte) {
  return texte
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((bloc) => {
      const lignes = bloc.split('\n');
      const matchTitre = lignes[0].match(/^Article\s+(\d+)\s*[—-]\s*(.+)$/);
      if (matchTitre) {
        return {
          type: 'article',
          numero: matchTitre[1],
          titre: matchTitre[2],
          corps: lignes.slice(1).join(' ').trim(),
        };
      }
      const estMention = /^Fait (sur|à)/i.test(bloc);
      return { type: estMention ? 'mention' : 'paragraphe', texte: bloc };
    });
}

export default function ContratFormatte({ contenu, surImprimer }) {
  const blocs = parserContrat(contenu || '');

  function imprimer() {
    if (surImprimer) surImprimer();
    window.print();
  }

  return (
    <div className="contrat-formate">
      <div className="flex items-center justify-end mb-3 no-print">
        <button
          onClick={imprimer}
          className="flex items-center gap-2 bg-bg-card text-white text-xs font-semibold px-3 py-2 rounded-lg border border-white/10"
        >
          <Printer size={14} />
          Imprimer / Télécharger en PDF
        </button>
      </div>

      <div className="contrat-papier bg-white rounded-lg overflow-hidden">
        <div className="contrat-bandeau bg-[#0f172a] px-6 py-5">
          <div className="flex items-center gap-2">
            <Wrench size={22} className="text-[#3b82f6]" />
            <span className="text-2xl font-extrabold">
              <span className="text-[#3b82f6]">LS </span>
              <span className="text-[#d97706]">CUSTOM</span>
            </span>
          </div>
          <div className="text-[#cbd5e1] text-xs tracking-wide mt-1">LOS SANTOS CUSTOM — SERVEUR SUNNY RP</div>
        </div>

        <div className="px-8 py-8">
          <h1 className="text-center text-2xl font-extrabold text-gray-900">CONTRAT DE TRAVAIL</h1>
          <p className="text-center text-gray-500 italic text-sm mt-1 mb-8">Mécanicien — Garage Los Santos Custom</p>

          <div className="flex flex-col gap-1">
            {blocs.map((bloc, i) => {
              if (bloc.type === 'article') {
                return (
                  <div key={i} className="mt-6">
                    <div className="flex items-baseline gap-2 border-b border-gray-200 pb-2 mb-3">
                      <span className="text-[#1d4ed8] font-bold text-[15px]">Article {bloc.numero} —</span>
                      <span className="text-gray-900 font-bold text-[15px]">{bloc.titre}</span>
                    </div>
                    {bloc.corps && (
                      <p className="text-gray-600 text-sm leading-relaxed text-justify">{bloc.corps}</p>
                    )}
                  </div>
                );
              }
              if (bloc.type === 'mention') {
                return (
                  <p key={i} className="text-center text-gray-500 italic text-xs mt-10">
                    {bloc.texte}
                  </p>
                );
              }
              return (
                <p key={i} className="text-gray-600 text-sm leading-relaxed text-justify">
                  {bloc.texte}
                </p>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-6 mt-10 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-r border-gray-200">
              <div className="text-xs font-bold text-gray-900">Nom du personnage (RP)</div>
              <div className="h-8" />
            </div>
            <div className="bg-gray-100 px-4 py-3">
              <div className="text-xs font-bold text-gray-900">Grade au moment de la signature</div>
              <div className="h-8" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mt-14">
            <div className="border-t border-gray-400 pt-1 text-xs text-gray-500 italic">Signature de l'employé</div>
            <div className="border-t border-gray-400 pt-1 text-xs text-gray-500 italic">Signature de la direction (LS Custom)</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .contrat-formate, .contrat-formate * { visibility: visible; }
          .contrat-formate { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          .contrat-papier { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
