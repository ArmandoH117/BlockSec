import { Blockchain } from "./Blockchain.js";
import { CaseFile } from "./Case.js";
import {
  Evidence,
  EvidenceType
} from "./Evidence.js";
import {
  Transaction,
  TransactionData
} from "./Transaction.js";

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

  // -------------------------------------
  // CREAR CASO
  // -------------------------------------

  public createCase(description: string): CaseFile {
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

  // -------------------------------------
  // REGISTRAR EVIDENCIA
  // -------------------------------------

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

        // Más adelante este valor será cifrado
        // mediante AES-256-GCM.
        responsible: responsible.trim()
      },
      createdAt
    );

    this.blockchain.addTransaction(transaction);

    return evidence;
  }

  // -------------------------------------
  // CONSULTAR CASOS
  // -------------------------------------

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
        (caseFile) => caseFile.id === caseId
      ) ?? null
    );
  }

  // -------------------------------------
  // CONSULTAR EVIDENCIAS
  // -------------------------------------

  public getEvidences(): Evidence[] {
    return this.getAllTransactions()
      .filter(
        (transaction) =>
          transaction.type ===
          "EVIDENCE_REGISTERED"
      )
      .map((transaction) => {
        const data =
          transaction.data as EvidenceRegisteredData;

        return new Evidence(
          data.evidenceId,
          data.caseId,
          data.type,
          data.description,
          data.serialOrImei,
          data.observations,
          transaction.timestamp
        );
      });
  }

  public getEvidencesByCase(
    caseId: string
  ): Evidence[] {
    return this.getEvidences().filter(
      (evidence) => evidence.caseId === caseId
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

  // -------------------------------------
  // TRANSACCIONES PENDIENTES
  // -------------------------------------

  public getPendingTransactions():
    readonly Transaction[] {
    return (
      this.blockchain
        .getCandidateBlock()
        ?.getTransactions() ?? []
    );
  }

  // -------------------------------------
  // MÉTODOS PRIVADOS
  // -------------------------------------

  private ensureCandidateBlock(): void {
    if (!this.blockchain.getCandidateBlock()) {
      this.blockchain.createCandidateBlock();
    }
  }

  private getAllTransactions():
    Transaction[] {
    const transactions: Transaction[] = [];

    for (
      const block of this.blockchain.blocks
    ) {
      transactions.push(
        ...block.getTransactions()
      );
    }

    const candidate =
      this.blockchain.getCandidateBlock();

    if (candidate) {
      transactions.push(
        ...candidate.getTransactions()
      );
    }

    return transactions;
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
        ...Object.values(transaction.data)
      ];

      for (const value of values) {
        if (typeof value !== "string") {
          continue;
        }

        if (!value.startsWith(prefix)) {
          continue;
        }

        const number = Number(
          value.substring(prefix.length)
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