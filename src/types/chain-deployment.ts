import { z } from 'zod';

// Zod schema for register candidate parameters
export const RegisterCandidateParamsSchema = z.object({
  amount: z.number(),
  memo: z.string(),
  nameInfo: z.string()
});

// Zod schema for chain configuration
export const ChainConfigurationSchema = z.object({
  challengePeriod: z.number(),
  l2BlockTime: z.number(),
  outputRootFrequency: z.number(),
  batchSubmissionFrequency: z.number()
});

// Helper function to get network-specific defaults
export const getNetworkDefaults = (network: 'Mainnet' | 'Testnet') => {
  if (network === 'Mainnet') {
    return {
      challengePeriod: 604800, // 604800 seconds (7 days)
      l2BlockTime: 6, // 6 seconds
      outputRootFrequency: 6 * 10800, // 10800 * l2BlockTime
      batchSubmissionFrequency: 12 * 1500 // 1500 * L1 block time (12 seconds)
    };
  } else {
    // Testnet defaults
    return {
      challengePeriod: 12, // 12 seconds
      l2BlockTime: 6, // 6 seconds
      outputRootFrequency: 6 * 120, // 120 * l2BlockTime
      batchSubmissionFrequency: 12 * 120 // 120 * L1 block time (12 seconds)
    };
  }
};

// Zod schema for the main chain deployment request
export const ChainDeploymentRequestSchema = z.object({
  backendUrl: z.string(),
  username: z.string(),
  password: z.string(),
  seedPhrase: z.string(),
  awsAccessKey: z.string(),
  awsSecretKey: z.string(),
  awsRegion: z.string(),
  l1RpcUrl: z.string(),
  l1BeaconUrl: z.string(),
  chainConfiguration: ChainConfigurationSchema.optional(),
  chainName: z.string(),
  network: z.enum(['Mainnet', 'Testnet']),
  registerCandidate: z.boolean(),
  registerCandidateParams: RegisterCandidateParamsSchema.optional(),
  adminAccountIndex: z.number().min(0).max(9),
  sequencerAccountIndex: z.number().min(0).max(9),
  batcherAccountIndex: z.number().min(0).max(9),
  proposerAccountIndex: z.number().min(0).max(9)
}).refine((data: any) => {
  // If registerCandidate is true, registerCandidateParams must be provided
  if (data.registerCandidate && !data.registerCandidateParams) {
    return false;
  }
  return true;
}, {
  message: "registerCandidateParams is required when registerCandidate is true",
  path: ["registerCandidateParams"]
}).refine((data: any) => {
  // If registerCandidate is true, registerCandidateParams.amount must be bigger than 1000
  if (data.registerCandidate && data.registerCandidateParams && data.registerCandidateParams.amount <= 1000) {
    return false;
  }
  return true;
}, {
  message: "registerCandidateParams.amount must be bigger than 1000 when registerCandidate is true",
  path: ["registerCandidateParams", "amount"]
}).refine((data: any) => {
  // Validate outputRootFrequency % l2BlockTime = 0
  const l2BlockTime = data.l2BlockTime || data.chainConfiguration?.l2BlockTime;
  const outputRootFrequency = data.outputRootFrequency || data.chainConfiguration?.outputRootFrequency;
  
  if (l2BlockTime && outputRootFrequency && outputRootFrequency % l2BlockTime !== 0) {
    return false;
  }
  return true;
}, {
  message: "outputRootFrequency must be divisible by l2BlockTime",
  path: ["outputRootFrequency"]
}).refine((data: any) => {
  // Validate batchSubmissionFrequency % 12 = 0
  const batchSubmissionFrequency = data.batchSubmissionFrequency || data.chainConfiguration?.batchSubmissionFrequency;
  
  if (batchSubmissionFrequency && batchSubmissionFrequency % 12 !== 0) {
    return false;
  }
  return true;
}, {
  message: "batchSubmissionFrequency must be divisible by 12",
  path: ["batchSubmissionFrequency"]
}).transform((data: any) => {
  // Apply network-specific defaults if chainConfiguration is not provided
  if (!data.chainConfiguration) {
    data.chainConfiguration = getNetworkDefaults(data.network);
  }
  return data;
});

// Zod schema for the actual backend payload (without auth and account index fields)
export const BackendDeploymentRequestSchema = z.object({
  network: z.enum(['mainnet', 'testnet']),
  l1RpcUrl: z.string(),
  l1BeaconUrl: z.string(),
  awsAccessKey: z.string(),
  awsSecretAccessKey: z.string(),
  awsRegion: z.string(),
  l2BlockTime: z.number(),
  batchSubmissionFrequency: z.number(),
  outputRootFrequency: z.number(),
  challengePeriod: z.number(),
  chainName: z.string(),
  registerCandidate: z.boolean(),
  registerCandidateParams: RegisterCandidateParamsSchema.optional(),
  adminAccount: z.string(),
  sequencerAccount: z.string(),
  batcherAccount: z.string(),
  proposerAccount: z.string()
}).refine((data: any) => {
  // If registerCandidate is true, registerCandidateParams must be provided
  if (data.registerCandidate && !data.registerCandidateParams) {
    return false;
  }
  return true;
}, {
  message: "registerCandidateParams is required when registerCandidate is true",
  path: ["registerCandidateParams"]
}).refine((data: any) => {
  // If registerCandidate is true, registerCandidateParams.amount must be bigger than 1000
  if (data.registerCandidate && data.registerCandidateParams && data.registerCandidateParams.amount <= 1000) {
    return false;
  }
  return true;
}, {
  message: "registerCandidateParams.amount must be bigger than 1000 when registerCandidate is true",
  path: ["registerCandidateParams", "amount"]
}).refine((data: any) => {
  // Validate outputRootFrequency % l2BlockTime = 0
  if (data.outputRootFrequency % data.l2BlockTime !== 0) {
    return false;
  }
  return true;
}, {
  message: "outputRootFrequency must be divisible by l2BlockTime",
  path: ["outputRootFrequency"]
}).refine((data: any) => {
  // Validate batchSubmissionFrequency % 12 = 0
  if (data.batchSubmissionFrequency % 12 !== 0) {
    return false;
  }
  return true;
}, {
  message: "batchSubmissionFrequency must be divisible by 12",
  path: ["batchSubmissionFrequency"]
});

// TypeScript types derived from the schemas
export type RegisterCandidateParams = z.infer<typeof RegisterCandidateParamsSchema>;
export type ChainDeploymentRequest = z.infer<typeof ChainDeploymentRequestSchema>;
export type BackendDeploymentRequest = z.infer<typeof BackendDeploymentRequestSchema>;

// Response types
export interface ChainDeploymentResponse {
  status: number;
  message: string;
  data: {
    stackId: string;
  };
}

export interface DeploymentResponse {
  id: string;
  name: string;
  network: string;
  config: {
    network: string;
    l1RpcUrl: string;
    awsRegion: string;
    chainName: string;
    l1BeaconUrl: string;
    l2BlockTime: number;
    adminAccount: string;
    awsAccessKey: string;
    batcherAccount: string;
    deploymentPath: string;
    challengePeriod: number;
    proposerAccount: string;
    sequencerAccount: string;
    registerCandidate: boolean;
    awsSecretAccessKey: string;
    outputRootFrequency: number;
    registerCandidateParams?: {
      memo: string;
      amount: number;
      nameInfo: string;
    };
    batchSubmissionFrequency: number;
  };
  deployment_path: string;
  metadata: {
    l2_url?: string;
    bridge_url?: string;
  };
  status: string;
}

export interface AccountInfo {
  address: string;
  balance: string;
  privateKey?: string;
} 