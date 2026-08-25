import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Plus,
  X
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  getCase,
  registerEvidence
} from "../api/blocksecApi";

import type {
  CaseDetail
} from "../api/blocksecApi";

const evidenceTypes = [
  {
    value:
      "DISPOSITIVO_MOVIL",
    label:
      "Dispositivo móvil"
  },
  {
    value:
      "EQUIPO_COMPUTO",
    label:
      "Equipo de cómputo"
  },
  {
    value:
      "MEDIO_ALMACENAMIENTO",
    label:
      "Medio de almacenamiento"
  },
  {
    value:
      "DOCUMENTO",
    label:
      "Documento"
  },
  {
    value:
      "OTRO",
    label:
      "Otro"
  }
];

export function CaseDetailPage() {
  const { caseId } =
    useParams<{
      caseId: string;
    }>();

  const navigate =
    useNavigate();

  const [
    caseDetail,
    setCaseDetail
  ] =
    useState<CaseDetail | null>(
      null
    );

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const [
    showEvidenceModal,
    setShowEvidenceModal
  ] = useState(false);

  const [
    evidenceType,
    setEvidenceType
  ] =
    useState(
      "DISPOSITIVO_MOVIL"
    );

  const [
    description,
    setDescription
  ] = useState("");

  const [
    responsible,
    setResponsible
  ] = useState("");

  const [
    serialOrImei,
    setSerialOrImei
  ] = useState("");

  const [
    observations,
    setObservations
  ] = useState("");

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    formError,
    setFormError
  ] = useState("");

  async function loadCase() {
    if (!caseId) {
      return;
    }

    try {
      setError("");

      const data =
        await getCase(caseId);

      setCaseDetail(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar el caso."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
  }, [caseId]);

  async function handleRegisterEvidence() {
    if (
      !caseId ||
      !description.trim() ||
      !responsible.trim()
    ) {
      setFormError(
        "Descripción y responsable son obligatorios."
      );

      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await registerEvidence({
        caseId,
        type: evidenceType,
        description:
          description.trim(),
        responsible:
          responsible.trim(),
        serialOrImei:
          serialOrImei.trim(),
        observations:
          observations.trim()
      });

      setDescription("");
      setResponsible("");
      setSerialOrImei("");
      setObservations("");

      setShowEvidenceModal(
        false
      );

      await loadCase();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No fue posible registrar la evidencia."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        Cargando caso...
      </section>
    );
  }

  if (
    error ||
    !caseDetail
  ) {
    return (
      <section className="page">
        <div className="error-state">
          {error ||
            "Caso no encontrado."}
        </div>
      </section>
    );
  }

  return (
    <section className="page">

      <button
        className="back-button"
        onClick={() =>
          navigate("/cases")
        }
      >
        <ArrowLeft size={18} />
        Volver a casos
      </button>

      <header className="page-header">

        <div>
          <div className="detail-code">
            {caseDetail.id}
          </div>

          <h1>
            Detalle del caso
          </h1>

          <p>
            {caseDetail.description}
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowEvidenceModal(
              true
            )
          }
        >
          <Plus size={20} />
          Registrar evidencia
        </button>

      </header>

      <div className="detail-card">

        <div>
          <span className="detail-label">
            Código
          </span>

          <strong>
            {caseDetail.id}
          </strong>
        </div>

        <div>
          <span className="detail-label">
            Creado el
          </span>

          <strong>
            {new Date(
              caseDetail.createdAt
            ).toLocaleString()}
          </strong>
        </div>

        <div>
          <span className="detail-label">
            Evidencias
          </span>

          <strong>
            {
              caseDetail
                .evidences
                .length
            }
          </strong>
        </div>

      </div>

      <div className="section-heading">
        <div>
          <h2>Evidencias</h2>

          <p>
            Evidencias asociadas a este caso.
          </p>
        </div>
      </div>

      <div className="evidence-list">

        {caseDetail.evidences.length ===
          0 && (
          <div className="empty-state evidence-empty">
            Este caso todavía no tiene
            evidencias registradas.
          </div>
        )}

        {caseDetail.evidences.map(
          (evidence) => (
            <button
              key={evidence.id}
              className="evidence-row"
              onClick={() =>
                navigate(
                  `/evidences/${evidence.id}`
                )
              }
            >
              <div className="row-icon">
                <FileText size={20} />
              </div>

              <div className="evidence-info">
                <strong>
                  {evidence.id}
                </strong>

                <span>
                  {evidence.description}
                </span>
              </div>

              <span className="evidence-type">
                {evidence.type}
              </span>

              <ChevronRight
                size={20}
              />
            </button>
          )
        )}

      </div>

      {showEvidenceModal && (
        <div className="modal-overlay">

          <div className="modal-card modal-large">

            <div className="modal-header">
              <div>
                <h2>
                  Registrar evidencia
                </h2>

                <p>
                  Caso: {caseDetail.id}
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() =>
                  setShowEvidenceModal(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-grid">

              <div className="form-group">
                <label>
                  Código
                </label>

                <input
                  value="Automático"
                  disabled
                />
              </div>

              <div className="form-group">
                <label>
                  Caso
                </label>

                <input
                  value={
                    caseDetail.id
                  }
                  disabled
                />
              </div>

              <div className="form-group">
                <label>
                  Tipo de evidencia
                </label>

                <select
                  value={
                    evidenceType
                  }
                  onChange={(event) =>
                    setEvidenceType(
                      event.target.value
                    )
                  }
                >
                  {evidenceTypes.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Serie / IMEI
                </label>

                <input
                  value={
                    serialOrImei
                  }
                  onChange={(event) =>
                    setSerialOrImei(
                      event.target.value
                    )
                  }
                  placeholder="Opcional"
                />
              </div>

              <div className="form-group form-full">
                <label>
                  Descripción
                </label>

                <input
                  value={
                    description
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Ej. iPhone 13 azul"
                />
              </div>

              <div className="form-group form-full">
                <label>
                  Responsable
                </label>

                <input
                  value={
                    responsible
                  }
                  onChange={(event) =>
                    setResponsible(
                      event.target.value
                    )
                  }
                  placeholder="Nombre del responsable"
                />
              </div>

              <div className="form-group form-full">
                <label>
                  Observaciones
                </label>

                <textarea
                  rows={3}
                  value={
                    observations
                  }
                  onChange={(event) =>
                    setObservations(
                      event.target.value
                    )
                  }
                  placeholder="Observaciones adicionales..."
                />
              </div>

            </div>

            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setShowEvidenceModal(
                    false
                  )
                }
              >
                Cancelar
              </button>

              <button
                className="primary-button"
                disabled={saving}
                onClick={
                  handleRegisterEvidence
                }
              >
                {saving
                  ? "Registrando..."
                  : "Registrar evidencia"}
              </button>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}