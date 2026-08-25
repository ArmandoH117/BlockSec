const PRIMARY_NODE =
  "http://localhost:3001";

export const NODE_URLS = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003"
];

// =====================================================
// CASOS
// =====================================================

export interface CaseItem {
  id: string;
  description: string;
  createdAt: number;
  evidenceCount: number;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  type: string;
  description: string;
  serialOrImei: string;
  observations: string;
  createdAt: number;
}

export interface CaseDetail {
  id: string;
  description: string;
  createdAt: number;
  evidences: EvidenceItem[];
}

export interface CreateCaseResponse {
  message: string;

  case: {
    id: string;
    description: string;
    createdAt: number;
  };

  pendingTransactions: number;
}

export interface RegisterEvidenceResponse {
  message: string;
  evidence: EvidenceItem;
  pendingTransactions: number;
}

// =====================================================
// HISTORIAL / EVIDENCIA
// =====================================================

export interface EvidenceHistoryEntry {
  transactionId: string;
  type: string;
  timestamp: number;
  blockIndex: number | null;
  confirmed: boolean;
  data: Record<string, unknown>;
}

export interface EvidenceDetail
  extends EvidenceItem {
  currentResponsible: string | null;
  lastConfirmedEvent: string | null;
  history: EvidenceHistoryEntry[];
}

export interface ActionResponse {
  message: string;
  transactionId: string;
  pendingTransactions: number;
}

// =====================================================
// BLOCKCHAIN
// =====================================================

export interface TransactionObject {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface CandidateBlockResponse {
  exists: boolean;
  index?: number;
  previousHash?: string;
  transactionCount: number;
  transactions: TransactionObject[];
}

export interface BlockObject {
  index: number;
  timestamp: number;
  previousHash: string;
  transactions: TransactionObject[];
  nonce: number;
  hash: string;
  mined: boolean;
}

export interface BlockchainResponse {
  difficulty: number;
  mineChar: string;
  target: string;
  valid: boolean;
  blockCount: number;
  blocks: BlockObject[];
}

export interface MineResponse {
  message: string;

  block: {
    index: number;
    previousHash: string;
    hash: string;
    nonce: number;
    transactions: number;
  };

  mining: {
    attempts: number;
    durationMs: number;
    difficulty: number;
    mineChar: string;
    target: string;
  };

  network?: {
    peers: Array<{
      peer: string;
      success: boolean;
      message: string;
    }>;
  };

  blockchainValid: boolean;
}

// =====================================================
// RED
// =====================================================

export interface NodeStatus {
  node: string;
  url: string;
  valid: boolean;
  blocks: number;

  lastBlock: {
    index: number;
    hash: string;
  };

  pendingTransactions: number;
}

// =====================================================
// REQUEST GENÉRICO
// =====================================================

async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response =
    await fetch(url, options);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ??
        "Ocurrió un error al comunicarse con BlockSec."
    );
  }

  return data as T;
}

// =====================================================
// CASOS
// =====================================================

export async function getCases():
  Promise<CaseItem[]> {
  return apiRequest<CaseItem[]>(
    `${PRIMARY_NODE}/api/cases`
  );
}

export async function getCase(
  caseId: string
): Promise<CaseDetail> {
  return apiRequest<CaseDetail>(
    `${PRIMARY_NODE}/api/cases/${caseId}`
  );
}

export async function createCase(
  description: string
): Promise<CreateCaseResponse> {
  return apiRequest<CreateCaseResponse>(
    `${PRIMARY_NODE}/api/cases`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        description
      })
    }
  );
}

// =====================================================
// EVIDENCIAS
// =====================================================

export async function registerEvidence(
  data: {
    caseId: string;
    type: string;
    description: string;
    responsible: string;
    serialOrImei?: string;
    observations?: string;
  }
): Promise<RegisterEvidenceResponse> {
  return apiRequest<RegisterEvidenceResponse>(
    `${PRIMARY_NODE}/api/evidences`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify(data)
    }
  );
}

export async function getEvidence(
  evidenceId: string
): Promise<EvidenceDetail> {
  return apiRequest<EvidenceDetail>(
    `${PRIMARY_NODE}/api/evidences/${evidenceId}`
  );
}

export async function transferEvidence(
  evidenceId: string,
  newResponsible: string,
  observations: string
): Promise<ActionResponse> {
  return apiRequest<ActionResponse>(
    `${PRIMARY_NODE}/api/evidences/${evidenceId}/transfer`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        newResponsible,
        observations
      })
    }
  );
}

export async function analyzeEvidence(
  evidenceId: string,
  observations: string
): Promise<ActionResponse> {
  return apiRequest<ActionResponse>(
    `${PRIMARY_NODE}/api/evidences/${evidenceId}/analyze`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        observations
      })
    }
  );
}

// =====================================================
// BLOCKCHAIN
// =====================================================

export async function getCandidateBlock():
  Promise<CandidateBlockResponse> {
  return apiRequest<CandidateBlockResponse>(
    `${PRIMARY_NODE}/api/blockchain/candidate`
  );
}

export async function getBlockchain():
  Promise<BlockchainResponse> {
  return apiRequest<BlockchainResponse>(
    `${PRIMARY_NODE}/api/blockchain`
  );
}

export async function mineCandidateBlock():
  Promise<MineResponse> {
  return apiRequest<MineResponse>(
    `${PRIMARY_NODE}/api/blockchain/mine`,
    {
      method: "POST"
    }
  );
}

// =====================================================
// RED
// =====================================================

export async function getNodeStatus(
  nodeUrl: string
): Promise<NodeStatus> {
  return apiRequest<NodeStatus>(
    `${nodeUrl}/api/network/status`
  );
}