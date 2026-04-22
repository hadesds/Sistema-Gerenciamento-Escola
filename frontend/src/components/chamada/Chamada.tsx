"use client";

import { useState } from "react";

interface Aluno {
  id: number;
  nome: string;
}

interface Props {
  turma: string;
  alunos: Aluno[];
}

type StatusMap = Record<number, boolean | null>;

export default function Chamada({ turma, alunos }: Props) {
  const [status, setStatus] = useState<StatusMap>(
    Object.fromEntries(alunos.map((a) => [a.id, null])),
  );
  const [modal, setModal] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const presentes = Object.values(status).filter((v) => v === true).length;
  const ausentes = Object.values(status).filter((v) => v === false).length;

  function marcar(id: number, valor: boolean) {
    setStatus((prev) => ({ ...prev, [id]: valor }));
  }

  function limpar() {
    setStatus(Object.fromEntries(alunos.map((a) => [a.id, null])));
    setEnviado(false);
  }

  async function confirmar() {
    try {
      const resposta = await fetch("/api/chamada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turma, status, data: new Date() }),
      });
      const data = await resposta.json();
      if (data.success) {
        setModal(false);
        setEnviado(true);
      }
    } catch (erro) {
      console.error("Erro ao enviar chamada:", erro);
    }
  }

  return (
    <div className="pagina-chamada min-h-screen bg-[#fef1d2] px-4 py-6 sm:px-6 md:px-10 lg:px-16 xl:px-24">
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="!text-3xl sm:!text-4xl lg:!text-5xl xl:!text-6xl !font-bold !text-[#f5a600] !mb-0">
            Chamada - Turma {turma}
          </h1>
          <p className="!text-gray-600 !text-base sm:!text-lg lg:!text-xl !mt-1">
            {new Date()
              .toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
              .replace(/^\w/, (c) => c.toUpperCase())}
          </p>
        </div>

        {/* ALERT */}
        {enviado && (
          <div className="mb-6 !p-5 rounded-xl bg-green-100 !text-green-700 border-l-4 border-green-500 !text-lg">
            Chamada da turma {turma} enviada com sucesso!
          </div>
        )}

        {/* CARDS */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 max-w-xl mx-auto">
          <Card title="Total" value={alunos.length} />
          <Card title="Presentes" value={presentes} green />
          <Card title="Ausentes" value={ausentes} red />
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f5a623] text-white">
              <tr>
                <th className="px-4 py-6 text-left !text-white !text-lg sm:!text-xl">
                  #
                </th>
                <th className="px-4 py-6 text-left !text-white !text-lg sm:!text-xl">
                  Nome
                </th>
                <th className="px-4 py-6 text-left !text-white !text-lg sm:!text-xl">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno, i) => {
                const s = status[aluno.id];
                return (
                  <tr
                    key={aluno.id}
                    className={`border-b transition ${
                      s === true
                        ? "bg-green-50"
                        : s === false
                          ? "bg-red-50"
                          : "bg-yellow-50 hover:bg-yellow-100"
                    }`}
                  >
                    <td className="px-4 py-5 xl:py-7 !text-gray-400 !text-base">
                      {i + 1}
                    </td>
                    <td className="px-4 py-5 xl:py-7 !font-semibold !text-lg xl:!text-xl !text-gray-800">
                      {aluno.nome}
                    </td>
                    <td className="px-4 py-5 xl:py-7">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => marcar(aluno.id, true)}
                          className={`px-4 py-2 lg:px-5 lg:py-2 rounded-xl border !text-sm lg:!text-base !font-medium transition ${
                            s === true
                              ? "bg-green-500 !text-white border-green-500 shadow-md"
                              : "bg-white !text-gray-600 hover:bg-green-50 border-gray-200"
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => marcar(aluno.id, false)}
                          className={`px-4 py-2 lg:px-5 lg:py-2 rounded-xl border !text-sm lg:!text-base !font-medium transition ${
                            s === false
                              ? "bg-red-500 !text-white border-red-500 shadow-md"
                              : "bg-white !text-gray-600 hover:bg-red-50 border-gray-200"
                          }`}
                        >
                          Ausente
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AÇÕES */}
        <div className="flex flex-wrap justify-end gap-4 mt-8">
          <button
            onClick={limpar}
            className="px-6 py-3 !text-base !font-medium rounded-xl bg-white hover:bg-gray-100 shadow-md border border-gray-200 transition !text-gray-700"
          >
            Limpar
          </button>
          <button
            onClick={() => setModal(true)}
            className="px-6 py-3 !text-base !font-semibold rounded-xl bg-[#f5a623] !text-white hover:bg-[#e8940f] shadow-md transition"
          >
            Enviar Chamada
          </button>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="!text-2xl !font-bold !mb-1 !text-[#f5a600]">
              Confirmar chamada
            </h2>
            <p className="!text-gray-500 !text-base !mb-5">
              Turma {turma} — {new Date().toLocaleDateString("pt-BR")}
            </p>

            <div className="flex flex-col gap-2 mb-6">
              <div className="flex justify-between items-center bg-orange-50 rounded-xl px-4 py-3">
                <span className="!text-orange-700 !font-medium !text-base">
                  Total de alunos
                </span>
                <span className="!font-bold !text-orange-700 !text-xl">
                  {alunos.length}
                </span>
              </div>
              <div className="flex justify-between items-center bg-green-50 rounded-xl px-4 py-3">
                <span className="!text-green-700 !font-medium !text-base">
                  Presentes
                </span>
                <span className="!font-bold !text-green-700 !text-xl">
                  {presentes}
                </span>
              </div>
              <div className="flex justify-between items-center bg-red-50 rounded-xl px-4 py-3">
                <span className="!text-red-700 !font-medium !text-base">
                  Ausentes
                </span>
                <span className="!font-bold !text-red-700 !text-xl">
                  {ausentes}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModal(false)}
                className="px-5 py-2 border border-gray-200 rounded-xl !text-base !text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                className="px-6 py-2 bg-[#f5a623] hover:bg-[#e8940f] !text-white rounded-xl !text-base !font-semibold transition shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  green,
  red,
}: {
  title: string;
  value: number;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div
      className={`p-5 rounded-xl text-center shadow border ${
        green
          ? "bg-green-50 border-green-200"
          : red
            ? "bg-red-50 border-red-200"
            : "bg-orange-50 border-orange-200"
      }`}
    >
      <p
        className={`!text-sm lg:!text-base !font-medium !mb-1 ${
          green ? "!text-green-700" : red ? "!text-red-700" : "!text-orange-600"
        }`}
      >
        {title}
      </p>
      <p
        className={`!text-3xl lg:!text-4xl !font-bold !m-0 ${
          green ? "!text-green-700" : red ? "!text-red-700" : "!text-orange-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
