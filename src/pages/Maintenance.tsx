export default function Maintenance() {
  return (
    <div className="text-slate-200 antialiased flex flex-col items-center justify-center p-6 min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="text-center w-full max-w-lg flex-1 flex items-center justify-center">
        <div className="w-[90vw] max-w-96 h-auto mx-auto overflow-hidden animate-bounce">
          <div className="text-4xl">🚧</div>
          <h1 className="text-2xl mt-4 font-bold text-white">Estamos em Manutenção</h1>
        </div>
      </div>
      <footer className="text-center py-4">
        <a href="#" className="text-slate-500 text-sm hover:text-orange-500 transition-colors">
          Feito com <span className="text-red-500">♥</span> por <span className="font-semibold">Dev Saimon</span>
        </a>
      </footer>
    </div>
  );
}
