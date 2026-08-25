export class CaseFile {
  public readonly id: string;
  public readonly description: string;
  public readonly createdAt: number;

  constructor(
    id: string,
    description: string,
    createdAt: number = Date.now()
  ) {
    if (!id.trim()) {
      throw new Error("El caso debe tener un ID.");
    }

    if (!description.trim()) {
      throw new Error("El caso debe tener una descripción.");
    }

    this.id = id;
    this.description = description.trim();
    this.createdAt = createdAt;

    Object.freeze(this);
  }
}