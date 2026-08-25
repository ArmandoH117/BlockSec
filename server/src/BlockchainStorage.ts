import {
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";

import {
  dirname
} from "node:path";

import {
  Blockchain,
  BlockchainObject
} from "./Blockchain.js";

export class BlockchainStorage {
  constructor(
    private readonly filePath:
      string
  ) {}

  // =============================================
  // GUARDAR
  // =============================================

  public async save(
    blockchain: Blockchain
  ): Promise<void> {
    /*
     * Creamos la carpeta automáticamente
     * si todavía no existe.
     */
    await mkdir(
      dirname(this.filePath),
      {
        recursive: true
      }
    );

    const data =
      JSON.stringify(
        blockchain.toObject(),
        null,
        2
      );

    await writeFile(
      this.filePath,
      data,
      "utf8"
    );
  }

  // =============================================
  // CARGAR
  // =============================================

  public async load():
    Promise<Blockchain | null> {
    try {
      const content =
        await readFile(
          this.filePath,
          "utf8"
        );

      const data =
        JSON.parse(
          content
        ) as BlockchainObject;

      /*
       * fromObject() valida toda la cadena
       * antes de devolvérnosla.
       */
      return Blockchain.fromObject(
        data
      );
    } catch (error) {
      const fileError =
        error as
          NodeJS.ErrnoException;

      /*
       * Primera ejecución:
       * todavía no existe blockchain.json.
       */
      if (
        fileError.code ===
        "ENOENT"
      ) {
        return null;
      }

      throw error;
    }
  }
}