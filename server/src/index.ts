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

console.log(
  "\n===================================="
);

console.log(
  "       BLOCKSEC - PERSISTENCIA"
);

console.log(
  "====================================\n"
);

// ===============================================
// STORAGE
// ===============================================

const storage =
  new BlockchainStorage(
    resolve(
      process.cwd(),
      "../data/blockchain.json"
    )
  );

// ===============================================
// INTENTAR CARGAR
// ===============================================

let blockchain =
  await storage.load();

const firstExecution =
  blockchain === null;

if (!blockchain) {
  console.log(
    "No existe una Blockchain almacenada."
  );

  console.log(
    "Creando una nueva Blockchain...\n"
  );

  blockchain =
    new Blockchain(
      4,
      "0"
    );
} else {
  console.log(
    "Blockchain cargada desde blockchain.json."
  );

  console.log(
    `Bloques cargados: ${blockchain.blocks.length}`
  );

  console.log(
    `Blockchain válida: ${
      blockchain.isValid()
        ? "SÍ"
        : "NO"
    }\n`
  );
}

// ===============================================
// SERVICIOS
// ===============================================

const encryption =
  new EncryptionService();

const blockSec =
  new BlockSecService(
    blockchain,
    encryption
  );

// ===============================================
// PRIMERA EJECUCIÓN
// ===============================================

if (firstExecution) {
  console.log(
    "--- CREANDO INFORMACIÓN INICIAL ---"
  );

  const case1 =
    blockSec.createCase(
      "Prueba de persistencia BlockSec."
    );

  console.log(
    `Caso generado: ${case1.id}`
  );

  const evidence =
    blockSec.registerEvidence(
      case1.id,
      "DISPOSITIVO_MOVIL",
      "iPhone 13 azul",
      "Salvador",
      "359403450123456"
    );

  console.log(
    `Evidencia generada: ${evidence.id}`
  );

  console.log(
    "\nMinando bloque..."
  );

  const result =
    blockchain
      .mineCandidateBlock();

  blockchain
    .addCandidateBlock();

  console.log(
    `Bloque #${result.block.index} minado.`
  );

  console.log(
    `Hash: ${result.block.hash}`
  );

  await storage.save(
    blockchain
  );

  console.log(
    "\nBlockchain guardada en blockchain.json."
  );

  console.log(
    "\nCIERRA Y EJECUTA npm start NUEVAMENTE."
  );
}

// ===============================================
// SEGUNDA EJECUCIÓN
// ===============================================

else {
  console.log(
    "--- COMPROBANDO CONTINUIDAD DE IDs ---"
  );

  const newCase =
    blockSec.createCase(
      "Segundo caso después de reiniciar."
    );

  console.log(
    `Nuevo caso generado: ${newCase.id}`
  );

  console.log(
    "\nDebería ser CASE-0002."
  );

  console.log(
    `Transacciones pendientes: ${
      blockSec
        .getPendingTransactions()
        .length
    }`
  );

  /*
   * Guardamos también el bloque candidato
   * para verificar que las transacciones
   * pendientes sobreviven al reinicio.
   */
  await storage.save(
    blockchain
  );

  console.log(
    "\nBloque candidato guardado correctamente."
  );
}

console.log(
  "\n====================================\n"
);