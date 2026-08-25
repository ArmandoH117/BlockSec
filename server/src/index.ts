import { Blockchain } from "./Blockchain.js";
import { BlockSecService } from "./BlockSecService.js";

console.log("\n====================================");
console.log("            BLOCKSEC");
console.log("====================================\n");

const blockchain =
  new Blockchain(4, "0");

const blockSec =
  new BlockSecService(blockchain);

// =====================================================
// FASE 1
// CASO + EVIDENCIAS
// =====================================================

console.log(
  "--- FASE 1: CASO Y EVIDENCIAS ---\n"
);

const case1 =
  blockSec.createCase(
    "Investigación de acceso no autorizado."
  );

const evidence1 =
  blockSec.registerEvidence(
    case1.id,
    "DISPOSITIVO_MOVIL",
    "iPhone 13 azul",
    "Salvador",
    "359403450123456"
  );

const evidence2 =
  blockSec.registerEvidence(
    case1.id,
    "MEDIO_ALMACENAMIENTO",
    "USB Kingston 32 GB",
    "Salvador",
    "KS32-A921"
  );

console.log(
  `Caso creado: ${case1.id}`
);

console.log(
  `${evidence1.id} → ${case1.id}`
);

console.log(
  `${evidence2.id} → ${case1.id}`
);

console.log(
  "\nTransacciones pendientes:"
);

for (
  const transaction of
  blockSec.getPendingTransactions()
) {
  console.log(
    `${transaction.id} | ${transaction.type}`
  );
}

// =====================================================
// MINAR BLOQUE #1
// =====================================================

console.log(
  "\nMinando bloque #1..."
);

const result1 =
  blockchain.mineCandidateBlock();

blockchain.addCandidateBlock();

console.log(
  `Bloque #${result1.block.index} minado.`
);

console.log(
  `Hash: ${result1.block.hash}`
);

console.log(
  `Blockchain válida: ${
    blockchain.isValid()
      ? "SÍ"
      : "NO"
  }`
);

// =====================================================
// VERIFICAR RESPONSABLE
// =====================================================

console.log(
  "\n--- CUSTODIA CONFIRMADA ---"
);

console.log(
  `${evidence1.id}: ${
    blockSec.getCurrentResponsible(
      evidence1.id
    )
  }`
);

// =====================================================
// FASE 2
// TRANSFERENCIA
// =====================================================

console.log(
  "\n--- TRANSFERENCIA ---"
);

blockSec.transferEvidence(
  evidence1.id,
  "Carlos",
  "Entregada para análisis forense."
);

console.log(
  "Transferencia agregada al bloque candidato."
);

console.log(
  "\nResponsable confirmado ANTES de minar:"
);

console.log(
  blockSec.getCurrentResponsible(
    evidence1.id
  )
);

// =====================================================
// MOSTRAR HISTORIAL CON PENDIENTE
// =====================================================

console.log(
  "\nHistorial antes del minado:"
);

for (
  const event of
  blockSec.getEvidenceHistory(
    evidence1.id
  )
) {
  console.log(
    `${event.transactionId} | ` +
    `${event.type} | ` +
    `${
      event.confirmed
        ? `BLOCK #${event.blockIndex}`
        : "PENDIENTE"
    }`
  );
}

// =====================================================
// MINAR BLOQUE #2
// =====================================================

console.log(
  "\nMinando bloque #2..."
);

const result2 =
  blockchain.mineCandidateBlock();

blockchain.addCandidateBlock();

console.log(
  `Bloque #${result2.block.index} minado.`
);

// =====================================================
// RESPONSABLE DESPUÉS DE MINAR
// =====================================================

console.log(
  "\nResponsable confirmado DESPUÉS de minar:"
);

console.log(
  blockSec.getCurrentResponsible(
    evidence1.id
  )
);

// =====================================================
// FASE 3
// ANÁLISIS
// =====================================================

console.log(
  "\n--- REGISTRAR ANÁLISIS ---"
);

blockSec.analyzeEvidence(
  evidence1.id,
  "Se realizó revisión del dispositivo y extracción de información relevante."
);

console.log(
  "Análisis agregado al bloque candidato."
);

// =====================================================
// MINAR BLOQUE #3
// =====================================================

console.log(
  "\nMinando bloque #3..."
);

const result3 =
  blockchain.mineCandidateBlock();

blockchain.addCandidateBlock();

console.log(
  `Bloque #${result3.block.index} minado.`
);

// =====================================================
// HISTORIAL FINAL
// =====================================================

console.log(
  "\n--- HISTORIAL FINAL ---"
);

for (
  const event of
  blockSec.getEvidenceHistory(
    evidence1.id
  )
) {
  console.log(
    `${event.transactionId} | ` +
    `${event.type} | ` +
    `BLOCK #${event.blockIndex}`
  );
}

// =====================================================
// RESULTADO
// =====================================================

console.log(
  "\n--- RESULTADO FINAL ---"
);

console.log(
  `Responsable actual: ${
    blockSec.getCurrentResponsible(
      evidence1.id
    )
  }`
);

console.log(
  `Último evento: ${
    blockSec.getLastConfirmedEvent(
      evidence1.id
    )
  }`
);

console.log(
  `Bloques totales: ${
    blockchain.blocks.length
  }`
);

console.log(
  `Blockchain válida: ${
    blockchain.isValid()
      ? "SÍ"
      : "NO"
  }`
);

console.log(
  "\n====================================\n"
);