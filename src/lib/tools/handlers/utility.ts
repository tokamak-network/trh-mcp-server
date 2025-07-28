import { BackendClient } from '../../../services/backend-client.js';
import { generateAccountsFromSeedPhrase } from '../../utils/wallet.js';
import { getDefaultChainConfig, NetworkType } from '../../config/chain.js';

export class UtilityHandlers {
  constructor(private backendClient: BackendClient) {}

  async handleInitializeBackend(args: { backendUrl: string; username: string; password: string }) {
    try {
      return {
        content: [
          {
            type: 'text',
            text: `✅ Backend client initialized successfully!\n📡 Backend URL: ${args.backendUrl}\n👤 Username: ${args.username}\n\nYou can now use other tools without providing credentials.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to initialize backend client: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  async handleGetAccountsFromSeed(args: { seedPhrase: string; l1RpcUrl: string }) {
    try {
      const accounts = await generateAccountsFromSeedPhrase(args.seedPhrase, args.l1RpcUrl);

      const accountList = accounts.map((account: any, index: number) =>
        `${index}: ${account.address} - Balance: ${account.balance} ETH ${account.balance > 0 ? '✅' : '❌'}`
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Generated accounts from seed phrase:\n${accountList}\n\nUse the index numbers (0-9) to select accounts for deployment.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  async handleTestConnection() {
    const isConnected = await this.backendClient.testConnection();

    return {
      content: [
        {
          type: 'text',
          text: `Backend connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`
        }
      ]
    };
  }

  async handleGetDefaultChainConfig(args: { network: string }) {
    const network = args.network.toLowerCase() as 'mainnet' | 'testnet';
    const config = getDefaultChainConfig(args.network as NetworkType);
    
    const configText = `✅ Recommended Default Chain Configuration for ${args.network}:
    
📊 Configuration Parameters:
• Challenge Period: ${config.challengePeriod} ${network === 'mainnet' ? 'seconds (7 days)' : 'seconds (12 seconds)'}
• L2 Block Time: ${config.l2BlockTime} seconds
• Output Root Frequency: ${config.outputRootFrequency} seconds (${config.outputRootFrequency / config.l2BlockTime} blocks)
• Batch Submission Frequency: ${config.batchSubmissionFrequency} seconds (${config.batchSubmissionFrequency / 12} L1 blocks)

🚀 Strongly recommended: Use default configuration (useDefaultChainConfig: true) for production deployments. These values are optimized for security, performance, and reliability.

⚠️  Only use custom values if you have specific technical requirements and understand the implications.`;

    return {
      content: [
        {
          type: 'text',
          text: configText
        }
      ]
    };
  }
} 