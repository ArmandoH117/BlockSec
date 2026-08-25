import {
  Box,
  CheckCircle2,
  Clock3,
  Cpu,
  Hash,
  Link2,
  Pickaxe,
  RefreshCw
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  getBlockchain,
  getCandidateBlock,
  mineCandidateBlock
} from "../api/blocksecApi";

import type {
  BlockchainResponse,
  CandidateBlockResponse,
  MineResponse
} from "../api/blocksecApi";

export function BlockchainPage() {
  const [
    blockchain,
    setBlockchain
  ] =
    useState<BlockchainResponse | null>(
      null
    );

  const [
    candidate,
    setCandidate
  ] =
    useState<CandidateBlockResponse | null>(
      null
    );

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    mining,
    setMining
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    lastMining,
    setLastMining
  ] =
    useState<MineResponse | null>(
      null
    );

  const loadData =
    useCallback(
      async () => {
        try {
          const [
            blockchainData,
            candidateData
          ] =
            await Promise.all([
              getBlockchain(),
              getCandidateBlock()
            ]);

          setBlockchain(
            blockchainData
          );

          setCandidate(
            candidateData
          );

          setError("");
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible cargar Blockchain."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleMine() {
    if (
      mining ||
      !candidate?.exists ||
      candidate.transactionCount ===
        0
    ) {
      return;
    }

    setMining(true);
    setError("");

    try {
      const result =
        await mineCandidateBlock();

      setLastMining(
        result
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible minar el bloque."
      );
    } finally {
      setMining(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        Cargando Blockchain...
      </section>
    );
  }

  return (
    <section className="page">

      <header className="page-header">
        <div>
          <h1>
            Blockchain
          </h1>

          <p>
            Bloques confirmados y transacciones
            pendientes de la cadena de custodia.
          </p>
        </div>

        <button
          className="secondary-action"
          onClick={() =>
            void loadData()
          }
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </header>

      {error && (
        <div className="form-error blockchain-error">
          {error}
        </div>
      )}

      <div className="blockchain-stats">

        <div className="stat-card">
          <Box size={23} />

          <div>
            <span>
              Bloques
            </span>

            <strong>
              {blockchain?.blockCount ??
                0}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <Cpu size={23} />

          <div>
            <span>
              Dificultad
            </span>

            <strong>
              {blockchain?.difficulty}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <Hash size={23} />

          <div>
            <span>
              Objetivo
            </span>

            <strong>
              {blockchain?.target}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <CheckCircle2 size={23} />

          <div>
            <span>
              Estado
            </span>

            <strong>
              {blockchain?.valid
                ? "Válida"
                : "Inválida"}
            </strong>
          </div>
        </div>

      </div>

      <div className="candidate-card">

        <div className="candidate-header">

          <div>
            <span className="detail-code">
              BLOQUE CANDIDATO
            </span>

            <h2>
              {candidate?.exists
                ? `BLOCK #${candidate.index}`
                : "Sin bloque pendiente"}
            </h2>

            <p>
              {candidate?.exists
                ? `${candidate.transactionCount} transacción(es) pendientes`
                : "No existen transacciones pendientes de minar."}
            </p>
          </div>

          <button
            className="primary-button mine-button"
            disabled={
              mining ||
              !candidate?.exists ||
              candidate.transactionCount ===
                0
            }
            onClick={
              handleMine
            }
          >
            <Pickaxe size={20} />

            {mining
              ? "Minando..."
              : "Minar bloque"}
          </button>

        </div>

        {candidate?.exists &&
          candidate.transactions.length >
            0 && (
          <div className="pending-list">

            {candidate.transactions.map(
              (transaction) => (
                <div
                  key={
                    transaction.id
                  }
                  className="pending-row"
                >
                  <Clock3
                    size={18}
                  />

                  <strong>
                    {
                      transaction.id
                    }
                  </strong>

                  <span>
                    {
                      transaction.type
                    }
                  </span>

                  <div className="status-badge pending">
                    Pendiente
                  </div>
                </div>
              )
            )}

          </div>
        )}

      </div>

      {lastMining && (
        <div className="mining-result">

          <CheckCircle2
            size={22}
          />

          <div>
            <strong>
              BLOCK #{lastMining.block.index}
              {" "}minado correctamente
            </strong>

            <span>
              {lastMining.mining.attempts.toLocaleString()}
              {" "}intentos ·{" "}
              {lastMining.mining.durationMs}
              {" "}ms
            </span>
          </div>

        </div>
      )}

      <div className="section-heading blockchain-heading">
        <div>
          <h2>
            Cadena confirmada
          </h2>

          <p>
            Cada bloque hereda el hash del
            bloque anterior.
          </p>
        </div>
      </div>

      <div className="blocks-list">

        {[...(blockchain?.blocks ?? [])]
          .reverse()
          .map(
            (block) => (
              <div
                key={
                  block.index
                }
                className="block-card"
              >
                <div className="block-index">
                  <Box size={22} />

                  <div>
                    <span>
                      BLOQUE
                    </span>

                    <strong>
                      #{block.index}
                    </strong>
                  </div>
                </div>

                <div className="block-data">

                  <div>
                    <span>
                      Hash
                    </span>

                    <code>
                      {block.hash}
                    </code>
                  </div>

                  <div>
                    <span>
                      <Link2
                        size={14}
                      />
                      Previous Hash
                    </span>

                    <code>
                      {block.previousHash}
                    </code>
                  </div>

                </div>

                <div className="block-meta">

                  <div>
                    <span>
                      Nonce
                    </span>

                    <strong>
                      {block.nonce}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Transacciones
                    </span>

                    <strong>
                      {
                        block.transactions
                          .length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Fecha
                    </span>

                    <strong>
                      {new Date(
                        block.timestamp
                      ).toLocaleString()}
                    </strong>
                  </div>

                </div>

              </div>
            )
          )}

      </div>

    </section>
  );
}