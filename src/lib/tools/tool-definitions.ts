import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const TOOLS: Tool[] = [
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
]; 