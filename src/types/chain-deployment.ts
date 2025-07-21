import { z } from 'zod';

// Zod schema for register candidate parameters
export const RegisterCandidateParamsSchema = z.object({
  amount: z.number(),
  memo: z.string(),
  nameInfo: z.string()
});

// Zod schema for the main chain deployment request
export const ChainDeploymentRequestSchema = z.object({
  adminAccount: z.string(),
  awsAccessKey: z.string(),
  awsRegion: z.string(),
  awsSecretAccessKey: z.string(),
  batchSubmissionFrequency: z.number(),
  batcherAccount: z.string(),
  chainName: z.string(),
  challengePeriod: z.number(),
  deploymentPath: z.string(),
  l1BeaconUrl: z.string(),
  l1RpcUrl: z.string(),
  l2BlockTime: z.number(),
  network: z.enum(['Mainnet', 'Testnet', 'Devnet']),
  outputRootFrequency: z.number(),
  proposerAccount: z.string(),
  registerCandidate: z.boolean(),
  registerCandidateParams: RegisterCandidateParamsSchema,
  sequencerAccount: z.string()
});

// TypeScript types derived from the schemas
export type RegisterCandidateParams = z.infer<typeof RegisterCandidateParamsSchema>;
export type ChainDeploymentRequest = z.infer<typeof ChainDeploymentRequestSchema>;

// Response types
export interface ChainDeploymentResponse {
  success: boolean;
  chainId?: string;
  deploymentId?: string;
  message?: string;
  error?: string;
}

export interface ChainDeploymentStatus {
  deploymentId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  chainId?: string;
  chainName?: string;
  createdAt: string;
  updatedAt: string;
} 