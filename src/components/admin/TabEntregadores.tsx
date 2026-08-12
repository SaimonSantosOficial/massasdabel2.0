import React, { useState, useEffect } from 'react';
import { db, ROOT } from '../../lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { emailKey } from '../../lib/utils';
import { CheckCircle, Clock, ShieldCheck, Mail } from 'lucide-react';

export default function TabEntregadores() {
  const [autorizados, setAutorizados] = useState<any>({});
  const [pendentes, setPendentes] = useState<any>({});
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');

  useEffect(() => {
    const refAuth = ref(db, `${ROOT}/entregadoresAutorizados`);
    const refPend = ref(db, `${ROOT}/pendingEntregadores`);

    const unsubAuth = onValue(refAuth, s => setAutorizados(s.val() || {}));
    const unsubPend = onValue(refPend, s => setPendentes(s.val() || {}));

    return () => { unsubAuth(); unsubPend(); };
  }, []);

  const handleAddAut = () => {
    if (!email || !nome) return;
    const ek = emailKey(email);
    set(ref(db, `${ROOT}/entregadoresAutorizados/${ek}`), {
      email, nome, ativo: true, createdAt: Date.now()
    });
    setEmail(''); setNome('');
  };

  const handleApprove = (uid: string, vEmail: string) => {
    const ek = emailKey(vEmail);
    update(ref(db), {
      [`${ROOT}/roles/${uid}`]: 'entregador',
      [`${ROOT}/pendingEntregadores/${uid}`]: null,
      [`${ROOT}/entregadoresAutorizados/${ek}/registeredUid`]: uid
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white">Entregadores</h2>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-orange-500" /> Autorizar novo e-mail</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="E-mail do entregador" className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500" />
          <input value={nome} onChange={e=>setNome(e.target.value)} type="text" placeholder="Nome" className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500" />
        </div>
        <button onClick={handleAddAut} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl">Adicionar à lista</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-cyan-400" /> Autorizados</h3>
          <div className="space-y-3">
            {Object.keys(autorizados).length === 0 && <p className="text-slate-500 text-sm">Nenhum e-mail autorizado.</p>}
            {Object.keys(autorizados).map(k => {
              const a = autorizados[k];
              return (
                <div key={k} className="bg-slate-900 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-slate-200 font-semibold text-sm">{a.email}</p>
                    <p className="text-xs text-slate-500">{a.nome}</p>
                  </div>
                  {a.registeredUid ? <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">Cadastrado</span> : <span className="text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded">Aguardando</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Cadastros pendentes</h3>
          <div className="space-y-3">
            {Object.keys(pendentes).length === 0 && <p className="text-slate-500 text-sm">Nenhum cadastro pendente.</p>}
            {Object.keys(pendentes).map(uid => {
              const p = pendentes[uid];
              return (
                <div key={uid} className="bg-slate-900 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="font-bold text-white">{p.nome}</p>
                    <p className="text-sm text-slate-400">{p.email}</p>
                  </div>
                  <button onClick={() => handleApprove(uid, p.email)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-sm shrink-0">
                    Aprovar Acesso
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
