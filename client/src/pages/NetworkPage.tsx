import {
  CheckCircle2,
  Globe2,
  RefreshCcw,
  RefreshCw,
  Server,
  TriangleAlert,
  XCircle
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  getNodeStatus,
  NODE_URLS,
  synchronizeNode
} from "../api/blocksecApi";

import type {
  NodeStatus
} from "../api/blocksecApi";

import "../styles/network.css";

interface NodeView {
  url: string;
  online: boolean;
  status?: NodeStatus;
}

export function NetworkPage() {
  const [
    nodes,
    setNodes
  ] =
    useState<NodeView[]>([]);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    synchronizing,
    setSynchronizing
  ] =
    useState(false);

  const [
    syncMessage,
    setSyncMessage
  ] =
    useState("");

  const loadNodes =
    useCallback(
      async () => {
        const results =
          await Promise.all(
            NODE_URLS.map(
              async (
                nodeUrl
              ): Promise<NodeView> => {
                try {
                  const status =
                    await getNodeStatus(
                      nodeUrl
                    );

                  return {
                    url:
                      nodeUrl,

                    online:
                      true,

                    status
                  };
                } catch {
                  return {
                    url:
                      nodeUrl,

                    online:
                      false
                  };
                }
              }
            )
          );

        setNodes(
          results
        );

        setLoading(
          false
        );
      },
      []
    );

  useEffect(() => {
    void loadNodes();

    const interval =
      window.setInterval(
        () => {
          void loadNodes();
        },
        5000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [loadNodes]);

  const onlineNodes =
    nodes.filter(
      (node) =>
        node.online
    );

  const allOnline =
    onlineNodes.length ===
    NODE_URLS.length;

  const sameHash =
    onlineNodes.length > 0 &&
    onlineNodes.every(
      (node) =>
        node.status
          ?.lastBlock
          .hash ===
        onlineNodes[0]
          ?.status
          ?.lastBlock
          .hash
    );

  const sameBlockCount =
    onlineNodes.length > 0 &&
    onlineNodes.every(
      (node) =>
        node.status
          ?.blocks ===
        onlineNodes[0]
          ?.status
          ?.blocks
    );

  const synchronized =
    allOnline &&
    sameHash &&
    sameBlockCount;

  async function handleSynchronizeNetwork() {
    if (
      synchronizing
    ) {
      return;
    }

    setSynchronizing(
      true
    );

    setSyncMessage(
      ""
    );

    try {
      const onlineUrls =
        nodes
          .filter(
            (node) =>
              node.online
          )
          .map(
            (node) =>
              node.url
          );

      if (
        onlineUrls.length <
        2
      ) {
        setSyncMessage(
          "No hay suficientes nodos disponibles para realizar la sincronización."
        );

        return;
      }

      const results =
        await Promise
          .allSettled(
            onlineUrls.map(
              (nodeUrl) =>
                synchronizeNode(
                  nodeUrl
                )
            )
          );

      const successful =
        results.filter(
          (result) =>
            result.status ===
            "fulfilled"
        ).length;

      await loadNodes();

      setSyncMessage(
        `Sincronización procesada en ${successful} de ${onlineUrls.length} nodo(s) disponibles.`
      );
    } catch (
      error
    ) {
      setSyncMessage(
        error instanceof Error
          ? error.message
          : "No fue posible sincronizar la red."
      );
    } finally {
      setSynchronizing(
        false
      );
    }
  }

  return (
    <section className="page network-page">

      <header className="page-header">

        <div>
          <h1>
            Red
          </h1>

          <p>
            Estado y sincronización de los
            nodos participantes de BlockSec.
          </p>
        </div>

        <div className="network-header-actions">

          <button
            className="secondary-action"
            onClick={() =>
              void loadNodes()
            }
          >
            <RefreshCw
              size={18}
            />

            Actualizar
          </button>

          <button
            className="primary-button"
            disabled={
              synchronizing
            }
            onClick={
              handleSynchronizeNetwork
            }
          >
            <RefreshCcw
              size={18}
            />

            {synchronizing
              ? "Sincronizando..."
              : "Sincronizar red"}
          </button>

        </div>

      </header>

      <div
        className={
          synchronized
            ? "network-summary synchronized"
            : "network-summary warning"
        }
      >
        {synchronized
          ? (
            <CheckCircle2
              size={24}
            />
          )
          : (
            <TriangleAlert
              size={24}
            />
          )}

        <div>
          <strong>
            {synchronized
              ? "Red sincronizada"
              : "La red requiere atención"}
          </strong>

          <span>
            {onlineNodes.length}
            {" "}de{" "}
            {NODE_URLS.length}
            {" "}nodos disponibles
          </span>

          {!synchronized &&
            allOnline && (
            <small>
              Todos los nodos están conectados,
              pero sus copias de Blockchain
              todavía no coinciden.
            </small>
          )}
        </div>

      </div>

      {syncMessage && (
        <div className="sync-feedback">
          <RefreshCcw
            size={18}
          />

          <span>
            {syncMessage}
          </span>
        </div>
      )}

      {loading &&
        nodes.length ===
          0 && (
        <div className="empty-state">
          Consultando nodos...
        </div>
      )}

      <div className="nodes-grid">

        {nodes.map(
          (node) => (
            <article
              key={
                node.url
              }
              className={
                node.online
                  ? "node-card online"
                  : "node-card offline"
              }
            >

              <div className="node-card-header">

                <div className="node-icon">
                  <Server
                    size={24}
                  />
                </div>

                <div className="node-identity">

                  <strong>
                    {node.status
                      ?.node ??
                      "Nodo desconectado"}
                  </strong>

                  <span
                    title={
                      node.url
                    }
                  >
                    {node.url}
                  </span>

                </div>

                {node.online
                  ? (
                    <CheckCircle2
                      className="node-status-icon"
                      size={21}
                    />
                  )
                  : (
                    <XCircle
                      className="node-status-icon"
                      size={21}
                    />
                  )}

              </div>

              {node.online &&
                node.status && (
                <>
                  <div className="node-stats">

                    <div>
                      <span>
                        Bloques
                      </span>

                      <strong>
                        {
                          node.status
                            .blocks
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Último bloque
                      </span>

                      <strong>
                        #
                        {
                          node.status
                            .lastBlock
                            .index
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Pendientes
                      </span>

                      <strong>
                        {
                          node.status
                            .pendingTransactions
                        }
                      </strong>
                    </div>

                  </div>

                  <div className="node-hash">

                    <span>
                      Último hash
                    </span>

                    <code
                      title={
                        node.status
                          .lastBlock
                          .hash
                      }
                    >
                      {
                        node.status
                          .lastBlock
                          .hash
                      }
                    </code>

                  </div>
                </>
              )}

              {!node.online && (
                <div className="node-offline-message">
                  No fue posible establecer
                  comunicación con este nodo.
                </div>
              )}

            </article>
          )
        )}

      </div>

      <div className="network-diagram">

        <Globe2
          size={28}
        />

        <div>
          <strong>
            Blockchain distribuida
          </strong>

          <span>
            Cada nodo conserva una copia independiente
            y valida los bloques recibidos.
          </span>
        </div>

      </div>

    </section>
  );
}