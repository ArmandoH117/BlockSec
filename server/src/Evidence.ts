export type EvidenceType =
  | "DISPOSITIVO_MOVIL"
  | "EQUIPO_COMPUTO"
  | "MEDIO_ALMACENAMIENTO"
  | "DOCUMENTO"
  | "OTRO";

export class Evidence {
  public readonly id: string;
  public readonly caseId: string;
  public readonly type: EvidenceType;
  public readonly description: string;
  public readonly serialOrImei: string;
  public readonly observations: string;
  public readonly createdAt: number;

  constructor(
    id: string,
    caseId: string,
    type: EvidenceType,
    description: string,
    serialOrImei: string = "",
    observations: string = "",
    createdAt: number = Date.now()
  ) {
    if (!id.trim()) {
      throw new Error("La evidencia debe tener un ID.");
    }

    if (!caseId.trim()) {
      throw new Error(
        "La evidencia debe pertenecer a un caso."
      );
    }

    if (!description.trim()) {
      throw new Error(
        "La evidencia debe tener una descripción."
      );
    }

    this.id = id;
    this.caseId = caseId;
    this.type = type;
    this.description = description.trim();
    this.serialOrImei = serialOrImei.trim();
    this.observations = observations.trim();
    this.createdAt = createdAt;

    Object.freeze(this);
  }
}