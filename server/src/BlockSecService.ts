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

import {
  EncryptedData,
  EncryptionService
} from "./Encryption.js";

// =====================================================
// TIPOS DE DATOS DE LAS TRANSACCIONES
// =====================================================

type CaseCreatedData = TransactionData & {
  caseId: string;
  description: string;
};

type EvidenceRegisteredData = TransactionData & {
  caseId: string;
  evidenceId: string;
  type: EvidenceType;
  description: string;
  serialOrImei: string;
  observations: string;

  // La identidad se almacena cifrada.
  responsible: EncryptedData;
};

type EvidenceTransferredData = TransactionData & {
  caseId: string;
  evidenceId: string;

  // Ambas identidades quedan cifradas.
  previousResponsible: EncryptedData;
  newResponsible: EncryptedData;

  observations: string;
};

type EvidenceAnalyzedData = TransactionData & {
  caseId: string;
  evidenceId: string;

  // Responsable del análisis cifrado.
  responsible: EncryptedData;

  observations: string;
};

// =====================================================
// HISTORIAL DE EVIDENCIA
// =====================================================

export interface EvidenceHistoryEntry {
  transactionId: string;

  type: TransactionType;

  timestamp: number;

  /*
   * null significa que la transacción todavía
   * pertenece al bloque candidato.
   */
  blockIndex: number | null;

  confirmed: boolean;

  data: Readonly<TransactionData>;
}

// =====================================================
// SERVICIO PRINCIPAL
// =====================================================

export class BlockSecService {
  private nextCaseNumber: number;
  private nextEvidenceNumber: number;
  private nextTransactionNumber: number;

  constructor(
    private readonly blockchain: Blockchain,
    private readonly encryption: EncryptionService
  ) {
    /*
     * Cuando posteriormente carguemos blockchain.json,
     * estos métodos permitirán continuar los consecutivos
     * sin repetir identificadores.
     */
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

    this.blockchain.addTransaction(
      transaction
    );

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

    const id =
      this.generateEvidenceId();

    const createdAt =
      Date.now();

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

    /*
     * Ciframos la identidad ANTES de enviar
     * la información a Blockchain.
     */
    const encryptedResponsible =
      this.encryption.encrypt(
        responsible.trim()
      );

    const transaction =
      new Transaction(
        this.generateTransactionId(),
        "EVIDENCE_REGISTERED",
        {
          caseId:
            evidence.caseId,

          evidenceId:
            evidence.id,

          type:
            evidence.type,

          description:
            evidence.description,

          serialOrImei:
            evidence.serialOrImei,

          observations:
            evidence.observations,

          responsible:
            encryptedResponsible
        },
        createdAt
      );

    this.blockchain.addTransaction(
      transaction
    );

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
    /*
     * Solo permitimos operar sobre evidencias
     * que ya hayan sido confirmadas/minadas.
     */
    const evidence =
      this.findConfirmedEvidence(
        evidenceId
      );

    if (!evidence) {
      throw new Error(
        `La evidencia ${evidenceId} no existe ` +
        "o todavía no ha sido minada."
      );
    }

    const cleanNewResponsible =
      newResponsible.trim();

    if (!cleanNewResponsible) {
      throw new Error(
        "Debe indicarse el nuevo responsable."
      );
    }

    const currentResponsible =
      this.getCurrentResponsible(
        evidenceId
      );

    if (!currentResponsible) {
      throw new Error(
        `No fue posible determinar el responsable actual de ${evidenceId}.`
      );
    }

    if (
      currentResponsible.toLowerCase() ===
      cleanNewResponsible.toLowerCase()
    ) {
      throw new Error(
        "La evidencia ya se encuentra bajo la custodia de esa persona."
      );
    }

    this.ensureCandidateBlock();

    /*
     * Ninguna identidad se guarda como texto
     * plano en la Blockchain.
     */
    const encryptedPreviousResponsible =
      this.encryption.encrypt(
        currentResponsible
      );

    const encryptedNewResponsible =
      this.encryption.encrypt(
        cleanNewResponsible
      );

    const transaction =
      new Transaction(
        this.generateTransactionId(),
        "EVIDENCE_TRANSFERRED",
        {
          caseId:
            evidence.caseId,

          evidenceId:
            evidence.id,

          previousResponsible:
            encryptedPreviousResponsible,

          newResponsible:
            encryptedNewResponsible,

          observations:
            observations.trim()
        }
      );

    this.blockchain.addTransaction(
      transaction
    );

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
      this.findConfirmedEvidence(
        evidenceId
      );

    if (!evidence) {
      throw new Error(
        `La evidencia ${evidenceId} no existe ` +
        "o todavía no ha sido minada."
      );
    }

    const cleanObservations =
      observations.trim();

    if (!cleanObservations) {
      throw new Error(
        "Debe ingresar una descripción del análisis realizado."
      );
    }

    /*
     * El analista se obtiene automáticamente
     * del responsable actual confirmado.
     */
    const currentResponsible =
      this.getCurrentResponsible(
        evidenceId
      );

    if (!currentResponsible) {
      throw new Error(
        `No fue posible determinar el responsable actual de ${evidenceId}.`
      );
    }

    this.ensureCandidateBlock();

    const encryptedResponsible =
      this.encryption.encrypt(
        currentResponsible
      );

    const transaction =
      new Transaction(
        this.generateTransactionId(),
        "EVIDENCE_ANALYZED",
        {
          caseId:
            evidence.caseId,

          evidenceId:
            evidence.id,

          responsible:
            encryptedResponsible,

          observations:
            cleanObservations
        }
      );

    this.blockchain.addTransaction(
      transaction
    );

    return transaction;
  }

  // ===================================================
  // CONSULTAR CASOS
  // ===================================================

  public getCases(): CaseFile[] {
    return this.getAllTransactions()
      .filter(
        (transaction) =>
          transaction.type ===
          "CASE_CREATED"
      )
      .map(
        (transaction) => {
          const data =
            transaction.data as
              CaseCreatedData;

          return new CaseFile(
            data.caseId,
            data.description,
            transaction.timestamp
          );
        }
      );
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
      .map(
        (transaction) =>
          this.evidenceFromTransaction(
            transaction
          )
      );
  }

  public getEvidencesByCase(
    caseId: string
  ): Evidence[] {
    return this.getEvidences()
      .filter(
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
  // RESPONSABLE ACTUAL CONFIRMADO
  // ===================================================

  public getCurrentResponsible(
    evidenceId: string
  ): string | null {
    let responsible:
      string | null = null;

    /*
     * IMPORTANTE:
     *
     * Solamente recorremos bloques ya minados.
     *
     * Una transferencia que todavía se encuentre
     * en el bloque candidato NO modifica todavía
     * la custodia oficialmente confirmada.
     */

    for (
      const block of
      this.blockchain.blocks
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

        // ---------------------------------------------
        // REGISTRO ORIGINAL
        // ---------------------------------------------

        if (
          transaction.type ===
          "EVIDENCE_REGISTERED"
        ) {
          const data =
            transaction.data as
              EvidenceRegisteredData;

          responsible =
            this.encryption.decrypt(
              data.responsible
            );
        }

        // ---------------------------------------------
        // TRANSFERENCIA
        // ---------------------------------------------

        if (
          transaction.type ===
          "EVIDENCE_TRANSFERRED"
        ) {
          const data =
            transaction.data as
              EvidenceTransferredData;

          responsible =
            this.encryption.decrypt(
              data.newResponsible
            );
        }
      }
    }

    return responsible;
  }

  // ===================================================
  // HISTORIAL COMPLETO DE EVIDENCIA
  // ===================================================

  public getEvidenceHistory(
    evidenceId: string
  ): EvidenceHistoryEntry[] {
    const history:
      EvidenceHistoryEntry[] = [];

    // -------------------------------------------------
    // TRANSACCIONES CONFIRMADAS
    // -------------------------------------------------

    for (
      const block of
      this.blockchain.blocks
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

            confirmed:
              true,

            data:
              transaction.data
          });
        }
      }
    }

    // -------------------------------------------------
    // TRANSACCIONES TODAVÍA PENDIENTES
    // -------------------------------------------------

    const candidate =
      this.blockchain
        .getCandidateBlock();

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

            blockIndex:
              null,

            confirmed:
              false,

            data:
              transaction.data
          });
        }
      }
    }

    return history.sort(
      (a, b) =>
        a.timestamp -
        b.timestamp
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

    return (
      lastEvent?.type ?? null
    );
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
      !this.blockchain
        .getCandidateBlock()
    ) {
      this.blockchain
        .createCandidateBlock();
    }
  }

  // ---------------------------------------------------
  // TODAS LAS TRANSACCIONES
  // ---------------------------------------------------

  private getAllTransactions():
    Transaction[] {
    const transactions:
      Transaction[] = [];

    // Bloques confirmados
    for (
      const block of
      this.blockchain.blocks
    ) {
      transactions.push(
        ...block.getTransactions()
      );
    }

    // Bloque candidato
    const candidate =
      this.blockchain
        .getCandidateBlock();

    if (candidate) {
      transactions.push(
        ...candidate
          .getTransactions()
      );
    }

    return transactions;
  }

  // ---------------------------------------------------
  // SOLO TRANSACCIONES CONFIRMADAS
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // BUSCAR EVIDENCIA YA MINADA
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // CONSTRUIR OBJETO EVIDENCE DESDE BLOCKCHAIN
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // COMPROBAR SI TX PERTENECE A EVIDENCIA
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // GENERACIÓN AUTOMÁTICA DE IDs
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // ENCONTRAR MAYOR CONSECUTIVO EXISTENTE
  // ---------------------------------------------------

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

      for (
        const value of values
      ) {
        /*
         * Los objetos EncryptedData llegarán aquí,
         * pero simplemente se ignoran porque no son
         * strings.
         */
        if (
          typeof value !== "string"
        ) {
          continue;
        }

        if (
          !value.startsWith(
            prefix
          )
        ) {
          continue;
        }

        const number =
          Number(
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