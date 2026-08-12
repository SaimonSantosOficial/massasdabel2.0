import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Pedido } from '../../types';
import { formatMoney } from '../../lib/utils';
import { FileDown } from 'lucide-react';

export default function TabDashboard({ pedidos, clientesCount = 0 }: { pedidos: Record<string, Pedido>; clientesCount?: number }) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const getDashboardRange = () => {
    const now = new Date();
    let start, end, label;
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
    const fmtShort = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

    if (period === 'day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = fmt(now);
    } else if (period === 'week') {
      const daysFromMonday = (now.getDay() + 6) % 7;
      start = new Date(now);
      start.setDate(now.getDate() - daysFromMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      label = `${fmtShort(start)} – ${fmt(end)}`;
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    return { start: start.getTime(), end: end.getTime(), label };
  };

  const range = getDashboardRange();
  
  const pedidosInRange = Object.values(pedidos).filter(p => {
    const c = p.createdAt || 0;
    return c >= range.start && c <= range.end;
  });

  let faturamento = 0;
  let entregues = 0;
  let pedidosCount = 0;
  let cancelados = 0;

  pedidosInRange.forEach(p => {
    if (p.status === 'cancelado') {
      cancelados++;
      return;
    }
    pedidosCount++;
    if (p.status === 'entregue') {
      entregues++;
      faturamento += (Number(p.subtotal) || 0) + (Number(p.taxa) || 0);
    }
  });

  const ticket = entregues > 0 ? faturamento / entregues : 0;

  const gerarPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(249, 115, 22);
    doc.text('Massas da Bel', 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Relatório de Pedidos (${range.label})`, 15, 28);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 33);

    const rows = pedidosInRange
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map(p => {
        const total = (Number(p.subtotal) || 0) + (Number(p.taxa) || 0);
        return [
          p.codigo ? `#${p.codigo}` : '—',
          p.cliente || '—',
          p.bairro || '—',
          p.status || '—',
          p.pagamento || '—',
          `R$ ${total.toFixed(2).replace('.', ',')}`,
          p.createdAt ? new Date(p.createdAt).toLocaleString('pt-BR') : '—'
        ];
      });

    autoTable(doc, {
      startY: 40,
      head: [['Código', 'Cliente', 'Bairro', 'Status', 'Pag', 'Total', 'Data']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Resumo Geral', 15, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Pedidos entregues: ${entregues}`, 15, finalY + 8);
    doc.text(`Pedidos cancelados: ${cancelados}`, 15, finalY + 14);
    doc.text(`Faturamento: ${formatMoney(faturamento)}`, 15, finalY + 20);
    doc.text(`Ticket médio: ${formatMoney(ticket)}`, 15, finalY + 26);

    doc.save(`relatorio-massas-da-bel-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Dashboard</h2>
          <p className="text-slate-400 text-sm">Faturamento e volume de pedidos por período.</p>
        </div>
        <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-800 border border-slate-700">
          {(['day', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${period === p ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
          <button onClick={gerarPDF} className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Gerar PDF
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">Período: <span className="text-white font-bold">{range.label}</span></p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-orange-500/20 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm font-semibold">Faturamento (Entregues)</p>
          <p className="text-4xl font-extrabold text-orange-500 mt-2">{formatMoney(faturamento)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-sm font-semibold">Total de Pedidos Válidos</p>
          <p className="text-4xl font-extrabold text-white mt-2">{pedidosCount}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-sm font-semibold">Contas Criadas</p>
          <p className="text-4xl font-extrabold text-amber-500 mt-2">{clientesCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Entregues</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{entregues}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ticket médio</p>
          <p className="text-2xl font-extrabold text-slate-200 mt-1">{formatMoney(ticket)}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cancelados</p>
          <p className="text-2xl font-extrabold text-slate-500 mt-1">{cancelados}</p>
        </div>
      </div>
    </div>
  );
}
