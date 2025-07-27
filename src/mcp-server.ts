import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { BackendClient } from './services/backend-client.js';
import { ChainDeploymentRequest } from './types/chain-deployment.js';
import { generateAccountsFromSeedPhrase } from './lib/utils/wallet.js';
import { Account } from './lib/models/index.js';
import { getSupportedAwsRegions, validateAwsCredentials } from './lib/utils/aws.js';
import { verifyL1BeaconUrl, verifyL1RpcUrl } from './lib/utils/rpc.js';

const ChainConfiguration = {
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
}
class ChainDeploymentMCPServer {
  private server: Server;
  private backendClient: BackendClient | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: 'chain-deployment-mcp-server',
        version: '1.0.0',
      },
    );

    this.setupToolHandlers();
  }

  private async initializeBackendClient(backendUrl: string, username: string, password: string): Promise<void> {
    // If already initialized with the same credentials, skip
    if (this.isInitialized && this.backendClient) {
      return;
    }

    this.backendClient = new BackendClient(backendUrl, username, password);
    await this.backendClient.initialize();
    this.isInitialized = true;
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'initialize_backend',
            description: 'Initialize backend client with credentials (call this first)',
            inputSchema: {
              type: 'object',
              properties: {
                backendUrl: { type: 'string', description: 'Backend server URL' },
                username: { type: 'string', description: 'Backend username' },
                password: { type: 'string', description: 'Backend password' }
              },
              required: ['backendUrl', 'username', 'password']
            }
          },
          {
            name: 'deploy_chain',
            description: 'Deploy a new chain with the specified configuration. Strongly recommended: Use default chain configuration (useDefaultChainConfig: true) unless you have specific technical requirements. Default values are optimized for production use. The default configuration will be displayed before deployment starts.',
            inputSchema: {
              type: 'object',
              properties: {
                backendUrl: { type: 'string', description: 'Backend server URL (optional if already initialized)' },
                username: { type: 'string', description: 'Backend username (optional if already initialized)' },
                password: { type: 'string', description: 'Backend password (optional if already initialized)' },
                seedPhrase: { type: 'string', description: 'Seed phrase for account generation (optional if using private keys)' },
                awsAccessKey: { type: 'string', description: 'AWS access key' },
                awsSecretKey: { type: 'string', description: 'AWS secret access key' },
                awsRegion: {
                  type: 'string',
                  description: 'AWS region (restricted list)'
                },
                l1RpcUrl: { type: 'string', description: 'L1 RPC URL' },
                l1BeaconUrl: { type: 'string', description: 'L1 beacon URL' },
                // Individual chain configuration fields (Advanced users only - only used when useDefaultChainConfig is false)
                l2BlockTime: { type: 'number', description: 'Advanced: L2 block time in seconds (only used when useDefaultChainConfig is false - not recommended)' },
                batchSubmissionFrequency: { 
                  type: 'number', 
                  description: 'Advanced: Batch submission frequency (must be divisible by 12, only used when useDefaultChainConfig is false - not recommended)',
                  multipleOf: 12
                },
                outputRootFrequency: { 
                  type: 'number', 
                  description: 'Advanced: Output root frequency (must be divisible by l2BlockTime, only used when useDefaultChainConfig is false - not recommended)'
                },
                challengePeriod: { type: 'number', description: 'Advanced: Challenge period in blocks (only used when useDefaultChainConfig is false - not recommended)' },
                chainConfiguration: {
                  type: 'object',
                  properties: {
                    challengePeriod: {
                      type: 'number',
                      description: 'Challenge period in blocks (only used when useDefaultChainConfig is false)'
                    },
                    l2BlockTime: {
                      type: 'number',
                      description: 'L2 block time in seconds (only used when useDefaultChainConfig is false)'
                    },
                    outputRootFrequency: {
                      type: 'number',
                      description: 'Output root frequency (only used when useDefaultChainConfig is false)'
                    },
                    batchSubmissionFrequency: {
                      type: 'number',
                      description: 'Batch submission frequency (only used when useDefaultChainConfig is false)'
                    }
                  },
                  description: 'Advanced: Chain configuration parameters object (only used when useDefaultChainConfig is false - not recommended). If not provided, individual fields will be used.'
                },
                chainName: { type: 'string', description: 'Name of the chain' },
                network: {
                  type: 'string',
                  enum: ['Mainnet', 'Testnet', 'mainnet', 'testnet'],
                  description: 'Network type (Mainnet or Testnet)'
                },
                useDefaultChainConfig: {
                  type: 'boolean',
                  description: 'Strongly recommended: Set to true to use optimized default chain configuration. Only set to false if you have specific technical requirements. Default: true'
                },
                registerCandidate: { type: 'boolean', description: 'Whether to enable register candidate' },
                registerCandidateParams: {
                  type: 'object',
                  properties: {
                    amount: { 
                      type: 'number', 
                      description: 'Registration amount (must be > 1000 when registerCandidate is true)',
                      minimum: 1000.01
                    },
                    memo: { type: 'string', description: 'Registration memo' },
                    nameInfo: { type: 'string', description: 'Registration name info' }
                  },
                  required: ['amount', 'memo', 'nameInfo']
                },
                // Account fields - provide either indices (with seedPhrase) or private keys directly
                adminAccountIndex: {
                  type: 'number',
                  description: 'Index of admin account from generated accounts (0-9, requires seedPhrase)',
                  minimum: 0,
                  maximum: 9
                },
                sequencerAccountIndex: {
                  type: 'number',
                  description: 'Index of sequencer account from generated accounts (0-9, requires seedPhrase)',
                  minimum: 0,
                  maximum: 9
                },
                batcherAccountIndex: {
                  type: 'number',
                  description: 'Index of batcher account from generated accounts (0-9, requires seedPhrase)',
                  minimum: 0,
                  maximum: 9
                },
                proposerAccountIndex: {
                  type: 'number',
                  description: 'Index of proposer account from generated accounts (0-9, requires seedPhrase)',
                  minimum: 0,
                  maximum: 9
                },
                // Private key fields (alternative to indices)
                adminAccount: { type: 'string', description: 'Admin account private key (64 hex characters, alternative to adminAccountIndex)' },
                sequencerAccount: { type: 'string', description: 'Sequencer account private key (64 hex characters, alternative to sequencerAccountIndex)' },
                batcherAccount: { type: 'string', description: 'Batcher account private key (64 hex characters, alternative to batcherAccountIndex)' },
                proposerAccount: { type: 'string', description: 'Proposer account private key (64 hex characters, alternative to proposerAccountIndex)' }
              },
                              required: [
                  'awsAccessKey', 'awsSecretKey', 'awsRegion',
                  'l1RpcUrl', 'l1BeaconUrl', 'chainName', 'network', 'registerCandidate'
                ]
            }
          },
          {
            name: 'get_deployment_status',
            description: 'Get the status of a chain deployment',
            inputSchema: {
              type: 'object',
              properties: {
                backendUrl: { type: 'string', description: 'Backend server URL' },
                username: { type: 'string', description: 'Backend username' },
                password: { type: 'string', description: 'Backend password' },
                deploymentId: { type: 'string', description: 'Deployment ID to check' }
              },
              required: ['backendUrl', 'username', 'password', 'deploymentId']
            }
          },
          {
            name: 'list_deployments',
            description: 'List all chain deployments',
            inputSchema: {
              type: 'object',
              properties: {
                backendUrl: { type: 'string', description: 'Backend server URL' },
                username: { type: 'string', description: 'Backend username' },
                password: { type: 'string', description: 'Backend password' }
              },
              required: ['backendUrl', 'username', 'password']
            }
          },
          {
            name: 'terminate_deployment',
            description: 'Terminate a chain deployment',
            inputSchema: {
              type: 'object',
              properties: {
                backendUrl: { type: 'string', description: 'Backend server URL' },
                username: { type: 'string', description: 'Backend username' },
                password: { type: 'string', description: 'Backend password' },
                deploymentId: { type: 'string', description: 'Deployment ID to cancel' }
              },
              required: ['backendUrl', 'username', 'password', 'deploymentId']
            }
          },
          {
            name: 'get_accounts_from_seed',
            description: 'Generate 10 accounts from seed phrase and fetch their balances from RPC',
            inputSchema: {
              type: 'object',
              properties: {
                backendUrl: { type: 'string', description: 'Backend server URL' },
                username: { type: 'string', description: 'Backend username' },
                password: { type: 'string', description: 'Backend password' },
                seedPhrase: { type: 'string', description: 'Seed phrase to generate accounts from' },
                l1RpcUrl: { type: 'string', description: 'L1 RPC URL to check balances' }
              },
              required: ['backendUrl', 'username', 'password', 'seedPhrase', 'l1RpcUrl']
            }
          },
          {
            name: 'test_backend_connection',
            description: 'Test connection to the backend server',
            inputSchema: {
              type: 'object',
              properties: {
                backendUrl: { type: 'string', description: 'Backend server URL' },
                username: { type: 'string', description: 'Backend username' },
                password: { type: 'string', description: 'Backend password' }
              },
              required: ['backendUrl', 'username', 'password']
            }
          },
          {
            name: 'get_default_chain_config',
            description: 'Get the default chain configuration for Mainnet or Testnet. Strongly recommended: Use these default values for production deployments.',
            inputSchema: {
              type: 'object',
              properties: {
                network: {
                  type: 'string',
                  enum: ['Mainnet', 'Testnet', 'mainnet', 'testnet'],
                  description: 'Network type to get default configuration for'
                }
              },
              required: ['network']
            }
          }
        ] as Tool[]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      console.error(`🔧 Tool called: ${name}`);

      try {
        switch (name) {
          case 'initialize_backend':
            return await this.handleInitializeBackend(args as { backendUrl: string; username: string; password: string });

          case 'deploy_chain':
            return await this.handleDeployChain(args as any);

          case 'get_deployment_status':
            return await this.handleGetDeploymentStatus(args as { backendUrl: string; username: string; password: string; deploymentId: string });

          case 'list_deployments':
            return await this.handleListDeployments(args as { backendUrl: string; username: string; password: string });

          case 'terminate_deployment':
            return await this.handleTerminateDeployment(args as { backendUrl: string; username: string; password: string; deploymentId: string });

          case 'get_accounts_from_seed':
            return await this.handleGetAccountsFromSeed(args as { backendUrl: string; username: string; password: string; seedPhrase: string; l1RpcUrl: string });

          case 'test_backend_connection':
            return await this.handleTestConnection(args as { backendUrl: string; username: string; password: string });

          case 'get_default_chain_config':
            return await this.handleGetDefaultChainConfig(args as { network: string });

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`❌ Error in tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });
  }

  private async handleInitializeBackend(args: { backendUrl: string; username: string; password: string }) {
    try {
      await this.initializeBackendClient(args.backendUrl, args.username, args.password);

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

  private async handleDeployChain(args: any) {
    console.error('🚀 Starting chain deployment process...');
    
    // Show default configuration to user before proceeding
    const network = args.network || 'testnet';
    const defaultConfig = network.toLowerCase() === 'mainnet' ? ChainConfiguration.Mainnet : ChainConfiguration.Testnet;
    
    const defaultConfigMessage = `📋 Default Chain Configuration for ${network}:
    
⚙️  Configuration Parameters:
• Challenge Period: ${defaultConfig.challengePeriod} ${network.toLowerCase() === 'mainnet' ? 'seconds (7 days)' : 'seconds (12 seconds)'}
• L2 Block Time: ${defaultConfig.l2BlockTime} seconds
• Output Root Frequency: ${defaultConfig.outputRootFrequency} seconds (${defaultConfig.outputRootFrequency / defaultConfig.l2BlockTime} blocks)
• Batch Submission Frequency: ${defaultConfig.batchSubmissionFrequency} seconds (${defaultConfig.batchSubmissionFrequency / 12} L1 blocks)

💡 These are the RECOMMENDED values that will be used if you set useDefaultChainConfig: true
⚠️  Only use custom values if you have specific technical requirements.

Proceeding with deployment...`;
    
    console.error(defaultConfigMessage);
    
    try {
      // Initialize backend client if credentials provided or use existing one
      if (args.backendUrl && args.username && args.password) {
        console.error('📡 Initializing backend client with provided credentials...');
        await this.initializeBackendClient(args.backendUrl, args.username, args.password);
      } else if (!this.isInitialized || !this.backendClient) {
        throw new Error('Backend client not initialized. Please call initialize_backend first or provide credentials.');
      }

      if (!this.backendClient) {
        throw new Error('Failed to initialize backend client');
      }

      console.error('🔐 Validating AWS credentials...');
      // --- AWS credentials and region verification ---
      const awsSecretKey = args.awsSecretKey || args.awsSecretKey;
      const awsValidation = await validateAwsCredentials(args.awsAccessKey, awsSecretKey, args.awsRegion);
      if (!awsValidation.isValid) {
        throw new Error(`AWS credentials validation failed: ${awsValidation.error}`);
      }

      const validAwsRegions = await getSupportedAwsRegions(args.awsAccessKey, awsSecretKey);
      if (!validAwsRegions.includes(args.awsRegion)) {
        throw new Error(`AWS credentials are not valid for region: ${args.awsRegion}. Valid regions: ${validAwsRegions.join(', ')}`);
      }

      console.error(`✅ AWS credentials validated successfully. Account ID: ${awsValidation.accountId}, Region: ${args.awsRegion}`);
      // --- End AWS verification ---

      console.error('🌐 Validating L1 RPC URL...');
      // verify l1 rpc url
      const l1RpcValidation = await verifyL1RpcUrl(args.l1RpcUrl);
      if (!l1RpcValidation.isValid) {
        throw new Error(`L1 RPC URL validation failed: ${l1RpcValidation.error}`);
      }

      // verify l1 beacon url
      const l1BeaconValidation = await verifyL1BeaconUrl(args.l1BeaconUrl);
      if (!l1BeaconValidation.isValid) {
        throw new Error(`L1 beacon URL validation failed: ${l1BeaconValidation.error}`);
      }

      console.error('✅ L1 beacon URL validation successful');

      // Handle account validation - check if using indices or private keys
      const hasPrivateKeys = args.adminAccount || args.sequencerAccount || args.batcherAccount || args.proposerAccount;
      
      if (hasPrivateKeys) {
        console.error('🔑 Using provided private keys for accounts');
        // Validate private key format
        if (args.adminAccount && !args.adminAccount.match(/^[0-9a-fA-F]{64}$/)) {
          throw new Error('Invalid admin account private key format');
        }
        if (args.sequencerAccount && !args.sequencerAccount.match(/^[0-9a-fA-F]{64}$/)) {
          throw new Error('Invalid sequencer account private key format');
        }
        if (args.batcherAccount && !args.batcherAccount.match(/^[0-9a-fA-F]{64}$/)) {
          throw new Error('Invalid batcher account private key format');
        }
        if (args.proposerAccount && !args.proposerAccount.match(/^[0-9a-fA-F]{64}$/)) {
          throw new Error('Invalid proposer account private key format');
        }
        console.error('✅ Private key format validation successful');
      } else {
        console.error('👤 Generating accounts from seed phrase...');
        if (!args.seedPhrase) {
          throw new Error('Seed phrase is required when using account indices');
        }
        // First, validate account balances
        const accounts = await generateAccountsFromSeedPhrase(args.seedPhrase, args.l1RpcUrl);

        console.error(`✅ Generated ${accounts.length} accounts from seed phrase`);

        // Check if selected accounts have sufficient balance
        const adminAccount = accounts[args.adminAccountIndex];
        const sequencerAccount = accounts[args.sequencerAccountIndex];
        const batcherAccount = accounts[args.batcherAccountIndex];
        const proposerAccount = accounts[args.proposerAccountIndex];

        console.error(`🔍 Validating account balances...`);
        console.error(`   Admin account (${args.adminAccountIndex}): ${adminAccount?.address} - Balance: ${adminAccount?.balance || 0}`);
        console.error(`   Sequencer account (${args.sequencerAccountIndex}): ${sequencerAccount?.address} - Balance: ${sequencerAccount?.balance || 0}`);
        console.error(`   Batcher account (${args.batcherAccountIndex}): ${batcherAccount?.address} - Balance: ${batcherAccount?.balance || 0}`);
        console.error(`   Proposer account (${args.proposerAccountIndex}): ${proposerAccount?.address} - Balance: ${proposerAccount?.balance || 0}`);

        if (!adminAccount || adminAccount.balance <= 0) {
          throw new Error(`Admin account (index ${args.adminAccountIndex}) must have balance > 0. Current balance: ${adminAccount?.balance || 0}`);
        }

        if (!batcherAccount || batcherAccount.balance <= 0) {
          throw new Error(`Batcher account (index ${args.batcherAccountIndex}) must have balance > 0. Current balance: ${batcherAccount?.balance || 0}`);
        }

        if (!proposerAccount || proposerAccount.balance <= 0) {
          throw new Error(`Proposer account (index ${args.proposerAccountIndex}) must have balance > 0. Current balance: ${proposerAccount?.balance || 0}`);
        }

        console.error('✅ Account balance validation successful');

        // Convert indices to private keys for the payload
        args.adminAccount = adminAccount.privateKey;
        args.sequencerAccount = sequencerAccount.privateKey;
        args.batcherAccount = batcherAccount.privateKey;
        args.proposerAccount = proposerAccount.privateKey;
      }

      // Apply network-specific default values for chain configuration
      const getDefaultChainConfig = (network: 'Mainnet' | 'Testnet') => {
        if (network === 'Mainnet') {
          return ChainConfiguration.Mainnet;
        } else {
          // Testnet defaults
          return ChainConfiguration.Testnet;
        }
      };

      // Handle chain configuration based on operator preference
      let chainConfig;
      const useDefaultConfig = args.useDefaultChainConfig !== false; // Default to true if not specified
      
            if (useDefaultConfig) {
        // Use default configuration
        chainConfig = getDefaultChainConfig(args.network);
        console.error(`✅ Using recommended default chain configuration for ${args.network}:`, JSON.stringify(chainConfig, null, 2));
              } else {
          // Use custom configuration - check if individual fields are provided
          console.error(`⚠️  Warning: Using custom chain configuration (not recommended for production)`);
          if (args.l2BlockTime !== undefined || args.batchSubmissionFrequency !== undefined || 
              args.outputRootFrequency !== undefined || args.challengePeriod !== undefined) {
            chainConfig = {
              l2BlockTime: args.l2BlockTime || getDefaultChainConfig(args.network).l2BlockTime,
              batchSubmissionFrequency: args.batchSubmissionFrequency || getDefaultChainConfig(args.network).batchSubmissionFrequency,
              outputRootFrequency: args.outputRootFrequency || getDefaultChainConfig(args.network).outputRootFrequency,
              challengePeriod: args.challengePeriod || getDefaultChainConfig(args.network).challengePeriod
            };
            console.error(`⚙️  Using CUSTOM chain configuration for ${args.network}:`, JSON.stringify(chainConfig, null, 2));
          } else if (args.chainConfiguration) {
            // Use provided chainConfiguration object
            chainConfig = args.chainConfiguration;
            console.error(`⚙️  Using PROVIDED chain configuration for ${args.network}:`, JSON.stringify(chainConfig, null, 2));
          } else {
            // Fallback to default if custom config was requested but no values provided
            chainConfig = getDefaultChainConfig(args.network);
            console.error(`⚠️  Custom configuration requested but no values provided. Using DEFAULT chain configuration for ${args.network}:`, JSON.stringify(chainConfig, null, 2));
          }
        }

              // Transform the new schema structure to match backend expectations
        const backendArgs = {
          network: (args.network || 'testnet').toLowerCase() as 'mainnet' | 'testnet',
          l1RpcUrl: args.l1RpcUrl,
          l1BeaconUrl: args.l1BeaconUrl,
          awsAccessKey: args.awsAccessKey,
          awsSecretAccessKey: args.awsSecretKey,
          awsRegion: args.awsRegion,
          l2BlockTime: chainConfig.l2BlockTime,
          batchSubmissionFrequency: chainConfig.batchSubmissionFrequency,
          outputRootFrequency: chainConfig.outputRootFrequency,
          challengePeriod: chainConfig.challengePeriod,
          chainName: args.chainName,
          registerCandidate: args.registerCandidate,
          registerCandidateParams: args.registerCandidateParams,
          // Account private keys (either provided directly or converted from indices)
          adminAccount: args.adminAccount,
          sequencerAccount: args.sequencerAccount,
          batcherAccount: args.batcherAccount,
          proposerAccount: args.proposerAccount
        };

      console.error('📋 Preparing deployment arguments...');
      try {
        console.error(`📋 Deployment arguments:`, JSON.stringify(backendArgs, null, 2));
      } catch (jsonError) {
        console.error('❌ Failed to stringify backendArgs:', jsonError);
        console.error('📋 backendArgs keys:', Object.keys(backendArgs));
        // Log each property individually to identify the problematic one
        Object.entries(backendArgs).forEach(([key, value]) => {
          try {
            console.error(`📋 ${key}:`, JSON.stringify(value));
          } catch (propError) {
            console.error(`📋 ${key}: [Cannot stringify - ${propError}]`);
          }
        });
      }

      console.error('🚀 Initiating chain deployment...');
  
      const result = await this.backendClient.deployChain(backendArgs);

      if (result.status === 200) {
        console.error(`✅ Deployment initiated successfully! Stack ID: ${result.data.stackId}`);
      } else {
        console.error(`❌ Deployment failed: ${result.message}`);
      }


      const configType = useDefaultConfig ? 'recommended default' : 'custom (not recommended)';
      
      // Include default configuration info in the response
      const network = args.network || 'testnet';
      const defaultConfig = network.toLowerCase() === 'mainnet' ? ChainConfiguration.Mainnet : ChainConfiguration.Testnet;
      
      const responseText = `Chain deployment ${result.status === 200 ? 'initiated successfully' : 'failed'} using ${configType} configuration. ${result.data?.stackId ? `Stack ID: ${result.data.stackId}` : ''
        } ${result.message || ''}

📋 Default Configuration for ${network} (for reference):
• Challenge Period: ${defaultConfig.challengePeriod} ${network.toLowerCase() === 'mainnet' ? 'seconds (7 days)' : 'seconds (12 seconds)'}
• L2 Block Time: ${defaultConfig.l2BlockTime} seconds
• Output Root Frequency: ${defaultConfig.outputRootFrequency} seconds (${defaultConfig.outputRootFrequency / defaultConfig.l2BlockTime} blocks)
• Batch Submission Frequency: ${defaultConfig.batchSubmissionFrequency} seconds (${defaultConfig.batchSubmissionFrequency / 12} L1 blocks)`;
      
      return {
        content: [
          {
            type: 'text',
            text: responseText
          }
        ]
      };
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private async handleGetDeploymentStatus(args: { backendUrl: string; username: string; password: string; deploymentId: string }) {
    // Initialize backend client with provided credentials
    await this.initializeBackendClient(args.backendUrl, args.username, args.password);

    if (!this.backendClient) {
      throw new Error('Failed to initialize backend client');
    }
    const deployment = await this.backendClient.getDeployment(args.deploymentId);

    if (deployment.status === 'Deployed') {
      return {
        content: [
          {
            type: 'text',
            text: `Deployment Status: ${deployment.status}\nL2 URL: ${deployment.metadata.l2_url}\nBridge URL: ${deployment.metadata.bridge_url}`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Deployment Status: ${deployment.status}\n`
        }
      ]
    };
  }

  private async handleListDeployments(args: { backendUrl: string; username: string; password: string }) {
    // Initialize backend client with provided credentials
    await this.initializeBackendClient(args.backendUrl, args.username, args.password);

    if (!this.backendClient) {
      throw new Error('Failed to initialize backend client');
    }
    const deployments = await this.backendClient.listDeployments();

    const deploymentList = deployments.map(d =>
      `- ${d.id}: ${d.status} - ${d.config.chainName || 'Unknown'}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Deployments:\n${deploymentList || 'No deployments found'}`
        }
      ]
    };
  }

  private async handleTerminateDeployment(args: { backendUrl: string; username: string; password: string; deploymentId: string }) {
    // Initialize backend client with provided credentials
    await this.initializeBackendClient(args.backendUrl, args.username, args.password);

    if (!this.backendClient) {
      throw new Error('Failed to initialize backend client');
    }
    const result = await this.backendClient.terminateDeployment(args.deploymentId);


    return {
      content: [
        {
          type: 'text',
          text: `Deployment termination ${result.success ? 'successful' : 'failed'}: ${result.message}`
        }
      ]
    };
  }


  private async handleGetAccountsFromSeed(args: { backendUrl: string; username: string; password: string; seedPhrase: string; l1RpcUrl: string }) {
    try {
      // Initialize backend client with provided credentials
      await this.initializeBackendClient(args.backendUrl, args.username, args.password);

      if (!this.backendClient) {
        throw new Error('Failed to initialize backend client');
      }

      const accounts = await generateAccountsFromSeedPhrase(args.seedPhrase, args.l1RpcUrl);

      const accountList = accounts.map((account: Account, index: number) =>
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

  private async handleTestConnection(args: { backendUrl: string; username: string; password: string }) {
    // Initialize backend client with provided credentials
    await this.initializeBackendClient(args.backendUrl, args.username, args.password);

    if (!this.backendClient) {
      throw new Error('Failed to initialize backend client');
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

  private async handleGetDefaultChainConfig(args: { network: string }) {
    const network = args.network.toLowerCase() as 'mainnet' | 'testnet';
    const config = network === 'mainnet' ? ChainConfiguration.Mainnet : ChainConfiguration.Testnet;
    
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

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('🚀 Chain Deployment MCP Server started successfully');
    } catch (error) {
      console.error('❌ Failed to start MCP server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new ChainDeploymentMCPServer();
server.run().catch(console.error); 