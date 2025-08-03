export const ChainConfiguration = {
  "Mainnet": {
    challengePeriod: 604800, // 604800 seconds (7 days)
    l2BlockTime: 6,
    outputRootFrequency: 6 * 10800, // 10800 * l2BlockTime
    batchSubmissionFrequency: 12 * 1500 // 1500 * L1 block time (12 seconds)
  },
  "Testnet": {
    challengePeriod: 12, // 12 seconds
    l2BlockTime: 6,
    outputRootFrequency: 6 * 120, // 120 * l2BlockTime
    batchSubmissionFrequency: 12 * 120 // 120 * L1 block time (12 seconds)
  }
} as const;

export type NetworkType = 'Mainnet' | 'Testnet' | 'mainnet' | 'testnet';

export const getDefaultChainConfig = (network: NetworkType) => {
  const normalizedNetwork = network.toLowerCase() as 'mainnet' | 'testnet';
  return normalizedNetwork === 'mainnet' ? ChainConfiguration.Mainnet : ChainConfiguration.Testnet;
};

export const getDefaultConfigMessage = (network: NetworkType) => {
  const config = getDefaultChainConfig(network);
  const isMainnet = network.toLowerCase() === 'mainnet';
  
  return `📋 Default Chain Configuration for ${network}:
    
  ⚙️  Configuration Parameters:
  • Challenge Period: ${config.challengePeriod} ${isMainnet ? 'seconds (7 days)' : 'seconds (12 seconds)'}
  • L2 Block Time: ${config.l2BlockTime} seconds
  • Output Root Frequency: ${config.outputRootFrequency} seconds (${config.outputRootFrequency / config.l2BlockTime} blocks)
  • Batch Submission Frequency: ${config.batchSubmissionFrequency} seconds (${config.batchSubmissionFrequency / 12} L1 blocks)

  ${isMainnet ? '⚠️  For mainnet deployments, carefully review these values and consider custom configuration based on your specific requirements.' : ''}`;
}; 