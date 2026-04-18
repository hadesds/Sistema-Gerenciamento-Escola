"use client";

import { useState } from "react";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const EVENT_DAYS = [16, 18, 22, 25];

const events = [
  { day: 16, month: "Abr", title: "Prova de Matemática", meta: "8º Ano — Cap. 4 e 5",      type: "Prova",  dotColor: "#f59e0b", badgeBg: "rgba(245,158,11,0.15)",  badgeColor: "#f59e0b" },
  { day: 18, month: "Abr", title: "Entrega: Redação",    meta: "Português — Prof. Ana Lima", type: "Tarefa", dotColor: "#3b82f6", badgeBg: "rgba(59,130,246,0.15)",  badgeColor: "#3b82f6" },
  { day: 22, month: "Abr", title: "Reunião de Pais",     meta: "19h — Auditório",            type: "Evento", dotColor: "#10b981", badgeBg: "rgba(16,185,129,0.15)", badgeColor: "#10b981" },
  { day: 25, month: "Abr", title: "Gincana Escolar",     meta: "Todos os alunos — Quadra",   type: "Evento", dotColor: "#8b5cf6", badgeBg: "rgba(139,92,246,0.15)", badgeColor: "#8b5cf6" },
];

export default function CalendarSection() {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevDays    = new Date(viewYear, viewMonth, 0).getDate();
  const trailing    = (firstDay + daysInMonth) % 7 === 0 ? 0 : 7 - ((firstDay + daysInMonth) % 7);

  type Day = { num: number; curr: boolean; isToday: boolean; hasEvent: boolean };
  const days: Day[] = [];
  for (let i = 0; i < firstDay; i++)
    days.push({ num: prevDays - firstDay + 1 + i, curr: false, isToday: false, hasEvent: false });
  for (let d = 1; d <= daysInMonth; d++)
    days.push({ num: d, curr: true,
      isToday: d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear(),
      hasEvent: EVENT_DAYS.includes(d) && viewMonth === today.getMonth() });
  for (let i = 1; i <= trailing; i++)
    days.push({ num: i, curr: false, isToday: false, hasEvent: false });

  return (
    <section id="calendario" className="bg-gradient-to-br from-dark to-dark-2 text-white relative overflow-hidden px-[5%] py-16 md:py-20">
      <div className="absolute w-[50rem] h-[50rem] rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.1)_0%,transparent_70%)] -top-40 -right-40 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Esquerda */}
        <div>
          <span className="inline-block bg-[rgba(245,166,35,0.2)] text-secondary px-4 py-1 rounded-full font-bold text-[1.1rem] uppercase tracking-widest mb-4">
            Calendário
          </span>
          <h2 className="font-sora text-[clamp(2rem,4vw,2.8rem)] font-bold text-white mb-3 leading-tight">
            Organize sua rotina escolar
          </h2>
          <p className="text-white/60 text-[1.5rem] max-w-[54rem] leading-relaxed mb-8">
            Veja provas, atividades e eventos do mês. Nunca mais esqueça uma data importante.
          </p>

          <div className="fade-in bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <span className="font-sora font-bold text-[1.4rem] text-white">{MONTHS[viewMonth]} {viewYear}</span>
              <div className="flex gap-3">
                {([["‹", prev], ["›", next]] as [string, () => void][]).map(([label, fn]) => (
                  <button key={label} onClick={fn}
                    className="w-[3.2rem] h-[3.2rem] rounded-xl bg-white/10 border-none text-white cursor-pointer text-[1.8rem] flex items-center justify-center transition-colors hover:bg-[rgba(245,166,35,0.3)]">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["D","S","T","Q","Q","S","S"].map((d, i) => (
                <div key={i} className="text-center text-[1rem] font-bold text-white/40 uppercase py-1">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => (
                <div key={i}
                  className={`aspect-square flex items-center justify-center rounded-xl text-[1.2rem] font-semibold cursor-pointer transition-all relative
                    ${!d.curr ? "opacity-25 text-white/60" : "text-white/60 hover:bg-white/10 hover:text-white"}
                    ${d.isToday ? "!bg-primary !text-white font-extrabold shadow-[0_0.4rem_1.2rem_rgba(245,166,35,0.4)]" : ""}`}>
                  {d.num}
                  {d.hasEvent && <span className="absolute bottom-1 w-[0.4rem] h-[0.4rem] rounded-full bg-secondary" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direita — eventos */}
        <div className="fade-in flex flex-col gap-4">
          <h3 className="font-sora font-bold text-white mb-2 text-[1.8rem]">Próximos eventos</h3>
          {events.map((ev) => (
            <div key={ev.title}
              className="bg-white/5 border border-white/[0.08] rounded-[1.2rem] px-5 py-4 flex items-center gap-4 transition-colors hover:bg-white/10">
              <div className="min-w-[4rem] text-center">
                <div className="font-sora text-[2rem] font-bold text-primary leading-none">{ev.day}</div>
                <div className="text-[1rem] font-bold uppercase text-white/40">{ev.month}</div>
              </div>
              <div className="w-[0.2rem] h-[3.6rem] rounded-sm shrink-0" style={{ background: ev.dotColor }} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[1.3rem] text-white mb-[0.2rem] truncate">{ev.title}</div>
                <div className="text-[1.1rem] text-white/50 truncate">{ev.meta}</div>
              </div>
              <span className="text-[1rem] font-bold px-3 py-1 rounded-full shrink-0"
                style={{ background: ev.badgeBg, color: ev.badgeColor }}>{ev.type}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
