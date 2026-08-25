const PRIMARY_NODE =
  "http://localhost:3001";

export const NODE_URLS = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003"
];

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

// =============================================
// CASOS
// =============================================

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

// =============================================
// RED
// =============================================

export async function getNodeStatus(
  nodeUrl: string
): Promise<NodeStatus> {
  return apiRequest<NodeStatus>(
    `${nodeUrl}/api/network/status`
  );
}