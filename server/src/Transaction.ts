export type TransactionType =
  | "CASE_CREATED"
  | "EVIDENCE_REGISTERED"
  | "EVIDENCE_TRANSFERRED"
  | "EVIDENCE_ANALYZED"
  | "EVIDENCE_ARCHIVED";

export type TransactionData = Record<string, unknown>;

export class Transaction {
  public readonly id: string;
  public readonly type: TransactionType;
  public readonly data: Readonly<TransactionData>;
  public readonly timestamp: number;

  constructor(
    id: string,
    type: TransactionType,
    data: TransactionData,
    timestamp: number = Date.now()
  ) {
    if (!id.trim()) {
      throw new Error("La transacción debe tener un ID.");
    }

    this.id = id;
    this.type = type;

    // Guardamos una copia para evitar modificaciones externas accidentales.
    this.data = Object.freeze(structuredClone(data));

    this.timestamp = timestamp;

    // Una transacción creada no se modifica.
    // Si está pendiente y queremos editarla,
    // reemplazaremos la transacción completa.
    Object.freeze(this);
  }

  public toObject() {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      timestamp: this.timestamp
    };
  }
}