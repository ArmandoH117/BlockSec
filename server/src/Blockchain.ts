import { Block } from "./Block.js";
import { Transaction } from "./Transaction.js";

export interface MiningResult {
  block: Block;
  attempts: number;
  durationMs: number;
}

const GENESIS_PREVIOUS_HASH = "0".repeat(64);

export class Blockchain {
  private readonly chain: Block[] = [];
  private candidateBlock: Block | null = null;

  public readonly difficulty: number;
  public readonly mineChar: string;

  constructor(
    difficulty: number = 4,
    mineChar: string = "0"
  ) {
    if (
      !Number.isInteger(difficulty) ||
      difficulty < 1 ||
      difficulty > 6
    ) {
      throw new Error(
        "La dificultad debe ser un número entero entre 1 y 6."
      );
    }

    const normalizedMineChar = mineChar.toLowerCase();

    if (!/^[0-9a-f]$/.test(normalizedMineChar)) {
      throw new Error(
        "El carácter de minado debe ser hexadecimal: 0-9 o a-f."
      );
    }

    this.difficulty = difficulty;
    this.mineChar = normalizedMineChar;

    this.createGenesisBlock();
  }

  public get target(): string {
    return this.mineChar.repeat(this.difficulty);
  }

  public get blocks(): readonly Block[] {
    return [...this.chain];
  }

  public get lastBlock(): Block {
    const block = this.chain[this.chain.length - 1];

    if (!block) {
      throw new Error("La Blockchain no contiene bloques.");
    }

    return block;
  }

  public getCandidateBlock(): Block | null {
    return this.candidateBlock;
  }

  public createCandidateBlock(): Block {
    if (this.candidateBlock !== null) {
      throw new Error(
        "Ya existe un bloque candidato pendiente."
      );
    }

    const block = new Block(
      this.chain.length,
      this.lastBlock.hash
    );

    this.candidateBlock = block;

    return block;
  }

  public addTransaction(transaction: Transaction): void {
    if (!this.candidateBlock) {
      throw new Error(
        "Primero debe crearse un bloque candidato."
      );
    }

    this.candidateBlock.addTransaction(transaction);
  }

  public mineCandidateBlock(): MiningResult {
    if (!this.candidateBlock) {
      throw new Error(
        "No existe un bloque candidato para minar."
      );
    }

    if (this.candidateBlock.transactionCount === 0) {
      throw new Error(
        "No se puede minar un bloque sin transacciones."
      );
    }

    return this.mineBlock(this.candidateBlock);
  }

  public addCandidateBlock(): Block {
    if (!this.candidateBlock) {
      throw new Error(
        "No existe un bloque candidato."
      );
    }

    this.addBlock(this.candidateBlock);

    const addedBlock = this.candidateBlock;

    this.candidateBlock = null;

    return addedBlock;
  }

  public mineBlock(block: Block): MiningResult {
    if (block.isMined) {
      throw new Error(
        `El bloque #${block.index} ya fue minado.`
      );
    }

    const startTime = Date.now();

    let nonce = 0;
    let attempts = 0;

    while (true) {
      const hash = block.calculateHash(nonce);

      attempts++;

      if (hash.startsWith(this.target)) {
        block.seal(nonce, hash);

        return {
          block,
          attempts,
          durationMs: Date.now() - startTime
        };
      }

      nonce++;
    }
  }

  public addBlock(block: Block): void {
    if (!block.isMined) {
      throw new Error(
        "El bloque debe ser minado antes de agregarse a la Blockchain."
      );
    }

    if (block.index !== this.chain.length) {
      throw new Error(
        "El índice del bloque no corresponde con la posición esperada."
      );
    }

    if (block.previousHash !== this.lastBlock.hash) {
      throw new Error(
        "El previousHash no coincide con el hash del último bloque."
      );
    }

    if (!this.hasValidHash(block)) {
      throw new Error(
        "El bloque no posee un hash válido."
      );
    }

    this.chain.push(block);
  }

  public isValid(): boolean {
    for (let index = 0; index < this.chain.length; index++) {
      const currentBlock = this.chain[index];

      if (!currentBlock) {
        return false;
      }

      if (currentBlock.index !== index) {
        return false;
      }

      if (!this.hasValidHash(currentBlock)) {
        return false;
      }

      if (index === 0) {
        if (
          currentBlock.previousHash !==
          GENESIS_PREVIOUS_HASH
        ) {
          return false;
        }

        continue;
      }

      const previousBlock = this.chain[index - 1];

      if (!previousBlock) {
        return false;
      }

      if (
        currentBlock.previousHash !==
        previousBlock.hash
      ) {
        return false;
      }
    }

    return true;
  }

  private createGenesisBlock(): void {
    const genesis = new Block(
      0,
      GENESIS_PREVIOUS_HASH
    );

    this.mineBlock(genesis);

    this.chain.push(genesis);
  }

  private hasValidHash(block: Block): boolean {
    const recalculatedHash =
      block.calculateHash(block.nonce);

    const hashMatches =
      recalculatedHash === block.hash;

    const proofOfWorkIsValid =
      block.hash.startsWith(this.target);

    return hashMatches && proofOfWorkIsValid;
  }
}