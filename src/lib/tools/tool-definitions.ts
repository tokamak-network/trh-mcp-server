import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const TOOLS: Tool[] = [
  {
    name: 'initialize_backend',
    description: 'Initialize backend client with credentials (call this first, or provide credentials directly in other tools)',
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
    description: 'Deploy a new chain with the specified configuration. IMPORTANT: You must ask the user for the network type (testnet/mainnet) and chain configuration preference before calling this tool. REQUIRED PARAMETERS: network, awsAccessKey, awsSecretKey, awsRegion, l1RpcUrl, l1BeaconUrl, chainName, registerCandidate, useDefaultChainConfig. CHAIN CONFIGURATION: You MUST set useDefaultChainConfig to true (recommended) or false (with custom values). The tool will show the default configuration and ask for confirmation. For testnet: Use default chain configuration (useDefaultChainConfig: true) is recommended. For mainnet: Carefully review default values and consider custom configuration based on your specific requirements. ACCOUNT FIELDS: You must provide EITHER Option A (seedPhrase + adminAccountIndex, sequencerAccountIndex, batcherAccountIndex, proposerAccountIndex) OR Option B (adminAccount, sequencerAccount, batcherAccount, proposerAccount private keys directly).',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'REQUIRED: Backend server URL (optional if already initialized)' },
        username: { type: 'string', description: 'REQUIRED: Backend username (optional if already initialized)' },
        password: { type: 'string', description: 'REQUIRED: Backend password (optional if already initialized)' },
        seedPhrase: { type: 'string', description: 'Seed phrase for account generation (optional if using private keys)' },
        awsAccessKey: { type: 'string', description: 'REQUIRED: AWS access key' },
        awsSecretKey: { type: 'string', description: 'REQUIRED: AWS secret access key' },
        awsRegion: {
          type: 'string',
          description: 'REQUIRED: AWS region (restricted list)'
        },
        l1RpcUrl: { type: 'string', description: 'REQUIRED: L1 RPC URL' },
        l1BeaconUrl: { type: 'string', description: 'REQUIRED: L1 beacon URL' },
        // Individual chain configuration fields (Advanced users only - only used when useDefaultChainConfig is false)
        l2BlockTime: { 
          type: 'number', 
          description: 'Advanced: L2 block time in seconds (only used when useDefaultChainConfig is false - not recommended for production)',
          minimum: 1
        },
        batchSubmissionFrequency: { 
          type: 'number', 
          description: 'Advanced: Batch submission frequency in seconds (must be divisible by 12, only used when useDefaultChainConfig is false - not recommended for production)',
          multipleOf: 12,
          minimum: 12
        },
        outputRootFrequency: { 
          type: 'number', 
          description: 'Advanced: Output root frequency in seconds (must be divisible by l2BlockTime value, only used when useDefaultChainConfig is false - not recommended for production)',
          minimum: 1
        },
        challengePeriod: { 
          type: 'number', 
          description: 'Advanced: Challenge period in seconds (only used when useDefaultChainConfig is false - not recommended for production)',
          minimum: 1
        },
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
          description: 'Advanced: Chain configuration parameters object (only used when useDefaultChainConfig is false - not recommended for production). If not provided, individual fields will be used.'
        },
        chainName: { type: 'string', description: 'REQUIRED: Name of the chain' },
        network: {
          type: 'string',
          enum: ['Mainnet', 'Testnet', 'mainnet', 'testnet'],
          description: 'REQUIRED: Network type to deploy to. Choose "testnet" for testing (no real funds) or "mainnet" for production (real funds will be used)'
        },
        useDefaultChainConfig: {
          type: 'boolean',
          description: 'REQUIRED: Set to true to use default chain configuration (recommended for most users), or false to provide custom configuration. For testnet: RECOMMENDED to set to true. For mainnet: Review default values carefully and consider custom configuration based on your specific requirements.',
        },
        registerCandidate: { type: 'boolean', description: 'REQUIRED: Whether to enable register candidate' },
        registerCandidateParams: {
          type: 'object',
          description: 'REQUIRED if registerCandidate is true, registration parameters',
          properties: {
            amount: { 
              type: 'number', 
              description: 'Registration amount (must be > 1000)',
              minimum: 1000.01
            },
            memo: { type: 'string', description: 'REQUIRED if registerCandidate is true: Registration memo' },
            nameInfo: { type: 'string', description: 'Registration name info' }
          },
          required: ['amount', 'memo', 'nameInfo']
        },
        // Account fields - provide either indices (with seedPhrase) or private keys directly
        adminAccountIndex: {
          type: 'number',
          description: 'REQUIRED if using Option A: Index of admin account from generated accounts (0-9, requires seedPhrase)',
          minimum: 0,
          maximum: 9
        },
        sequencerAccountIndex: {
          type: 'number',
          description: 'REQUIRED if using Option A: Index of sequencer account from generated accounts (0-9, requires seedPhrase)',
          minimum: 0,
          maximum: 9
        },
        batcherAccountIndex: {
          type: 'number',
          description: 'REQUIRED if using Option A: Index of batcher account from generated accounts (0-9, requires seedPhrase)',
          minimum: 0,
          maximum: 9
        },
        proposerAccountIndex: {
          type: 'number',
          description: 'REQUIRED if using Option A: Index of proposer account from generated accounts (0-9, requires seedPhrase)',
          minimum: 0,
          maximum: 9
        },
        // Private key fields (alternative to indices)
        adminAccount: { type: 'string', description: 'REQUIRED if using Option B: Admin account private key (64 hex characters)' },
        sequencerAccount: { type: 'string', description: 'REQUIRED if using Option B: Sequencer account private key (64 hex characters)' },
        batcherAccount: { type: 'string', description: 'REQUIRED if using Option B: Batcher account private key (64 hex characters)' },
        proposerAccount: { type: 'string', description: 'REQUIRED if using Option B: Proposer account private key (64 hex characters)' }
      },
      required: [
        'awsAccessKey', 'awsSecretKey', 'awsRegion',
        'l1RpcUrl', 'l1BeaconUrl', 'chainName', 'network', 'registerCandidate',
        'useDefaultChainConfig'
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
        deploymentId: { type: 'string', description: 'Deployment ID to terminate' }
      },
      required: ['backendUrl', 'username', 'password', 'deploymentId']
    }
  },
  {
    name: 'stop_deployment',
    description: 'Stop a chain deployment (can be resumed later)',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'Backend server URL' },
        username: { type: 'string', description: 'Backend username' },
        password: { type: 'string', description: 'Backend password' },
        deploymentId: { type: 'string', description: 'Deployment ID to stop' }
      },
      required: ['backendUrl', 'username', 'password', 'deploymentId']
    }
  },
  {
    name: 'resume_deployment',
    description: 'Resume a stopped chain deployment',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'Backend server URL' },
        username: { type: 'string', description: 'Backend username' },
        password: { type: 'string', description: 'Backend password' },
        deploymentId: { type: 'string', description: 'Deployment ID to resume' }
      },
      required: ['backendUrl', 'username', 'password', 'deploymentId']
    }
  },
  {
    name: 'install_bridge',
    description: 'Install bridge for a chain deployment',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'Backend server URL' },
        username: { type: 'string', description: 'Backend username' },
        password: { type: 'string', description: 'Backend password' },
        deploymentId: { type: 'string', description: 'Deployment ID to install bridge for' }
      },
      required: ['backendUrl', 'username', 'password', 'deploymentId']
    }
  },
  {
    name: 'install_block_explorer',
    description: 'Install block explorer for a chain deployment with database and API integrations',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'Backend server URL' },
        username: { type: 'string', description: 'Backend username' },
        password: { type: 'string', description: 'Backend password' },
        deploymentId: { type: 'string', description: 'Deployment ID to install block explorer for' },
        awsAccessKey: { type: 'string', description: 'AWS access key for RDS validation' },
        awsSecretKey: { type: 'string', description: 'AWS secret access key for RDS validation' },
        awsRegion: { type: 'string', description: 'AWS region for RDS validation' },
        databaseUsername: { type: 'string', description: 'AWS RDS PostgreSQL database username' },
        databasePassword: { type: 'string', description: 'AWS RDS PostgreSQL database password' },
        coinmarketcapKey: { type: 'string', description: 'CoinMarketCap API key' },
        walletConnectId: { type: 'string', description: 'WalletConnect project ID' }
      },
      required: ['backendUrl', 'username', 'password', 'deploymentId', 'awsAccessKey', 'awsSecretKey', 'awsRegion', 'databaseUsername', 'databasePassword', 'coinmarketcapKey', 'walletConnectId']
    }
  },
  {
    name: 'install_monitoring',
    description: 'Install monitoring tools (Grafana) for a chain deployment',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'Backend server URL' },
        username: { type: 'string', description: 'Backend username' },
        password: { type: 'string', description: 'Backend password' },
        deploymentId: { type: 'string', description: 'Deployment ID to install monitoring for' },
        grafanaPassword: { type: 'string', description: 'Grafana admin password (must be at least 6 characters with letters and numbers)' }
      },
      required: ['backendUrl', 'username', 'password', 'deploymentId', 'grafanaPassword']
    }
  },
  {
    name: 'uninstall_bridge',
    description: 'Uninstall bridge for a chain deployment',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'Backend server URL' },
        username: { type: 'string', description: 'Backend username' },
        password: { type: 'string', description: 'Backend password' },
        deploymentId: { type: 'string', description: 'Deployment ID to uninstall bridge for' }
      },
      required: ['backendUrl', 'username', 'password', 'deploymentId']
    }
  },
  {
    name: 'uninstall_block_explorer',
    description: 'Uninstall block explorer for a chain deployment',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'Backend server URL' },
        username: { type: 'string', description: 'Backend username' },
        password: { type: 'string', description: 'Backend password' },
        deploymentId: { type: 'string', description: 'Deployment ID to uninstall block explorer for' }
      },
      required: ['backendUrl', 'username', 'password', 'deploymentId']
    }
  },
  {
    name: 'uninstall_monitoring',
    description: 'Uninstall monitoring tools (Grafana) for a chain deployment',
    inputSchema: {
      type: 'object',
      properties: {
        backendUrl: { type: 'string', description: 'Backend server URL' },
        username: { type: 'string', description: 'Backend username' },
        password: { type: 'string', description: 'Backend password' },
        deploymentId: { type: 'string', description: 'Deployment ID to uninstall monitoring for' }
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
        seedPhrase: { type: 'string', description: 'Seed phrase to generate accounts from' },
        l1RpcUrl: { type: 'string', description: 'L1 RPC URL to check balances' }
      },
      required: ['seedPhrase', 'l1RpcUrl']
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
    description: 'Get the default chain configuration for Mainnet or Testnet. For testnet: These default values are recommended. For mainnet: Review carefully and consider custom configuration based on your specific requirements.',
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
]; 