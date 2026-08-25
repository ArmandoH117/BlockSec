import {
  BriefcaseBusiness,
  ChevronRight,
  FileText,
  Plus,
  Search,
  X
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  createCase,
  getCases
} from "../api/blocksecApi";

import type {
  CaseItem
} from "../api/blocksecApi";

export function CasesPage() {
  const navigate =
    useNavigate();

  const [cases, setCases] =
    useState<CaseItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    showNewCase,
    setShowNewCase
  ] = useState(false);

  const [
    newCaseDescription,
    setNewCaseDescription
  ] = useState("");

  const [
    creatingCase,
    setCreatingCase
  ] = useState(false);

  const [
    modalError,
    setModalError
  ] = useState("");

  async function loadCases() {
    try {
      setError("");

      const data =
        await getCases();

      setCases(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar los casos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  const filteredCases =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return cases;
      }

      return cases.filter(
        (caseItem) =>
          caseItem.id
            .toLowerCase()
            .includes(term) ||
          caseItem.description
            .toLowerCase()
            .includes(term)
      );
    }, [cases, search]);

  async function handleCreateCase() {
    const description =
      newCaseDescription.trim();

    if (!description) {
      setModalError(
        "Ingresa una descripción para el caso."
      );

      return;
    }

    try {
      setCreatingCase(true);
      setModalError("");

      await createCase(
        description
      );

      setNewCaseDescription("");
      setShowNewCase(false);

      await loadCases();
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "No fue posible crear el caso."
      );
    } finally {
      setCreatingCase(false);
    }
  }

  return (
    <section className="page">

      <header className="page-header">
        <div>
          <h1>Casos</h1>

          <p>
            Administra los casos y las evidencias
            asociadas a la cadena de custodia.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowNewCase(true)
          }
        >
          <Plus size={20} />
          Nuevo caso
        </button>
      </header>

      <div className="search-box">
        <Search size={24} />

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Buscar caso por ID o descripción..."
        />
      </div>

      <div className="table-card">

        <div className="cases-grid table-header">
          <span>ID del caso</span>
          <span>Descripción</span>
          <span>Evidencias</span>
          <span>Creado el</span>
        </div>

        {loading && (
          <div className="empty-state">
            Cargando casos...
          </div>
        )}

        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          filteredCases.length === 0 && (
            <div className="empty-state">
              No se encontraron casos.
            </div>
          )}

        {!loading &&
          !error &&
          filteredCases.map(
            (caseItem) => (
              <button
                key={caseItem.id}
                className="cases-grid case-row"
                onClick={() =>
                  navigate(
                    `/cases/${caseItem.id}`
                  )
                }
              >
                <div className="case-code">
                  <div className="row-icon">
                    <BriefcaseBusiness
                      size={20}
                    />
                  </div>

                  <strong>
                    {caseItem.id}
                  </strong>
                </div>

                <span>
                  {caseItem.description}
                </span>

                <div className="evidence-count">
                  <FileText size={17} />
                  {caseItem.evidenceCount}
                </div>

                <div className="row-date">
                  {new Date(
                    caseItem.createdAt
                  ).toLocaleString()}

                  <ChevronRight
                    size={20}
                  />
                </div>
              </button>
            )
          )}

      </div>

      {showNewCase && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">
              <div>
                <h2>Nuevo caso</h2>

                <p>
                  Registra un nuevo caso para
                  asociar sus evidencias.
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() => {
                  setShowNewCase(false);
                  setModalError("");
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label>
                Código del caso
              </label>

              <input
                value="Se generará automáticamente"
                disabled
              />
            </div>

            <div className="form-group">
              <label>
                Descripción
              </label>

              <textarea
                value={
                  newCaseDescription
                }
                onChange={(event) =>
                  setNewCaseDescription(
                    event.target.value
                  )
                }
                placeholder="Describe brevemente el caso..."
                rows={4}
              />
            </div>

            {modalError && (
              <div className="form-error">
                {modalError}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setShowNewCase(false)
                }
              >
                Cancelar
              </button>

              <button
                className="primary-button"
                disabled={
                  creatingCase
                }
                onClick={
                  handleCreateCase
                }
              >
                {creatingCase
                  ? "Guardando..."
                  : "Crear caso"}
              </button>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}