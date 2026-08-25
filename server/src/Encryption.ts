import {
  createCipheriv,
  createDecipheriv,
  randomBytes
} from "node:crypto";

import { loadEnvFile } from "node:process";

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export class EncryptionService {
  private readonly key: Buffer;

  constructor(keyHex?: string) {
    let finalKey = keyHex;

    if (!finalKey) {
      try {
        loadEnvFile(".env");
      } catch {
        throw new Error(
          "No se encontró el archivo .env del servidor."
        );
      }

      finalKey =
        process.env.BLOCKSEC_AES_KEY;
    }

    if (!finalKey) {
      throw new Error(
        "No se encontró BLOCKSEC_AES_KEY."
      );
    }

    if (!/^[0-9a-fA-F]{64}$/.test(finalKey)) {
      throw new Error(
        "BLOCKSEC_AES_KEY debe contener exactamente " +
        "64 caracteres hexadecimales."
      );
    }

    this.key = Buffer.from(
      finalKey,
      "hex"
    );
  }

  public encrypt(
    plainText: string
  ): EncryptedData {
    if (!plainText.trim()) {
      throw new Error(
        "No se puede cifrar un texto vacío."
      );
    }

    /*
     * GCM recomienda un IV de 12 bytes.
     * Se genera uno nuevo para cada cifrado.
     */
    const iv = randomBytes(12);

    const cipher = createCipheriv(
      "aes-256-gcm",
      this.key,
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(
        plainText,
        "utf8"
      ),
      cipher.final()
    ]);

    const authTag =
      cipher.getAuthTag();

    return {
      ciphertext:
        encrypted.toString("hex"),

      iv:
        iv.toString("hex"),

      authTag:
        authTag.toString("hex")
    };
  }

  public decrypt(
    encryptedData: EncryptedData
  ): string {
    try {
      const iv = Buffer.from(
        encryptedData.iv,
        "hex"
      );

      const authTag = Buffer.from(
        encryptedData.authTag,
        "hex"
      );

      const ciphertext = Buffer.from(
        encryptedData.ciphertext,
        "hex"
      );

      const decipher =
        createDecipheriv(
          "aes-256-gcm",
          this.key,
          iv
        );

      decipher.setAuthTag(authTag);

      const decrypted =
        Buffer.concat([
          decipher.update(ciphertext),
          decipher.final()
        ]);

      return decrypted.toString("utf8");
    } catch {
      throw new Error(
        "No fue posible descifrar la información. " +
        "Los datos o la clave podrían haber sido alterados."
      );
    }
  }
}