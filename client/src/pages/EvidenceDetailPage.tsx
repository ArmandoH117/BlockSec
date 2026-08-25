import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileSearch,
  Repeat2,
  ShieldCheck,
  X
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  analyzeEvidence,
  getEvidence,
  transferEvidence
} from "../api/blocksecApi";

import type {
  EvidenceDetail,
  EvidenceHistoryEntry
} from "../api/blocksecApi";

function getEventLabel(
  type: string
): string {
  switch (type) {
    case "EVIDENCE_REGISTERED":
      return "Evidencia registrada";

    case "EVIDENCE_TRANSFERRED":
      return "Transferencia de custodia";

    case "EVIDENCE_ANALYZED":
      return "Análisis registrado";

    case "EVIDENCE_ARCHIVED":
      return "Evidencia archivada";

    default:
      return type;
  }
}

function getEventObservation(
  event: EvidenceHistoryEntry
): string | null {
  const observations =
    event.data.observations;

  return typeof observations === "string" &&
    observations.trim()
    ? observations
    : null;
}

export function EvidenceDetailPage() {
  const {
    evidenceId
  } = useParams<{
    evidenceId: string;
  }>();

  const navigate =
    useNavigate();

  const [
    evidence,
    setEvidence
  ] =
    useState<EvidenceDetail | null>(
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
    transferOpen,
    setTransferOpen
  ] = useState(false);

  const [
    analyzeOpen,
    setAnalyzeOpen
  ] = useState(false);

  const [
    newResponsible,
    setNewResponsible
  ] = useState("");

  const [
    transferObservations,
    setTransferObservations
  ] = useState("");

  const [
    analysisObservations,
    setAnalysisObservations
  ] = useState("");

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    formError,
    setFormError
  ] = useState("");

  const loadEvidence =
    useCallback(
      async () => {
        if (!evidenceId) {
          return;
        }

        try {
          const data =
            await getEvidence(
              evidenceId
            );

          setEvidence(data);
          setError("");
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible cargar la evidencia."
          );
        } finally {
          setLoading(false);
        }
      },
      [evidenceId]
    );

  useEffect(() => {
    void loadEvidence();
  }, [loadEvidence]);

  async function handleTransfer() {
    if (
      !evidenceId ||
      !newResponsible.trim()
    ) {
      setFormError(
        "Debes indicar el nuevo responsable."
      );

      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await transferEvidence(
        evidenceId,
        newResponsible.trim(),
        transferObservations.trim()
      );

      setTransferOpen(false);
      setNewResponsible("");
      setTransferObservations("");

      await loadEvidence();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No fue posible registrar la transferencia."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze() {
    if (
      !evidenceId ||
      !analysisObservations.trim()
    ) {
      setFormError(
        "Debes describir el análisis realizado."
      );

      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await analyzeEvidence(
        evidenceId,
        analysisObservations.trim()
      );

      setAnalyzeOpen(false);
      setAnalysisObservations("");

      await loadEvidence();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No fue posible registrar el análisis."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        Cargando evidencia...
      </section>
    );
  }

  if (
    error ||
    !evidence
  ) {
    return (
      <section className="page">
        <div className="error-state">
          {error ||
            "Evidencia no encontrada."}
        </div>
      </section>
    );
  }

  const confirmed =
    evidence.lastConfirmedEvent !==
    null;

  const hasPending =
    evidence.history.some(
      (event) =>
        !event.confirmed
    );

  return (
    <section className="page">

      <button
        className="back-button"
        onClick={() =>
          navigate(
            `/cases/${evidence.caseId}`
          )
        }
      >
        <ArrowLeft size={18} />
        Volver al caso
      </button>

      <header className="page-header evidence-page-header">

        <div>
          <div className="detail-code">
            {evidence.id}
          </div>

          <h1>
            Detalle de evidencia
          </h1>

          <p>
            {evidence.description}
          </p>
        </div>

        <div className="evidence-actions">

          <button
            className="secondary-action"
            disabled={!confirmed}
            onClick={() => {
              setFormError("");
              setTransferOpen(true);
            }}
          >
            <Repeat2 size={19} />
            Transferir
          </button>

          <button
            className="primary-button"
            disabled={!confirmed}
            onClick={() => {
              setFormError("");
              setAnalyzeOpen(true);
            }}
          >
            <FileSearch size={19} />
            Registrar análisis
          </button>

        </div>

      </header>

      {!confirmed && (
        <div className="notice-card">
          <CircleDashed size={20} />

          <div>
            <strong>
              Evidencia pendiente de minar
            </strong>

            <span>
              Debes confirmar su registro en Blockchain
              antes de transferirla o analizarla.
            </span>
          </div>
        </div>
      )}

      {hasPending && confirmed && (
        <div className="notice-card">
          <Clock3 size={20} />

          <div>
            <strong>
              Hay operaciones pendientes
            </strong>

            <span>
              El estado confirmado no cambiará hasta
              que se mine el bloque candidato.
            </span>
          </div>
        </div>
      )}

      <div className="evidence-summary-card">

        <div>
          <span className="detail-label">
            Caso
          </span>

          <strong>
            {evidence.caseId}
          </strong>
        </div>

        <div>
          <span className="detail-label">
            Tipo
          </span>

          <strong>
            {evidence.type}
          </strong>
        </div>

        <div>
          <span className="detail-label">
            Serie / IMEI
          </span>

          <strong>
            {evidence.serialOrImei ||
              "No especificado"}
          </strong>
        </div>

        <div>
          <span className="detail-label">
            Responsable actual
          </span>

          <strong>
            {evidence.currentResponsible ??
              "Pendiente de confirmar"}
          </strong>
        </div>

        <div>
          <span className="detail-label">
            Último evento confirmado
          </span>

          <strong>
            {evidence.lastConfirmedEvent
              ? getEventLabel(
                  evidence.lastConfirmedEvent
                )
              : "Pendiente"}
          </strong>
        </div>

        <div>
          <span className="detail-label">
            Registrada el
          </span>

          <strong>
            {new Date(
              evidence.createdAt
            ).toLocaleString()}
          </strong>
        </div>

      </div>

      <div className="description-card">
        <span className="detail-label">
          Observaciones iniciales
        </span>

        <p>
          {evidence.observations ||
            "Sin observaciones."}
        </p>
      </div>

      <div className="section-heading history-heading">
        <div>
          <h2>
            Historial de custodia
          </h2>

          <p>
            Registro cronológico de las operaciones
            realizadas sobre esta evidencia.
          </p>
        </div>

        <ShieldCheck size={25} />
      </div>

      <div className="timeline">

        {evidence.history.map(
          (event) => {
            const observation =
              getEventObservation(
                event
              );

            return (
              <div
                key={
                  event.transactionId
                }
                className="timeline-item"
              >
                <div
                  className={
                    event.confirmed
                      ? "timeline-dot confirmed"
                      : "timeline-dot pending"
                  }
                >
                  {event.confirmed
                    ? (
                      <CheckCircle2
                        size={17}
                      />
                    )
                    : (
                      <Clock3
                        size={17}
                      />
                    )}
                </div>

                <div className="timeline-content">

                  <div className="timeline-top">

                    <div>
                      <strong>
                        {getEventLabel(
                          event.type
                        )}
                      </strong>

                      <span>
                        {
                          event.transactionId
                        }
                      </span>
                    </div>

                    <div
                      className={
                        event.confirmed
                          ? "status-badge confirmed"
                          : "status-badge pending"
                      }
                    >
                      {event.confirmed
                        ? `BLOCK #${event.blockIndex}`
                        : "Pendiente"}
                    </div>

                  </div>

                  {observation && (
                    <p>
                      {observation}
                    </p>
                  )}

                  <small>
                    {new Date(
                      event.timestamp
                    ).toLocaleString()}
                  </small>

                </div>

              </div>
            );
          }
        )}

      </div>

      {transferOpen && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">
              <div>
                <h2>
                  Transferir evidencia
                </h2>

                <p>
                  {evidence.id} · {evidence.description}
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() =>
                  setTransferOpen(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label>
                Responsable actual
              </label>

              <input
                value={
                  evidence.currentResponsible ??
                  ""
                }
                disabled
              />
            </div>

            <div className="form-group form-spaced">
              <label>
                Nuevo responsable
              </label>

              <input
                value={
                  newResponsible
                }
                onChange={(event) =>
                  setNewResponsible(
                    event.target.value
                  )
                }
                placeholder="Nombre del nuevo responsable"
              />
            </div>

            <div className="form-group form-spaced">
              <label>
                Observaciones
              </label>

              <textarea
                rows={4}
                value={
                  transferObservations
                }
                onChange={(event) =>
                  setTransferObservations(
                    event.target.value
                  )
                }
                placeholder="Motivo o detalle de la transferencia..."
              />
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
                  setTransferOpen(
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
                  handleTransfer
                }
              >
                {saving
                  ? "Registrando..."
                  : "Agregar transferencia"}
              </button>

            </div>

          </div>

        </div>
      )}

      {analyzeOpen && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">
              <div>
                <h2>
                  Registrar análisis
                </h2>

                <p>
                  {evidence.id} · {evidence.description}
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() =>
                  setAnalyzeOpen(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label>
                Responsable
              </label>

              <input
                value={
                  evidence.currentResponsible ??
                  ""
                }
                disabled
              />
            </div>

            <div className="form-group form-spaced">
              <label>
                Descripción del análisis
              </label>

              <textarea
                rows={5}
                value={
                  analysisObservations
                }
                onChange={(event) =>
                  setAnalysisObservations(
                    event.target.value
                  )
                }
                placeholder="Describe el análisis realizado..."
              />
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
                  setAnalyzeOpen(
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
                  handleAnalyze
                }
              >
                {saving
                  ? "Registrando..."
                  : "Agregar análisis"}
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}