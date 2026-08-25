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

  // =============================================
  // BROADCAST DE BLOQUE MINADO
  // =============================================

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
          success: response.ok,
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

  // =============================================
  // RECIBIR Y VALIDAR BLOQUE
  // =============================================

  public receiveBlock(
    blockData: BlockObject
  ): Block {
    const block =
      Block.fromObject(blockData);

    /*
     * addBlock() ya comprueba:
     *
     * - bloque minado
     * - índice
     * - previousHash
     * - hash recalculado
     * - Proof of Work
     */
    this.blockchain.addBlock(
      block
    );

    return block;
  }

  // =============================================
  // DESCARGAR BLOCKCHAIN DE OTRO NODO
  // =============================================

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

  // =============================================
  // SINCRONIZAR
  // =============================================

  public async synchronize():
    Promise<string> {
    let selectedChain:
      BlockchainObject | null = null;

    let selectedPeer:
      string | null = null;

    for (const peer of this.peers) {
      try {
        const chain =
          await this.fetchChain(
            peer
          );

        /*
         * Validamos la información remota
         * antes siquiera de considerarla.
         */
        const validated =
          Blockchain.fromObject(
            chain
          );

        if (
          validated.difficulty !==
            this.blockchain.difficulty ||
          validated.mineChar !==
            this.blockchain.mineChar
        ) {
          continue;
        }

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
         * Un nodo desconectado o inválido
         * simplemente no participa.
         */
      }
    }

    if (!selectedChain) {
      throw new Error(
        "No fue posible obtener una Blockchain válida desde los otros nodos."
      );
    }

    if (
      selectedChain.chain.length <=
      this.blockchain.blocks.length
    ) {
      return (
        "El nodo ya posee una Blockchain " +
        "igual o más extensa."
      );
    }

    this.blockchain.adoptChain(
      selectedChain
    );

    return (
      `Blockchain sincronizada desde ${selectedPeer}.`
    );
  }
}