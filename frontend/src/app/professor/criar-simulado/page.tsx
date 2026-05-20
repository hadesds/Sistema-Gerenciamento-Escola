"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Loading from "@/components/Loading";
import Alert from "@/components/Alert";

interface Materia {
  id: number;
  nome: string;
  sigla: string;
}

interface Questao {
  id: number;
  enunciado: string;
  materia: number | null;
  materia_nome: string;
  materia_sigla: string;
  dificuldade: "facil" | "medio" | "dificil";
  dificuldade_display: string;
  tipo: "discursiva" | "objetiva";
  tipo_display: string;
  data_criacao: string;
}

interface Turma {
  id: number;
  nome: string;
}

interface SimuladoData {
  questoes: Questao[];
  turmas: Turma[];
  materias: Materia[];
}

// Fora do componente para não recriar a cada render
interface QuestaoSelecionada {
  id: number;
  valor: number;
}

const AREAS_ENEM = [
  {
    label: "Ciências da Natureza",
    icon: "science",
    cor: "#27ae60",
    siglas: ["CNC"],
  },
  {
    label: "Ciências Humanas",
    icon: "public",
    cor: "#e67e22",
    siglas: ["GGF", "FIL"],
  },
  {
    label: "Linguagens",
    icon: "menu_book",
    cor: "#9b59b6",
    siglas: ["PRT", "ING", "ART", "EDF"],
  },
  { label: "Matemática", icon: "calculate", cor: "#2980b9", siglas: ["MTM"] },
];

function difBadge(d: string, label: string) {
  const bg =
    d === "facil"
      ? "var(--color-success)"
      : d === "dificil"
        ? "var(--color-danger)"
        : "var(--color-warning)";
  return (
    <span
      className="badge"
      style={{ background: bg, color: "#fff", fontSize: "1.2rem" }}
    >
      {label}
    </span>
  );
}

export default function CriarSimuladoPage() {
  const router = useRouter();
  const [data, setData] = useState<SimuladoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [turmaId, setTurmaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [usarTempo, setUsarTempo] = useState(false);
  const [tempoLimite, setTempoLimite] = useState("60");
  const [areaSimulado, setAreaSimulado] = useState("");
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<
    QuestaoSelecionada[]
  >([]);
  const [materiaFiltro, setMateriaFiltro] = useState("");
  const [areaFiltro, setAreaFiltro] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<SimuladoData>("/professor/criar-simulado/data/")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const materias = data ? data.materias : [];

  const questoesFiltradas = !data
    ? []
    : data.questoes.filter((q) => {
        if (materiaFiltro && q.materia_sigla !== materiaFiltro) return false;
        if (areaFiltro) {
          const area = AREAS_ENEM.find((a) => a.label === areaFiltro);
          if (area && !area.siglas.includes(q.materia_sigla)) return false;
        }
        if (dataFiltro && q.data_criacao.slice(0, 10) < dataFiltro)
          return false;
        if (
          busca &&
          !q.enunciado.toLowerCase().includes(busca.toLowerCase()) &&
          !q.materia_nome.toLowerCase().includes(busca.toLowerCase())
        )
          return false;
        return true;
      });

  function toggleQuestao(id: number) {
    setQuestoesSelecionadas(
      (prev) =>
        prev.some((q) => q.id === id)
          ? prev.filter((q) => q.id !== id)
          : [...prev, { id, valor: 1.0 }], // começa com 1 ponto por padrão
    );
  }

  function setValorQuestao(id: number, valor: number) {
    setQuestoesSelecionadas((prev) =>
      prev.map((q) => (q.id === id ? { ...q, valor } : q)),
    );
  }

  function selecionarTodosFiltrados() {
    const novos = questoesFiltradas
      .filter((q) => !questoesSelecionadas.some((s) => s.id === q.id))
      .map((q) => ({ id: q.id, valor: 1.0 }));
    setQuestoesSelecionadas((prev) => [...prev, ...novos]);
  }

  function desselecionarTodosFiltrados() {
    const ids = new Set(questoesFiltradas.map((q) => q.id));
    setQuestoesSelecionadas((prev) => prev.filter((s) => !ids.has(s.id)));
  }

  const todosFiltradosSelecionados =
    questoesFiltradas.length > 0 &&
    questoesFiltradas.every((q) =>
      questoesSelecionadas.some((s) => s.id === q.id),
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turmaId || questoesSelecionadas.length === 0) {
      setAlert({
        type: "error",
        message: "Selecione uma turma e pelo menos uma questão.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/professor/criar-simulado/", {
        method: "POST",
        body: JSON.stringify({
          turma: turmaId,
          questoes: questoesSelecionadas, // [{id, valor}, ...]
          titulo,
          tempo_limite: usarTempo ? parseInt(tempoLimite) : null,
          area_conhecimento: areaSimulado,
        }),
      });
      setAlert({ type: "success", message: "Simulado criado com sucesso!" });
      setTimeout(() => router.push("/professor/simulados"), 1500);
    } catch {
      setAlert({ type: "error", message: "Erro ao criar simulado." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <style>{`
          .area-chips { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.8rem; }
          .area-chip {
            display: flex; align-items: center; gap: 0.8rem;
            padding: 0.8rem 1.4rem; border-radius: 2rem;
            border: 2px solid #d0daea; background: #fff;
            cursor: pointer; font-size: 1.4rem; font-weight: 600;
            font-family: 'Poppins', sans-serif; transition: all 0.2s;
          }
          .area-chip.active { color: #fff; border-color: transparent; }
          .area-chip .material-icons-outlined { font-size: 1.8rem; }
          .filtro-chips { display: flex; flex-wrap: wrap; gap: 0.8rem; }
          .check-row { display:flex; align-items:center; gap:1rem; padding:1.2rem 1.4rem; border:2px solid #d0daea; border-radius:1.2rem; cursor:pointer; transition: border-color 0.2s, background 0.2s; user-select:none; }
          .check-row:hover { border-color:#1a73c7; background:#f0f7ff; }
          .check-row.checked { border-color:#1a73c7; background:#e8f0fc; }
          .check-box { width:2.2rem; height:2.2rem; border:2px solid #94a3b8; border-radius:0.5rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; }
          .check-row.checked .check-box { background:#1a73c7; border-color:#1a73c7; }
          .check-box .material-icons-outlined { font-size:1.6rem; color:#fff; }
          .sim-search { display:flex; align-items:center; gap:1rem; background:#fff; border:2px solid #d0daea; border-radius:1.2rem; padding:1rem 1.6rem; transition:border-color 0.2s, box-shadow 0.2s; margin-bottom:1.6rem; }
          .sim-search:focus-within { border-color:#1a73c7; box-shadow:0 0 0 3px rgba(26,115,199,0.1); }
          .sim-search .material-icons-outlined { color:#94a3b8; font-size:2rem; flex-shrink:0; }
          .sim-search input { flex:1; border:none; outline:none; font-size:1.45rem; font-family:'Poppins',sans-serif; color:#1a2a4a; background:transparent; min-width:0; }
          .questao-item {
            display:flex; gap:1.2rem; align-items:flex-start;
            padding:1.4rem; border-radius:1.2rem; cursor:pointer;
            border:2px solid #e8f0fc; background:#fafbfe;
            margin-bottom:0.8rem; transition:all 0.2s;
          }
          .questao-item.selecionada { background:#e8f0fc; border-color:#1a73c7; }
          .questao-item:hover { border-color:#1a73c7; }
          .questao-check { width:2rem; height:2rem; flex-shrink:0; margin-top:0.3rem; accent-color:#1a73c7; cursor:pointer; }
          .questao-badges { display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem; }
          .questao-enunciado { font-size:1.45rem; color:var(--text-primary); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
          .sel-actions { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; padding:1rem 0; border-top:1px solid #e8f0fc; border-bottom:1px solid #e8f0fc; margin-bottom:1.4rem; }
          .sel-actions span { font-size:1.4rem; color:var(--text-secondary); }
          .data-filtro-row { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
          .data-filtro-row label { font-size:1.4rem; font-weight:600; color:var(--text-primary); white-space:nowrap; }
          .data-filtro-row input[type=date] { padding:0.8rem 1.2rem; border:2px solid #d0daea; border-radius:1rem; font-size:1.4rem; font-family:'Poppins',sans-serif; outline:none; }
          .data-filtro-row input[type=date]:focus { border-color:#1a73c7; }
          .filtro-secao { margin-bottom:1.4rem; }
          .filtro-secao-label { font-size:1.3rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:0.8rem; }
          .valor-questao-row { display:flex; align-items:center; gap:0.8rem; margin-top:0.8rem; }
          @media (max-width: 600px) {
            .area-chips { gap: 0.8rem; }
            .area-chip { font-size:1.3rem; padding:0.7rem 1.1rem; }
          }
        `}</style>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <h1>Criar Simulado</h1>

        {loading ? (
          <Loading />
        ) : !data ? null : (
          <form onSubmit={handleSubmit}>
            {/* Seção 1 — Configurações */}
            <div className="card mb-2">
              <h2>1. Configurações</h2>

              <div className="form-group">
                <label>
                  Título do simulado{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Simulado ENEM — Ciências da Natureza"
                />
              </div>

              <div className="form-group">
                <label>
                  Turma alvo{" "}
                  <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  required
                >
                  <option value="">Selecione uma turma...</option>
                  {data.turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle tempo limite */}
              <div className="form-group">
                <label>Tempo limite</label>
                <div
                  className={`check-row${usarTempo ? " checked" : ""}`}
                  onClick={() => setUsarTempo((v) => !v)}
                >
                  <div className="check-box">
                    {usarTempo && (
                      <span className="material-icons-outlined">check</span>
                    )}
                  </div>
                  <span style={{ fontSize: "1.45rem", fontWeight: 600 }}>
                    Definir tempo limite para o simulado
                  </span>
                </div>
                {usarTempo && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      marginTop: "1rem",
                    }}
                  >
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={tempoLimite}
                      onChange={(e) => setTempoLimite(e.target.value)}
                      style={{ width: "10rem" }}
                    />
                    <span
                      style={{
                        fontSize: "1.45rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      minutos
                    </span>
                  </div>
                )}
              </div>

              {/* Área de conhecimento */}
              <div className="form-group">
                <label>Área de conhecimento</label>
                <div className="area-chips">
                  <button
                    type="button"
                    className={`area-chip${areaSimulado === "" ? " active" : ""}`}
                    style={
                      areaSimulado === ""
                        ? {
                            background: "#1a73c7",
                            borderColor: "transparent",
                            color: "#fff",
                          }
                        : {}
                    }
                    onClick={() => setAreaSimulado("")}
                  >
                    <span className="material-icons-outlined">list</span>
                    Geral
                  </button>
                  {AREAS_ENEM.map((area) => (
                    <button
                      key={area.label}
                      type="button"
                      className={`area-chip${areaSimulado === area.label ? " active" : ""}`}
                      style={
                        areaSimulado === area.label
                          ? {
                              background: area.cor,
                              borderColor: "transparent",
                              color: "#fff",
                            }
                          : { borderColor: area.cor + "55" }
                      }
                      onClick={() => {
                        setAreaSimulado(area.label);
                        setAreaFiltro(area.label);
                      }}
                    >
                      <span
                        className="material-icons-outlined"
                        style={{
                          color:
                            areaSimulado === area.label ? "#fff" : area.cor,
                        }}
                      >
                        {area.icon}
                      </span>
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seção 2 — Selecionar Questões */}
            <div className="card mb-2">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.6rem",
                }}
              >
                <h2>2. Questões</h2>
                <span
                  className="badge"
                  style={{
                    background: "#1a73c7",
                    color: "#fff",
                    fontSize: "1.3rem",
                  }}
                >
                  {questoesSelecionadas.length} selecionada(s)
                </span>
              </div>

              {/* Barra de busca */}
              <div className="sim-search">
                <span className="material-icons-outlined">search</span>
                <input
                  type="text"
                  placeholder="Buscar por enunciado ou matéria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>

              {/* Filtrar por matéria */}
              <div className="filtro-secao">
                <div className="filtro-secao-label">Filtrar por matéria</div>
                <div className="filtro-chips">
                  <button
                    type="button"
                    className={`btn${materiaFiltro === "" ? " btn-primary" : " btn-secondary"}`}
                    style={{ fontSize: "1.3rem", padding: "0.6rem 1.2rem" }}
                    onClick={() => setMateriaFiltro("")}
                  >
                    Todas
                  </button>
                  {materias.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`btn${materiaFiltro === m.sigla ? " btn-primary" : " btn-secondary"}`}
                      style={{ fontSize: "1.3rem", padding: "0.6rem 1.2rem" }}
                      onClick={() => setMateriaFiltro(m.sigla)}
                    >
                      {m.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtrar por Área ENEM */}
              <div className="filtro-secao">
                <div className="filtro-secao-label">Filtrar por Área ENEM</div>
                <div className="area-chips">
                  <button
                    type="button"
                    className={`area-chip${areaFiltro === "" ? " active" : ""}`}
                    style={
                      areaFiltro === ""
                        ? {
                            background: "#1a73c7",
                            borderColor: "transparent",
                            color: "#fff",
                          }
                        : {}
                    }
                    onClick={() => setAreaFiltro("")}
                  >
                    <span className="material-icons-outlined">list</span>
                    Todas
                  </button>
                  {AREAS_ENEM.map((area) => (
                    <button
                      key={area.label}
                      type="button"
                      className={`area-chip${areaFiltro === area.label ? " active" : ""}`}
                      style={
                        areaFiltro === area.label
                          ? {
                              background: area.cor,
                              borderColor: "transparent",
                              color: "#fff",
                            }
                          : { borderColor: area.cor + "55" }
                      }
                      onClick={() => setAreaFiltro(area.label)}
                    >
                      <span
                        className="material-icons-outlined"
                        style={{
                          color: areaFiltro === area.label ? "#fff" : area.cor,
                        }}
                      >
                        {area.icon}
                      </span>
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtrar por data de criação */}
              <div className="filtro-secao">
                <div className="filtro-secao-label">
                  Filtrar por data de criação
                </div>
                <div className="data-filtro-row">
                  <label htmlFor="dataFiltro">A partir de:</label>
                  <input
                    id="dataFiltro"
                    type="date"
                    value={dataFiltro}
                    onChange={(e) => setDataFiltro(e.target.value)}
                  />
                  {dataFiltro && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: "1.3rem", padding: "0.5rem 1rem" }}
                      onClick={() => setDataFiltro("")}
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Linha de ações */}
              <div className="sel-actions">
                <span>
                  {questoesFiltradas.length} questão(ões) nos filtros atuais
                </span>
                <div
                  style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "1.3rem", padding: "0.6rem 1.2rem" }}
                    onClick={selecionarTodosFiltrados}
                    disabled={
                      todosFiltradosSelecionados ||
                      questoesFiltradas.length === 0
                    }
                  >
                    Selecionar todas ({questoesFiltradas.length})
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "1.3rem", padding: "0.6rem 1.2rem" }}
                    onClick={desselecionarTodosFiltrados}
                    disabled={questoesFiltradas.length === 0}
                  >
                    Desmarcar todas
                  </button>
                </div>
              </div>

              {/* Lista de questões */}
              {questoesFiltradas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <span
                      className="material-icons-outlined"
                      style={{ fontSize: "5rem" }}
                    >
                      search
                    </span>
                  </div>
                  <p>Nenhuma questão para os filtros aplicados.</p>
                </div>
              ) : (
                questoesFiltradas.map((q) => {
                  const selecionada = questoesSelecionadas.some(
                    (s) => s.id === q.id,
                  );
                  return (
                    <label
                      key={q.id}
                      className={`questao-item${selecionada ? " selecionada" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="questao-check"
                        checked={selecionada}
                        onChange={() => toggleQuestao(q.id)}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {/* Badges e enunciado sempre visíveis */}
                        <div className="questao-badges">
                          <span className="badge">{q.materia_nome}</span>
                          {difBadge(q.dificuldade, q.dificuldade_display)}
                          <span
                            className="badge"
                            style={{
                              background:
                                q.tipo === "objetiva" ? "#1a73c7" : "#7c3aed",
                              color: "#fff",
                              fontSize: "1.2rem",
                            }}
                          >
                            {q.tipo_display}
                          </span>
                        </div>
                        <p className="questao-enunciado">{q.enunciado}</p>

                        {/* Campo de valor — só aparece quando a questão está selecionada */}
                        {selecionada && (
                          <div
                            className="valor-questao-row"
                            onClick={(e) => e.stopPropagation()} // evita desmarcar ao clicar no input
                          >
                            <label
                              style={{ fontSize: "1.3rem", fontWeight: 600 }}
                            >
                              Valor da questão:
                            </label>
                            <input
                              type="number"
                              min={0.5}
                              max={10}
                              step={0.5}
                              value={
                                questoesSelecionadas.find((s) => s.id === q.id)
                                  ?.valor ?? 1
                              }
                              onChange={(e) =>
                                setValorQuestao(
                                  q.id,
                                  parseFloat(e.target.value),
                                )
                              }
                              style={{
                                width: "8rem",
                                padding: "0.4rem 0.8rem",
                                borderRadius: "0.8rem",
                                border: "2px solid #d0daea",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "1.3rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              pts
                            </span>
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <button
              type="submit"
              className="btn btn-submit"
              style={{ width: "100%" }}
              disabled={submitting || questoesSelecionadas.length === 0}
            >
              {submitting ? "Criando..." : "Criar Simulado"}
            </button>
          </form>
        )}
      </main>
      <footer
        style={{
          textAlign: "center",
          padding: "3rem 2rem",
          color: "var(--text-secondary)",
          fontSize: "1.4rem",
        }}
      >
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
