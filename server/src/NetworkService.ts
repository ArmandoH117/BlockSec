import {
  Block,
  BlockObject
} from "./Block.js";

import {
  Blockchain,
  BlockchainObject
} from "./Blockchain.js";

export interface PeerResult {
  peer: string;
  success: boolean;
  message: string;
}

interface PeerChainResponse {
  blockchain: BlockchainObject;
}

export class NetworkService {
  constructor(
    private readonly blockchain: Blockchain,
    private readonly nodeUrl: string,
    private readonly peers: string[]
  ) {}

  // =====================================================
  // BROADCAST
  // =====================================================

  public async broadcastBlock(
    block: Block
  ): Promise<PeerResult[]> {
    const results: PeerResult[] = [];

    for (const peer of this.peers) {
      try {
        const response =
          await fetch(
            `${peer}/api/network/block`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                sourceNode:
                  this.nodeUrl,

                block:
                  block.toObject()
              })
            }
          );

        const body =
          await response.json() as {
            message?: string;
          };

        results.push({
          peer,
          success:
            response.ok,

          message:
            body.message ??
            response.statusText
        });
      } catch {
        results.push({
          peer,
          success: false,
          message:
            "Nodo no disponible."
        });
      }
    }

    return results;
  }

  // =====================================================
  // RECIBIR BLOQUE DIRECTAMENTE
  // =====================================================

  public receiveBlock(
    blockData: BlockObject
  ): Block {
    const block =
      Block.fromObject(
        blockData
      );

    /*
     * Blockchain.addBlock()
     * comprueba:
     *
     * - Proof of Work
     * - índice
     * - previousHash
     * - hash
     * - posición en la cadena
     */
    this.blockchain.addBlock(
      block
    );

    return block;
  }

  // =====================================================
  // OBTENER CADENA REMOTA
  // =====================================================

  public async fetchChain(
    peer: string
  ): Promise<BlockchainObject> {
    const response =
      await fetch(
        `${peer}/api/network/chain`
      );

    if (!response.ok) {
      throw new Error(
        `No fue posible obtener la Blockchain desde ${peer}.`
      );
    }

    const body =
      await response.json() as
        PeerChainResponse;

    return body.blockchain;
  }

  // =====================================================
  // SINCRONIZAR DESDE UN NODO ESPECÍFICO
  // =====================================================

  public async synchronizeFrom(
    peer: string
  ): Promise<string> {
    const remoteData =
      await this.fetchChain(
        peer
      );

    /*
     * Antes de confiar en la cadena
     * la reconstruimos y validamos.
     */
    const remoteBlockchain =
      Blockchain.fromObject(
        remoteData
      );

    if (
      remoteBlockchain.difficulty !==
        this.blockchain.difficulty ||
      remoteBlockchain.mineChar !==
        this.blockchain.mineChar
    ) {
      throw new Error(
        "La Blockchain remota utiliza una configuración de minado diferente."
      );
    }

    const remoteLength =
      remoteBlockchain.blocks.length;

    const localLength =
      this.blockchain.blocks.length;

    // -------------------------------------------------
    // CADENA REMOTA MÁS CORTA
    // -------------------------------------------------

    if (
      remoteLength <
      localLength
    ) {
      return (
        "La cadena local ya es más extensa " +
        `que la cadena de ${peer}.`
      );
    }

    // -------------------------------------------------
    // MISMA LONGITUD
    // -------------------------------------------------

    if (
      remoteLength ===
      localLength
    ) {
      if (
        remoteBlockchain
          .lastBlock
          .hash ===
        this.blockchain
          .lastBlock
          .hash
      ) {
        return (
          `El nodo ya está sincronizado con ${peer}.`
        );
      }

      throw new Error(
        "Las cadenas tienen la misma longitud " +
        "pero poseen diferentes hashes finales."
      );
    }

    // -------------------------------------------------
    // CADENA REMOTA MÁS LARGA
    // -------------------------------------------------

    this.blockchain.adoptChain(
      remoteData
    );

    return (
      `Blockchain sincronizada desde ${peer}.`
    );
  }

  // =====================================================
  // SINCRONIZACIÓN GENERAL
  // =====================================================

  public async synchronize():
    Promise<string> {
    let selectedChain:
      BlockchainObject | null = null;

    let selectedPeer:
      string | null = null;

    for (
      const peer of
      this.peers
    ) {
      try {
        const chain =
          await this.fetchChain(
            peer
          );

        const validated =
          Blockchain.fromObject(
            chain
          );

        /*
         * Solo aceptamos nodos con
         * la misma configuración.
         */
        if (
          validated.difficulty !==
            this.blockchain.difficulty ||
          validated.mineChar !==
            this.blockchain.mineChar
        ) {
          continue;
        }

        /*
         * Elegimos la Blockchain
         * válida más extensa.
         */
        if (
          !selectedChain ||
          chain.chain.length >
            selectedChain.chain.length
        ) {
          selectedChain =
            chain;

          selectedPeer =
            peer;
        }
      } catch {
        /*
         * Un nodo apagado, corrupto o
         * incompatible no participa.
         */
      }
    }

    if (
      !selectedChain ||
      !selectedPeer
    ) {
      throw new Error(
        "No fue posible obtener una Blockchain válida desde los otros nodos."
      );
    }

    const selectedBlockchain =
      Blockchain.fromObject(
        selectedChain
      );

    const remoteLength =
      selectedBlockchain
        .blocks.length;

    const localLength =
      this.blockchain
        .blocks.length;

    // -------------------------------------------------
    // MISMA CADENA
    // -------------------------------------------------

    if (
      remoteLength ===
        localLength &&
      selectedBlockchain
        .lastBlock
        .hash ===
      this.blockchain
        .lastBlock
        .hash
    ) {
      return (
        "El nodo ya posee la Blockchain actual."
      );
    }

    // -------------------------------------------------
    // LOCAL MÁS EXTENSA
    // -------------------------------------------------

    if (
      remoteLength <
      localLength
    ) {
      return (
        "La cadena local ya es más extensa que las cadenas remotas disponibles."
      );
    }

    // -------------------------------------------------
    // MISMA LONGITUD PERO DIFERENTE
    // -------------------------------------------------

    if (
      remoteLength ===
      localLength
    ) {
      throw new Error(
        "Se detectaron cadenas distintas con la misma longitud."
      );
    }

    // -------------------------------------------------
    // ADOPTAR CADENA MÁS LARGA
    // -------------------------------------------------

    this.blockchain.adoptChain(
      selectedChain
    );

    return (
      `Blockchain sincronizada desde ${selectedPeer}.`
    );
  }
}