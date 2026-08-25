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
  NetworkService
} from "./NetworkService.js";

import {
  createApi
} from "./api.js";

// =====================================================
// ARGUMENTOS
// =====================================================

function getArgument(
  name: string
): string | undefined {
  const prefix =
    `--${name}=`;

  const argument =
    process.argv.find(
      (value) =>
        value.startsWith(prefix)
    );

  return argument
    ?.substring(prefix.length);
}

const PORT =
  Number(
    getArgument("port") ??
      "3001"
  );

const NODE_NAME =
  getArgument("name") ??
  `NODE-${PORT}`;

const BOOTSTRAP_URL =
  "http://localhost:3001";

const NODE_URL =
  `http://localhost:${PORT}`;

const ALL_NODES = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003"
];

const PEERS =
  ALL_NODES.filter(
    (url) =>
      url !== NODE_URL
  );

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

let blockchain =
  await storage.load();

// =====================================================
// CREACIÓN / BOOTSTRAP
// =====================================================

if (!blockchain) {
  /*
   * Solo NODE-1 crea un Génesis.
   */
  if (PORT === 3001) {
    console.log(
      "Creando Blockchain principal..."
    );

    blockchain =
      new Blockchain(
        4,
        "0"
      );

    await storage.save(
      blockchain
    );
  }

  /*
   * Los demás nodos obtienen el Génesis
   * y la cadena desde NODE-1.
   */
  else {
    console.log(
      `${NODE_NAME}: obteniendo Blockchain desde NODE-1...`
    );

    const response =
      await fetch(
        `${BOOTSTRAP_URL}/api/network/chain`
      );

    if (!response.ok) {
      throw new Error(
        "NODE-1 debe estar iniciado antes de arrancar los nodos secundarios."
      );
    }

    const body =
      await response.json() as {
        blockchain:
          ReturnType<
            Blockchain["toObject"]
          >;
      };

    blockchain =
      Blockchain.fromObject(
        body.blockchain
      );

    await storage.save(
      blockchain
    );
  }
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
// NETWORK
// =====================================================

const network =
  new NetworkService(
    blockchain,
    NODE_URL,
    PEERS
  );

// =====================================================
// API
// =====================================================

const app =
  createApi(
    blockchain,
    blockSec,
    storage,
    network,
    NODE_NAME,
    NODE_URL
  );

// =====================================================
// INICIAR
// =====================================================

app.listen(
  PORT,
  () => {
    console.log(
      "\n===================================="
    );

    console.log(
      `       BLOCKSEC ${NODE_NAME}`
    );

    console.log(
      "===================================="
    );

    console.log(
      `URL: ${NODE_URL}`
    );

    console.log(
      `Bloques: ${blockchain.blocks.length}`
    );

    console.log(
      `Último hash: ${blockchain.lastBlock.hash}`
    );

    console.log(
      `Blockchain válida: ${
        blockchain.isValid()
          ? "SÍ"
          : "NO"
      }`
    );

    console.log(
      "Peers:"
    );

    for (const peer of PEERS) {
      console.log(
        `- ${peer}`
      );
    }

    console.log(
      "====================================\n"
    );
  }
);