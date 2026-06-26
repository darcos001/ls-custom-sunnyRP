export default function PageAVenir({ icone: Icon, titre, description }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-gray-400 text-lg">
        Gestion / <span className="text-white font-semibold">{titre}</span>
      </div>
      <div className="bg-bg-panel rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-bg-card flex items-center justify-center text-accent-blue">
          <Icon size={26} />
        </div>
        <h3 className="text-white font-semibold text-lg">{titre}</h3>
        <p className="text-gray-500 text-sm max-w-md">{description}</p>
      </div>
    </div>
  );
}
