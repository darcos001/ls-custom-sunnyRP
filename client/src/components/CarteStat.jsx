export default function CarteStat({ icone: Icon, couleur, titre, valeur, sousValeur, sousValeurCouleur }) {
  return (
    <div className="bg-bg-card rounded-xl p-5 flex flex-col gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${couleur}22`, color: couleur }}
      >
        <Icon size={20} />
      </div>
      <div>
        <div className="text-gray-400 text-sm mb-1">{titre}</div>
        <div className="text-2xl font-bold text-white">{valeur}</div>
        {sousValeur && (
          <div className="text-sm mt-1" style={{ color: sousValeurCouleur || '#22c55e' }}>
            {sousValeur}
          </div>
        )}
      </div>
    </div>
  );
}
