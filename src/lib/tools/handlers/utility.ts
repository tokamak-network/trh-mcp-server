import { BackendClient } from '../../../services/backend-client.js';
import { generateAccountsFromSeedPhrase } from '../../utils/wallet.js';
import { getDefaultChainConfig, getDefaultConfigMessage, NetworkType } from '../../config/chain.js';

export class UtilityHandlers {
  constructor(private backendClient: BackendClient | null = null) {}

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
    if (!this.backendClient) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Backend client not initialized. Please call initialize_backend first or provide credentials.`
          }
        ]
      };
    }
    
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
    const configText = getDefaultConfigMessage(args.network as NetworkType);

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