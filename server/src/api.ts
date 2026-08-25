import express, {
  NextFunction,
  Request,
  Response
} from "express";

import cors from "cors";

import { Blockchain } from "./Blockchain.js";
import { BlockchainStorage } from "./BlockchainStorage.js";
import { BlockSecService } from "./BlockSecService.js";
import { EvidenceType } from "./Evidence.js";
import { NetworkService } from "./NetworkService.js";
import { BlockObject } from "./Block.js";


// =====================================================
// TIPOS
// =====================================================

interface CreateCaseBody {
  description?: string;
}

interface RegisterEvidenceBody {
  caseId?: string;
  type?: EvidenceType;
  description?: string;
  responsible?: string;
  serialOrImei?: string;
  observations?: string;
}

interface TransferEvidenceBody {
  newResponsible?: string;
  observations?: string;
}

interface AnalyzeEvidenceBody {
  observations?: string;
}

// =====================================================
// CREAR API
// =====================================================

export function createApi(
  blockchain: Blockchain,
  blockSec: BlockSecService,
  storage: BlockchainStorage,
  network: NetworkService,
  nodeName: string,
  nodeUrl: string
) {
  const app = express();

  /*
   * Esta variable será una protección adicional
   * contra solicitudes repetidas de minado.
   */
  let miningInProgress = false;

  app.use(cors());
  app.use(express.json());

  // ===================================================
  // HEALTH CHECK
  // ===================================================

  app.get(
  "/api/health",
  (_request: Request, response: Response) => {
    response.json({
      status: "ok",
      service: "BlockSec",
      node: nodeName,
      url: nodeUrl
    });
  }
);

  // ===================================================
  // CASOS
  // ===================================================

  app.get(
    "/api/cases",
    (_request: Request, response: Response) => {
      const cases = blockSec.getCases();

      const result = cases.map((caseFile) => {
        const evidences =
          blockSec.getEvidencesByCase(
            caseFile.id
          );

        return {
          ...caseFile,
          evidenceCount:
            evidences.length
        };
      });

      response.json(result);
    }
  );

  // ---------------------------------------------------

  app.get(
  "/api/cases/:caseId",
  (
    request: Request<{ caseId: string }>,
    response: Response
  ) => {
    const caseFile =
      blockSec.findCase(
        request.params.caseId
      );

    if (!caseFile) {
      response.status(404).json({
        message: "Caso no encontrado."
      });

      return;
    }

    const evidences =
      blockSec.getEvidencesByCase(
        caseFile.id
      );

    response.json({
      ...caseFile,
      evidences
    });
  }
  );

  // ---------------------------------------------------

  app.post(
    "/api/cases",
    async (
      request: Request<
        Record<string, never>,
        unknown,
        CreateCaseBody
      >,
      response: Response,
      next: NextFunction
    ) => {
      try {
        const description =
          request.body.description?.trim();

        if (!description) {
          response.status(400).json({
            message:
              "La descripción del caso es obligatoria."
          });

          return;
        }

        const caseFile =
          blockSec.createCase(
            description
          );

        /*
         * Guardamos también el bloque candidato.
         */
        await storage.save(
          blockchain
        );

        response.status(201).json({
          message:
            "Caso agregado al bloque candidato.",

          case: caseFile,

          pendingTransactions:
            blockSec
              .getPendingTransactions()
              .length
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===================================================
  // EVIDENCIAS
  // ===================================================

  app.get(
    "/api/evidences",
    (_request: Request, response: Response) => {
      const evidences =
        blockSec.getEvidences();

      const result =
        evidences.map(
          (evidence) => ({
            ...evidence,

            currentResponsible:
              blockSec
                .getCurrentResponsible(
                  evidence.id
                ),

            lastConfirmedEvent:
              blockSec
                .getLastConfirmedEvent(
                  evidence.id
                )
          })
        );

      response.json(result);
    }
  );

  // ---------------------------------------------------

  app.get(
  "/api/evidences/:evidenceId",
  (
    request: Request<{
      evidenceId: string;
    }>,
    response: Response
  ) => {
    const evidence =
      blockSec.findEvidence(
        request.params.evidenceId
      );

    if (!evidence) {
      response.status(404).json({
        message:
          "Evidencia no encontrada."
      });

      return;
    }

    response.json({
      ...evidence,

      currentResponsible:
        blockSec.getCurrentResponsible(
          evidence.id
        ),

      lastConfirmedEvent:
        blockSec.getLastConfirmedEvent(
          evidence.id
        ),

      history:
        blockSec.getEvidenceHistory(
          evidence.id
        )
    });
  }
);

  // ---------------------------------------------------

  app.get(
  "/api/evidences/:evidenceId/history",
  (
    request: Request<{
      evidenceId: string;
    }>,
    response: Response
  ) => {
    const evidence =
      blockSec.findEvidence(
        request.params.evidenceId
      );

    if (!evidence) {
      response.status(404).json({
        message:
          "Evidencia no encontrada."
      });

      return;
    }

    response.json(
      blockSec.getEvidenceHistory(
        evidence.id
      )
    );
  }
);

  // ---------------------------------------------------

  app.post(
    "/api/evidences",
    async (
      request: Request<
        Record<string, never>,
        unknown,
        RegisterEvidenceBody
      >,
      response: Response,
      next: NextFunction
    ) => {
      try {
        const {
          caseId,
          type,
          description,
          responsible,
          serialOrImei = "",
          observations = ""
        } = request.body;

        if (
          !caseId ||
          !type ||
          !description ||
          !responsible
        ) {
          response.status(400).json({
            message:
              "caseId, type, description y responsible son obligatorios."
          });

          return;
        }

        const evidence =
          blockSec.registerEvidence(
            caseId,
            type,
            description,
            responsible,
            serialOrImei,
            observations
          );

        await storage.save(
          blockchain
        );

        response.status(201).json({
          message:
            "Evidencia agregada al bloque candidato.",

          evidence,

          pendingTransactions:
            blockSec
              .getPendingTransactions()
              .length
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===================================================
  // TRANSFERENCIA
  // ===================================================

  app.post(
    "/api/evidences/:evidenceId/transfer",
    async (
      request: Request<
        { evidenceId: string },
        unknown,
        TransferEvidenceBody
      >,
      response: Response,
      next: NextFunction
    ) => {
      try {
        const newResponsible =
          request.body
            .newResponsible
            ?.trim();

        if (!newResponsible) {
          response.status(400).json({
            message:
              "El nuevo responsable es obligatorio."
          });

          return;
        }

        const transaction =
          blockSec.transferEvidence(
            request.params.evidenceId,
            newResponsible,
            request.body.observations ?? ""
          );

        await storage.save(
          blockchain
        );

        response.status(201).json({
          message:
            "Transferencia agregada al bloque candidato.",

          transactionId:
            transaction.id,

          pendingTransactions:
            blockSec
              .getPendingTransactions()
              .length
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===================================================
  // ANÁLISIS
  // ===================================================

  app.post(
    "/api/evidences/:evidenceId/analyze",
    async (
      request: Request<
        { evidenceId: string },
        unknown,
        AnalyzeEvidenceBody
      >,
      response: Response,
      next: NextFunction
    ) => {
      try {
        const observations =
          request.body
            .observations
            ?.trim();

        if (!observations) {
          response.status(400).json({
            message:
              "Las observaciones del análisis son obligatorias."
          });

          return;
        }

        const transaction =
          blockSec.analyzeEvidence(
            request.params.evidenceId,
            observations
          );

        await storage.save(
          blockchain
        );

        response.status(201).json({
          message:
            "Análisis agregado al bloque candidato.",

          transactionId:
            transaction.id,

          pendingTransactions:
            blockSec
              .getPendingTransactions()
              .length
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===================================================
  // BLOQUE CANDIDATO
  // ===================================================

  app.get(
    "/api/blockchain/candidate",
    (_request: Request, response: Response) => {
      const candidate =
        blockchain
          .getCandidateBlock();

      if (!candidate) {
        response.json({
          exists: false,
          transactionCount: 0,
          transactions: []
        });

        return;
      }

      response.json({
        exists: true,

        index:
          candidate.index,

        previousHash:
          candidate.previousHash,

        transactionCount:
          candidate.transactionCount,

        transactions:
          candidate
            .getTransactions()
            .map(
              (transaction) =>
                transaction.toObject()
            )
      });
    }
  );

  // ===================================================
  // MINADO
  // ===================================================

  app.post(
    "/api/blockchain/mine",
    async (
      _request: Request,
      response: Response,
      next: NextFunction
    ) => {
      /*
       * Primera barrera contra doble clic.
       */
      if (miningInProgress) {
        response.status(409).json({
          message:
            "Ya existe un proceso de minado en curso."
        });

        return;
      }

      const candidate =
        blockchain
          .getCandidateBlock();

      if (!candidate) {
        response.status(409).json({
          message:
            "No existe un bloque candidato para minar."
        });

        return;
      }

      if (
        candidate.transactionCount === 0
      ) {
        response.status(409).json({
          message:
            "El bloque candidato no contiene transacciones."
        });

        return;
      }

      /*
       * Guardamos la identidad lógica
       * exacta del candidato solicitado.
       */
      const candidateIndex =
        candidate.index;

      const candidatePreviousHash =
        candidate.previousHash;

      miningInProgress = true;

      try {
        /*
         * Segunda comprobación antes
         * de iniciar realmente el proceso.
         */
        const currentCandidate =
          blockchain
            .getCandidateBlock();

        if (
          !currentCandidate ||
          currentCandidate.index !==
            candidateIndex ||
          currentCandidate.previousHash !==
            candidatePreviousHash
        ) {
          response.status(409).json({
            message:
              "El bloque candidato cambió antes de iniciar el minado."
          });

          return;
        }

        const result =
          blockchain
            .mineCandidateBlock();

        /*
         * Antes de agregarlo comprobamos
         * nuevamente que seguimos trabajando
         * sobre el mismo candidato.
         */
        const minedCandidate =
          blockchain
            .getCandidateBlock();

        if (
          !minedCandidate ||
          minedCandidate.index !==
            candidateIndex
        ) {
          throw new Error(
            "El bloque candidato cambió durante el minado."
          );
        }

        const block =
          blockchain
            .addCandidateBlock();

        await storage.save(
          blockchain
        );

        const peerResults =
        await network.broadcastBlock(
            block
        );

        response.status(201).json({
          message:
            "Bloque minado y agregado correctamente.",

          block: {
            index:
              block.index,

            previousHash:
              block.previousHash,

            hash:
              block.hash,

            nonce:
              block.nonce,

            transactions:
              block.transactionCount
          },

          mining: {
            attempts:
              result.attempts,

            durationMs:
              result.durationMs,

            difficulty:
              blockchain.difficulty,

            mineChar:
              blockchain.mineChar,

            target:
              blockchain.target
          },

          network: {
            peers: 
                peerResults
          },

          blockchainValid:
            blockchain.isValid()
        });
      } catch (error) {
        next(error);
      } finally {
        /*
         * Incluso si ocurre un error,
         * liberamos el bloqueo.
         */
        miningInProgress = false;
      }
    }
  );

  // ===================================================
  // BLOCKCHAIN COMPLETA
  // ===================================================

  app.get(
    "/api/blockchain",
    (_request: Request, response: Response) => {
      response.json({
        difficulty:
          blockchain.difficulty,

        mineChar:
          blockchain.mineChar,

        target:
          blockchain.target,

        valid:
          blockchain.isValid(),

        blockCount:
          blockchain.blocks.length,

        blocks:
          blockchain.blocks.map(
            (block) =>
              block.toObject()
          )
      });
    }
  );

  // ===================================================
  // VALIDAR
  // ===================================================

  app.get(
    "/api/blockchain/validate",
    (_request: Request, response: Response) => {
      response.json({
        valid:
          blockchain.isValid(),

        blocks:
          blockchain.blocks.length
      });
    }
  );


  // ===================================================
// ESTADO DEL NODO
// ===================================================

app.get(
  "/api/network/status",
  (_request: Request, response: Response) => {
    response.json({
      node: nodeName,
      url: nodeUrl,

      valid:
        blockchain.isValid(),

      blocks:
        blockchain.blocks.length,

      lastBlock: {
        index:
          blockchain.lastBlock.index,

        hash:
          blockchain.lastBlock.hash
      },

      pendingTransactions:
        blockSec
          .getPendingTransactions()
          .length
    });
  }
);

// ===================================================
// COMPARTIR CADENA CONFIRMADA
// ===================================================

app.get(
  "/api/network/chain",
  (_request: Request, response: Response) => {
    const data =
      blockchain.toObject();

    /*
     * Las transacciones pendientes no forman
     * parte todavía de la Blockchain confirmada.
     */
    data.candidateBlock = null;

    response.json({
      node: nodeName,
      blockchain: data
    });
  }
);

// ===================================================
// RECIBIR BLOQUE DE OTRO NODO
// ===================================================

app.post(
  "/api/network/block",
  async (
    request: Request<
      Record<string, never>,
      unknown,
      {
        sourceNode?: string;
        block?: BlockObject;
      }
    >,
    response: Response,
    next: NextFunction
  ) => {
    try {
      if (!request.body?.block) {
        response.status(400).json({
          message:
            "No se recibió ningún bloque."
        });

        return;
      }

      const block =
        network.receiveBlock(
          request.body.block
        );

      await storage.save(
        blockchain
      );

      console.log(
        `${nodeName}: BLOCK #${block.index} recibido y validado.`
      );

      response.status(201).json({
        message:
          `BLOCK #${block.index} aceptado por ${nodeName}.`
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===================================================
// SINCRONIZAR MANUALMENTE
// ===================================================

app.post(
  "/api/network/sync",
  async (
    _request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const message =
        await network.synchronize();

      await storage.save(
        blockchain
      );

      response.json({
        message,

        blocks:
          blockchain.blocks.length,

        lastHash:
          blockchain.lastBlock.hash,

        valid:
          blockchain.isValid()
      });
    } catch (error) {
      next(error);
    }
  }
);

  // ===================================================
  // ERROR HANDLER
  // ===================================================

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction
    ) => {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Error interno del servidor.";

      response.status(400).json({
        message
      });
    }
  );

  return app;
}