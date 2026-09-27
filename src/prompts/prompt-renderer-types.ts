export interface ImplementerEnvelopeFacts {
  repository: string;
  workItemNumber: number;
  workItemUrl: string;
  authorizationRef: string;
  payloadSourceRef: string;
  payloadText: string;
}

export interface SupervisorEnvelopeFacts {
  repository: string;
  workItemNumber: number;
  workItemUrl: string;
  authorizationRef: string;
  prNumber: number;
  prUrl: string;
  expectedRevision: string;
  payloadSourceRef: string;
  payloadText: string;
}
