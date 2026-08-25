export type TransactionType =
  | "CASE_CREATED"
  | "EVIDENCE_REGISTERED"
  | "EVIDENCE_TRANSFERRED"
  | "EVIDENCE_ANALYZED"
  | "EVIDENCE_ARCHIVED";

export type TransactionData =
  Record<string, unknown>;

function deepFreeze<T>(
  value: T
): Readonly<T> {
  if (
    value !== null &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    Object.freeze(value);

    for (
      const property of
      Object.values(
        value as Record<
          string,
          unknown
        >
      )
    ) {
      deepFreeze(property);
    }
  }

  return value as Readonly<T>;
}

export class Transaction {
  public readonly id: string;
  public readonly type: TransactionType;
  public readonly data:
    Readonly<TransactionData>;
  public readonly timestamp: number;

  constructor(
    id: string,
    type: TransactionType,
    data: TransactionData,
    timestamp: number = Date.now()
  ) {
    if (!id.trim()) {
      throw new Error(
        "La transacción debe tener un ID."
      );
    }

    this.id = id;
    this.type = type;

    const dataCopy =
      structuredClone(data);

    this.data =
      deepFreeze(dataCopy);

    this.timestamp = timestamp;

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