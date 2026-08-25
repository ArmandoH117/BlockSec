import {
  resolve
} from "node:path";

import {
  Blockchain
} from "./Blockchain.js";

import {
  BlockchainStorage
} from "./BlockchainStorage.js";

import {
  BlockSecService
} from "./BlockSecService.js";

import {
  EncryptionService
} from "./Encryption.js";

import {
  createApi
} from "./api.js";

// =====================================================
// CONFIGURACIÓN DEL NODO
// =====================================================

const PORT = 3001;

const NODE_NAME =
  "NODE-1";

const DATA_FILE =
  resolve(
    process.cwd(),
    `../data/blockchain-${PORT}.json`
  );

// =====================================================
// STORAGE
// =====================================================

const storage =
  new BlockchainStorage(
    DATA_FILE
  );

// =====================================================
// CARGAR BLOCKCHAIN
// =====================================================

let blockchain =
  await storage.load();

if (!blockchain) {
  console.log(
    "No existe una Blockchain almacenada."
  );

  console.log(
    "Creando Blockchain y minando Génesis..."
  );

  blockchain =
    new Blockchain(
      4,
      "0"
    );

  await storage.save(
    blockchain
  );

  console.log(
    "Bloque Génesis creado y guardado."
  );
} else {
  console.log(
    "Blockchain cargada desde almacenamiento."
  );
}

// =====================================================
// SEGURIDAD
// =====================================================

const encryption =
  new EncryptionService();

// =====================================================
// SERVICIO BLOCKSEC
// =====================================================

const blockSec =
  new BlockSecService(
    blockchain,
    encryption
  );

// =====================================================
// API
// =====================================================

const app =
  createApi(
    blockchain,
    blockSec,
    storage
  );

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(
  PORT,
  () => {
    console.log(
      "\n===================================="
    );

    console.log(
      `          BLOCKSEC ${NODE_NAME}`
    );

    console.log(
      "===================================="
    );

    console.log(
      `Servidor: http://localhost:${PORT}`
    );

    console.log(
      `Dificultad: ${blockchain.difficulty}`
    );

    console.log(
      `Carácter: ${blockchain.mineChar}`
    );

    console.log(
      `Objetivo: ${blockchain.target}`
    );

    console.log(
      `Bloques: ${blockchain.blocks.length}`
    );

    console.log(
      `Blockchain válida: ${
        blockchain.isValid()
          ? "SÍ"
          : "NO"
      }`
    );

    console.log(
      "====================================\n"
    );
  }
);