import { Blockchain } from "./Blockchain.js";
import { CaseFile } from "./Case.js";
import {
  Evidence,
  EvidenceType
} from "./Evidence.js";
import {
  Transaction,
  TransactionData,
  TransactionType
} from "./Transaction.js";

// =====================================================
// DATOS DE LAS TRANSACCIONES
// =====================================================

interface CaseCreatedData extends TransactionData {
  caseId: string;
  description: string;
}

interface EvidenceRegisteredData
  extends TransactionData {
  caseId: string;
  evidenceId: string;
  type: EvidenceType;
  description: string;
  serialOrImei: string;
  observations: string;
  responsible: string;
}

interface EvidenceTransferredData
  extends TransactionData {
  caseId: string;
  evidenceId: string;
  previousResponsible: string;
  newResponsible: string;
  observations: string;
}

interface EvidenceAnalyzedData
  extends TransactionData {
  caseId: string;
  evidenceId: string;
  responsible: string;
  observations: string;
}

// =====================================================
// HISTORIAL
// =====================================================

export interface EvidenceHistoryEntry {
  transactionId: string;
  type: TransactionType;
  timestamp: number;

  blockIndex: number | null;

  confirmed: boolean;

  data: Readonly<TransactionData>;
}

export class BlockSecService {
  private nextCaseNumber: number;
  private nextEvidenceNumber: number;
  private nextTransactionNumber: number;

  constructor(
    private readonly blockchain: Blockchain
  ) {
    this.nextCaseNumber =
      this.findHighestNumber("CASE-") + 1;

    this.nextEvidenceNumber =
      this.findHighestNumber("EV-") + 1;

    this.nextTransactionNumber =
      this.findHighestNumber("TX-") + 1;
  }

  // ===================================================
  // CREAR CASO
  // ===================================================

  public createCase(
    description: string
  ): CaseFile {
    const id = this.generateCaseId();
    const createdAt = Date.now();

    const caseFile = new CaseFile(
      id,
      description,
      createdAt
    );

    this.ensureCandidateBlock();

    const transaction = new Transaction(
      this.generateTransactionId(),
      "CASE_CREATED",
      {
        caseId: caseFile.id,
        description: caseFile.description
      },
      createdAt
    );

    this.blockchain.addTransaction(transaction);

    return caseFile;
  }

  // ===================================================
  // REGISTRAR EVIDENCIA
  // ===================================================

  public registerEvidence(
    caseId: string,
    type: EvidenceType,
    description: string,
    responsible: string,
    serialOrImei: string = "",
    observations: string = ""
  ): Evidence {
    const existingCase =
      this.findCase(caseId);

    if (!existingCase) {
      throw new Error(
        `El caso ${caseId} no existe.`
      );
    }

    if (!responsible.trim()) {
      throw new Error(
        "Debe indicarse el responsable de la evidencia."
      );
    }

    const id = this.generateEvidenceId();
    const createdAt = Date.now();

    const evidence = new Evidence(
      id,
      caseId,
      type,
      description,
      serialOrImei,
      observations,
      createdAt
    );

    this.ensureCandidateBlock();

    const transaction = new Transaction(
      this.generateTransactionId(),
      "EVIDENCE_REGISTERED",
      {
        caseId: evidence.caseId,
        evidenceId: evidence.id,
        type: evidence.type,
        description: evidence.description,
        serialOrImei: evidence.serialOrImei,
        observations: evidence.observations,

        // Posteriormente este valor será cifrado
        // con AES-256-GCM.
        responsible: responsible.trim()
      },
      createdAt
    );

    this.blockchain.addTransaction(transaction);

    return evidence;
  }

  // ===================================================
  // TRANSFERIR EVIDENCIA
  // ===================================================

  public transferEvidence(
    evidenceId: string,
    newResponsible: string,
    observations: string = ""
  ): Transaction {
    const evidence =
      this.findConfirmedEvidence(evidenceId);

    if (!evidence) {
      throw new Error(
        `La evidencia ${evidenceId} no existe ` +
        "o todavía no ha sido minada."
      );
    }

    if (!newResponsible.trim()) {
      throw new Error(
        "Debe indicarse el nuevo responsable."
      );
    }

    const currentResponsible =
      this.getCurrentResponsible(evidenceId);

    if (!currentResponsible) {
      throw new Error(
        `No fue posible determinar el responsable actual de ${evidenceId}.`
      );
    }

    if (
      currentResponsible.toLowerCase() ===
      newResponsible.trim().toLowerCase()
    ) {
      throw new Error(
        "La evidencia ya se encuentra bajo la custodia de esa persona."
      );
    }

    this.ensureCandidateBlock();

    const transaction = new Transaction(
      this.generateTransactionId(),
      "EVIDENCE_TRANSFERRED",
      {
        caseId: evidence.caseId,
        evidenceId: evidence.id,
        previousResponsible:
          currentResponsible,
        newResponsible:
          newResponsible.trim(),
        observations:
          observations.trim()
      }
    );

    this.blockchain.addTransaction(transaction);

    return transaction;
  }

  // ===================================================
  // REGISTRAR ANÁLISIS
  // ===================================================

  public analyzeEvidence(
    evidenceId: string,
    observations: string
  ): Transaction {
    const evidence =
      this.findConfirmedEvidence(evidenceId);

    if (!evidence) {
      throw new Error(
        `La evidencia ${evidenceId} no existe ` +
        "o todavía no ha sido minada."
      );
    }

    if (!observations.trim()) {
      throw new Error(
        "Debe ingresar una descripción del análisis realizado."
      );
    }

    const currentResponsible =
      this.getCurrentResponsible(evidenceId);

    if (!currentResponsible) {
      throw new Error(
        `No fue posible determinar el responsable actual de ${evidenceId}.`
      );
    }

    this.ensureCandidateBlock();

    const transaction = new Transaction(
      this.generateTransactionId(),
      "EVIDENCE_ANALYZED",
      {
        caseId: evidence.caseId,
        evidenceId: evidence.id,

        // El análisis se atribuye automáticamente
        // al custodio actual.
        responsible:
          currentResponsible,

        observations:
          observations.trim()
      }
    );

    this.blockchain.addTransaction(transaction);

    return transaction;
  }

  // ===================================================
  // CONSULTAR CASOS
  // ===================================================

  public getCases(): CaseFile[] {
    return this.getAllTransactions()
      .filter(
        (transaction) =>
          transaction.type === "CASE_CREATED"
      )
      .map((transaction) => {
        const data =
          transaction.data as CaseCreatedData;

        return new CaseFile(
          data.caseId,
          data.description,
          transaction.timestamp
        );
      });
  }

  public findCase(
    caseId: string
  ): CaseFile | null {
    return (
      this.getCases().find(
        (caseFile) =>
          caseFile.id === caseId
      ) ?? null
    );
  }

  // ===================================================
  // CONSULTAR EVIDENCIAS
  // ===================================================

  public getEvidences(): Evidence[] {
    return this.getAllTransactions()
      .filter(
        (transaction) =>
          transaction.type ===
          "EVIDENCE_REGISTERED"
      )
      .map((transaction) =>
        this.evidenceFromTransaction(
          transaction
        )
      );
  }

  public getEvidencesByCase(
    caseId: string
  ): Evidence[] {
    return this.getEvidences().filter(
      (evidence) =>
        evidence.caseId === caseId
    );
  }

  public findEvidence(
    evidenceId: string
  ): Evidence | null {
    return (
      this.getEvidences().find(
        (evidence) =>
          evidence.id === evidenceId
      ) ?? null
    );
  }

  // ===================================================
  // RESPONSABLE ACTUAL
  // ===================================================

  public getCurrentResponsible(
    evidenceId: string
  ): string | null {
    let responsible: string | null = null;

    /*
     * IMPORTANTE:
     *
     * Solo utilizamos bloques CONFIRMADOS.
     * Una transferencia pendiente todavía
     * no cambia oficialmente la custodia.
     */

    for (
      const block of this.blockchain.blocks
    ) {
      for (
        const transaction of
        block.getTransactions()
      ) {
        if (
          !this.transactionBelongsToEvidence(
            transaction,
            evidenceId
          )
        ) {
          continue;
        }

        if (
          transaction.type ===
          "EVIDENCE_REGISTERED"
        ) {
          const data =
            transaction.data as
              EvidenceRegisteredData;

          responsible = data.responsible;
        }

        if (
          transaction.type ===
          "EVIDENCE_TRANSFERRED"
        ) {
          const data =
            transaction.data as
              EvidenceTransferredData;

          responsible =
            data.newResponsible;
        }
      }
    }

    return responsible;
  }

  // ===================================================
  // HISTORIAL DE EVIDENCIA
  // ===================================================

  public getEvidenceHistory(
    evidenceId: string
  ): EvidenceHistoryEntry[] {
    const history:
      EvidenceHistoryEntry[] = [];

    // -------------------------------
    // TRANSACCIONES YA MINADAS
    // -------------------------------

    for (
      const block of this.blockchain.blocks
    ) {
      for (
        const transaction of
        block.getTransactions()
      ) {
        if (
          this.transactionBelongsToEvidence(
            transaction,
            evidenceId
          )
        ) {
          history.push({
            transactionId:
              transaction.id,

            type:
              transaction.type,

            timestamp:
              transaction.timestamp,

            blockIndex:
              block.index,

            confirmed: true,

            data:
              transaction.data
          });
        }
      }
    }

    // -------------------------------
    // TRANSACCIONES PENDIENTES
    // -------------------------------

    const candidate =
      this.blockchain.getCandidateBlock();

    if (candidate) {
      for (
        const transaction of
        candidate.getTransactions()
      ) {
        if (
          this.transactionBelongsToEvidence(
            transaction,
            evidenceId
          )
        ) {
          history.push({
            transactionId:
              transaction.id,

            type:
              transaction.type,

            timestamp:
              transaction.timestamp,

            blockIndex: null,

            confirmed: false,

            data:
              transaction.data
          });
        }
      }
    }

    return history.sort(
      (a, b) =>
        a.timestamp - b.timestamp
    );
  }

  // ===================================================
  // ÚLTIMO EVENTO CONFIRMADO
  // ===================================================

  public getLastConfirmedEvent(
    evidenceId: string
  ): TransactionType | null {
    const confirmedHistory =
      this.getEvidenceHistory(
        evidenceId
      ).filter(
        (event) =>
          event.confirmed
      );

    const lastEvent =
      confirmedHistory[
        confirmedHistory.length - 1
      ];

    return lastEvent?.type ?? null;
  }

  // ===================================================
  // TRANSACCIONES PENDIENTES
  // ===================================================

  public getPendingTransactions():
    readonly Transaction[] {
    return (
      this.blockchain
        .getCandidateBlock()
        ?.getTransactions() ?? []
    );
  }

  // ===================================================
  // MÉTODOS PRIVADOS
  // ===================================================

  private ensureCandidateBlock(): void {
    if (
      !this.blockchain.getCandidateBlock()
    ) {
      this.blockchain
        .createCandidateBlock();
    }
  }

  private getAllTransactions():
    Transaction[] {
    const transactions:
      Transaction[] = [];

    for (
      const block of
      this.blockchain.blocks
    ) {
      transactions.push(
        ...block.getTransactions()
      );
    }

    const candidate =
      this.blockchain
        .getCandidateBlock();

    if (candidate) {
      transactions.push(
        ...candidate.getTransactions()
      );
    }

    return transactions;
  }

  private getConfirmedTransactions():
    Transaction[] {
    const transactions:
      Transaction[] = [];

    for (
      const block of
      this.blockchain.blocks
    ) {
      transactions.push(
        ...block.getTransactions()
      );
    }

    return transactions;
  }

  private findConfirmedEvidence(
    evidenceId: string
  ): Evidence | null {
    const transaction =
      this.getConfirmedTransactions()
        .find(
          (transaction) => {
            if (
              transaction.type !==
              "EVIDENCE_REGISTERED"
            ) {
              return false;
            }

            const data =
              transaction.data as
                EvidenceRegisteredData;

            return (
              data.evidenceId ===
              evidenceId
            );
          }
        );

    if (!transaction) {
      return null;
    }

    return this.evidenceFromTransaction(
      transaction
    );
  }

  private evidenceFromTransaction(
    transaction: Transaction
  ): Evidence {
    const data =
      transaction.data as
        EvidenceRegisteredData;

    return new Evidence(
      data.evidenceId,
      data.caseId,
      data.type,
      data.description,
      data.serialOrImei,
      data.observations,
      transaction.timestamp
    );
  }

  private transactionBelongsToEvidence(
    transaction: Transaction,
    evidenceId: string
  ): boolean {
    const value =
      transaction.data.evidenceId;

    return (
      typeof value === "string" &&
      value === evidenceId
    );
  }

  private generateCaseId(): string {
    const id =
      `CASE-${String(
        this.nextCaseNumber
      ).padStart(4, "0")}`;

    this.nextCaseNumber++;

    return id;
  }

  private generateEvidenceId(): string {
    const id =
      `EV-${String(
        this.nextEvidenceNumber
      ).padStart(6, "0")}`;

    this.nextEvidenceNumber++;

    return id;
  }

  private generateTransactionId(): string {
    const id =
      `TX-${String(
        this.nextTransactionNumber
      ).padStart(6, "0")}`;

    this.nextTransactionNumber++;

    return id;
  }

  private findHighestNumber(
    prefix: string
  ): number {
    let highest = 0;

    for (
      const transaction of
      this.getAllTransactions()
    ) {
      const values = [
        transaction.id,
        ...Object.values(
          transaction.data
        )
      ];

      for (const value of values) {
        if (
          typeof value !== "string"
        ) {
          continue;
        }

        if (
          !value.startsWith(prefix)
        ) {
          continue;
        }

        const number = Number(
          value.substring(
            prefix.length
          )
        );

        if (
          Number.isInteger(number) &&
          number > highest
        ) {
          highest = number;
        }
      }
    }

    return highest;
  }
}