import { Blockchain } from "./Blockchain.js";
import { BlockSecService } from "./BlockSecService.js";

console.log("\n====================================");
console.log("            BLOCKSEC");
console.log("====================================\n");

// -------------------------------------
// CREAR BLOCKCHAIN
// -------------------------------------

const blockchain = new Blockchain(4, "0");

const blockSec =
  new BlockSecService(blockchain);

console.log("Blockchain creada.");
console.log(
  `Dificultad: ${blockchain.difficulty}`
);
console.log(
  `Carácter: ${blockchain.mineChar}`
);
console.log(
  `Objetivo: ${blockchain.target}`
);

// -------------------------------------
// MOSTRAR GÉNESIS
// -------------------------------------

const genesis = blockchain.blocks[0];

if (!genesis) {
  throw new Error(
    "No se pudo crear el Génesis."
  );
}

console.log("\n--- BLOQUE GÉNESIS ---");

console.log(`Índice: ${genesis.index}`);
console.log(`Nonce: ${genesis.nonce}`);
console.log(`Hash: ${genesis.hash}`);
console.log(
  `Previous Hash: ${genesis.previousHash}`
);

// -------------------------------------
// CREAR CASOS
// -------------------------------------

console.log("\n--- CREANDO CASOS ---");

const case1 = blockSec.createCase(
  "Investigación de acceso no autorizado."
);

console.log(
  `${case1.id} creado correctamente.`
);

const case2 = blockSec.createCase(
  "Investigación por equipo extraviado."
);

console.log(
  `${case2.id} creado correctamente.`
);

// -------------------------------------
// REGISTRAR EVIDENCIAS
// -------------------------------------

console.log(
  "\n--- REGISTRANDO EVIDENCIAS ---"
);

const evidence1 =
  blockSec.registerEvidence(
    case1.id,
    "DISPOSITIVO_MOVIL",
    "iPhone 13 azul",
    "Salvador",
    "359403450123456",
    "Pantalla con fisura en esquina superior."
  );

console.log(
  `${evidence1.id} → ${evidence1.caseId}`
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
  `${evidence2.id} → ${evidence2.caseId}`
);

const evidence3 =
  blockSec.registerEvidence(
    case2.id,
    "EQUIPO_COMPUTO",
    "Laptop HP EliteBook",
    "Carlos",
    "HP-98AZ12"
  );

console.log(
  `${evidence3.id} → ${evidence3.caseId}`
);

// -------------------------------------
// MOSTRAR BLOQUE CANDIDATO
// -------------------------------------

console.log(
  "\n--- BLOQUE CANDIDATO ---"
);

const candidate =
  blockchain.getCandidateBlock();

if (!candidate) {
  throw new Error(
    "No existe bloque candidato."
  );
}

console.log(
  `Bloque: #${candidate.index}`
);

console.log(
  `Transacciones pendientes: ${candidate.transactionCount}`
);

for (
  const transaction of
  candidate.getTransactions()
) {
  console.log(
    `${transaction.id} | ${transaction.type}`
  );
}

// -------------------------------------
// MOSTRAR RELACIÓN CASOS → EVIDENCIAS
// -------------------------------------

console.log(
  "\n--- CASOS Y EVIDENCIAS ---"
);

for (const caseFile of blockSec.getCases()) {
  console.log(
    `\n${caseFile.id} - ${caseFile.description}`
  );

  const evidences =
    blockSec.getEvidencesByCase(
      caseFile.id
    );

  for (const evidence of evidences) {
    console.log(
      `  └─ ${evidence.id} | ${evidence.description}`
    );
  }
}

// -------------------------------------
// MINAR
// -------------------------------------

console.log("\nMinando bloque...");

const result =
  blockchain.mineCandidateBlock();

console.log(
  "\n--- BLOQUE MINADO ---"
);

console.log(
  `Bloque: #${result.block.index}`
);

console.log(
  `Transacciones: ${result.block.transactionCount}`
);

console.log(
  `Nonce: ${result.block.nonce}`
);

console.log(
  `Hash: ${result.block.hash}`
);

console.log(
  `Previous Hash: ${result.block.previousHash}`
);

console.log(
  `Intentos: ${result.attempts}`
);

console.log(
  `Tiempo: ${result.durationMs} ms`
);

// -------------------------------------
// AGREGAR A BLOCKCHAIN
// -------------------------------------

blockchain.addCandidateBlock();

console.log(
  "\nBloque agregado correctamente."
);

console.log(
  `Bloques totales: ${blockchain.blocks.length}`
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