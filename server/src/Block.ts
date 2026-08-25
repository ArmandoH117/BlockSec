import {
  createHash
} from "node:crypto";

import {
  Transaction,
  TransactionObject
} from "./Transaction.js";

export interface BlockObject {
  index: number;
  timestamp: number;
  previousHash: string;

  transactions:
    TransactionObject[];

  nonce: number;
  hash: string;
  mined: boolean;
}

export class Block {
  public readonly index: number;
  public readonly timestamp: number;
  public readonly previousHash: string;

  private readonly transactions:
    Transaction[] = [];

  private _nonce: number = 0;
  private _hash: string = "";

  private mined: boolean = false;

  constructor(
    index: number,
    previousHash: string,
    timestamp: number = Date.now()
  ) {
    this.index = index;

    this.previousHash =
      previousHash;

    this.timestamp =
      timestamp;
  }

  // =============================================
  // GETTERS
  // =============================================

  public get nonce(): number {
    return this._nonce;
  }

  public get hash(): string {
    return this._hash;
  }

  public get isMined(): boolean {
    return this.mined;
  }

  public get transactionCount(): number {
    return this.transactions.length;
  }

  // =============================================
  // TRANSACCIONES
  // =============================================

  public addTransaction(
    transaction: Transaction
  ): void {
    this.ensureNotMined();

    const alreadyExists =
      this.transactions.some(
        (currentTransaction) =>
          currentTransaction.id ===
          transaction.id
      );

    if (alreadyExists) {
      throw new Error(
        `La transacción ${transaction.id} ` +
        "ya existe en el bloque candidato."
      );
    }

    this.transactions.push(
      transaction
    );
  }

  public replaceTransaction(
    transactionId: string,
    newTransaction: Transaction
  ): void {
    this.ensureNotMined();

    const index =
      this.transactions.findIndex(
        (transaction) =>
          transaction.id ===
          transactionId
      );

    if (index === -1) {
      throw new Error(
        `No se encontró la transacción ${transactionId}.`
      );
    }

    this.transactions[index] =
      newTransaction;
  }

  public removeTransaction(
    transactionId: string
  ): void {
    this.ensureNotMined();

    const index =
      this.transactions.findIndex(
        (transaction) =>
          transaction.id ===
          transactionId
      );

    if (index === -1) {
      throw new Error(
        `No se encontró la transacción ${transactionId}.`
      );
    }

    this.transactions.splice(
      index,
      1
    );
  }

  public getTransactions():
    readonly Transaction[] {
    return [
      ...this.transactions
    ];
  }

  // =============================================
  // HASH
  // =============================================

  public calculateHash(
    nonce: number =
      this._nonce
  ): string {
    const blockData =
      JSON.stringify({
        index:
          this.index,

        timestamp:
          this.timestamp,

        previousHash:
          this.previousHash,

        transactions:
          this.transactions.map(
            (transaction) =>
              transaction.toObject()
          ),

        nonce
      });

    return createHash("sha256")
      .update(blockData)
      .digest("hex");
  }

  // =============================================
  // SELLAR BLOQUE
  // =============================================

  public seal(
    nonce: number,
    hash: string
  ): void {
    this.ensureNotMined();

    const calculatedHash =
      this.calculateHash(nonce);

    if (
      calculatedHash !== hash
    ) {
      throw new Error(
        "El hash proporcionado no corresponde " +
        "con la información del bloque."
      );
    }

    this._nonce = nonce;
    this._hash = hash;

    this.mined = true;

    /*
     * A partir de aquí el bloque no puede
     * modificarse.
     */
    Object.freeze(
      this.transactions
    );

    Object.freeze(this);
  }

  // =============================================
  // SERIALIZAR
  // =============================================

  public toObject(): BlockObject {
    return {
      index:
        this.index,

      timestamp:
        this.timestamp,

      previousHash:
        this.previousHash,

      transactions:
        this.transactions.map(
          (transaction) =>
            transaction.toObject()
        ),

      nonce:
        this._nonce,

      hash:
        this._hash,

      mined:
        this.mined
    };
  }

  // =============================================
  // RECONSTRUIR DESDE JSON
  // =============================================

  public static fromObject(
    data: BlockObject
  ): Block {
    const block = new Block(
      data.index,
      data.previousHash,
      data.timestamp
    );

    for (
      const transactionData of
      data.transactions
    ) {
      block.addTransaction(
        Transaction.fromObject(
          transactionData
        )
      );
    }

    if (data.mined) {
      block.seal(
        data.nonce,
        data.hash
      );
    } else {
      /*
       * Un bloque candidato almacenado
       * correctamente todavía no tiene
       * nonce/hash definitivo.
       */
      if (
        data.nonce !== 0 ||
        data.hash !== ""
      ) {
        throw new Error(
          `El bloque candidato #${data.index} ` +
          "posee datos de minado inconsistentes."
        );
      }
    }

    return block;
  }

  // =============================================
  // PROTECCIÓN
  // =============================================

  private ensureNotMined(): void {
    if (this.mined) {
      throw new Error(
        `El bloque #${this.index} ` +
        "ya fue minado y no puede modificarse."
      );
    }
  }
}