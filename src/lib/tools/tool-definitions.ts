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
        description: `
      Deploy a new chain with the specified configuration. 
       Step 1️⃣: USER PROMPT: When starting deployment, show this message to the user: "Of course! You\'re just a few steps away from launching your own Layer 2 blockchain using the Tokamak Rollup Hub SDK 🚀 Let\'s get started: 👉 Would you like to create a: Testnet (safe environment with no real funds), or Mainnet (live, production-ready)? Most users start with testnet to try things out. 🛠️ Note: Currently, the SDK supports deploying rollups based on the Thanos stack, which is a customized fork of the Optimism architecture developed by the Tokamak Network. If you\'d like to learn more about the Thanos stack and how it works, feel free to check out the official guide: 📘 Thanos Stack Overview – Tokamak Docs(https://docs.tokamak.network/home/service-guide/rollup-hub/rollup-hub-sdkv1/rollup-stack/thanos-stack/thanos-stack-overview) Let me know how you\'d like to proceed! Would you like to deploy a testnet chain?" 
       Step 2️⃣: CREDENTIAL COLLECTION FLOW: After user chooses testnet/mainnet, collect MCP server credentials step by step: 1) "Awesome — let\'s get everything ready to deploy your testnet rollup chain! 🛠️ To begin, I need access to your local MCP (Model Context Protocol) server. This server acts as the backend that manages your deployment using the TRH SDK. Let\'s start by connecting to it. Step 1️⃣ – MCP Server URL Please enter the URL where your MCP server is running. Example: http://localhost:8000 or any public/internal endpoint you\'ve configured." 2) "Great! ✅ I\'ve got the MCP server URL. Step 2️⃣ – MCP Username Now, please share the username you use to log into the MCP dashboard." 3) "Thanks! 👌 One last detail… MCP Password Please enter your password associated with the MCP username. 🔒 Don\'t worry, your credentials are only used to connect securely and are never stored." 4) "Perfect! ✅ I\'ve got everything I need to connect to your MCP server. Let me test the connection before we move on to the next step… 🔄 Great! The connection to your MCP backend was successful. Here are the details: 🌐 Backend URL: [URL] 👤 Username: [username] You\'re now securely connected — no need to re-enter your credentials again during this session." 
       Step 3️⃣: DEFAULT CONFIGURATION DISPLAY: After successful connection, show the default testnet configuration: "I\'ve also loaded the default testnet chain configuration for you. Here\'s a quick summary: 🧩 Default Testnet Chain Parameters: Challenge Period: 12 seconds, L2 Block Time: 6 seconds, Output Root Frequency: every 720 seconds (≈ 120 L2 blocks), Batch Submission Frequency: every 1440 seconds (≈ 120 L1 blocks). These settings are optimized for test environments, but you can customize them later if needed. Please visit our official documentation(https://docs.tokamak.network/home/service-guide/rollup-hub/rollup-hub-sdkv1/rollup-stack/thanos-stack/deployment-guide/testnet#advanced-configurations) to read more about advanced configuration. Would you like to customize any of these settings, or shall we proceed with the default configuration? Just reply with: ✅ Do you want to use default config, or 🔧 Do you want to customize settings" 
       Step 4️⃣: CLOUD SETUP FLOW: After showing default configuration, collect AWS credentials: 1) "Next Step – Cloud Setup To deploy your rollup chain, we\'ll need access to your cloud provider where the infrastructure will run. Let\'s start with your AWS credentials. 🔑 Step 1: Please enter your AWS Access Key. This is used to provision servers and services securely for your chain." 2) "Thanks for sharing your AWS Access Key! 🔐 Step 2️⃣ – AWS Secret Key Please enter your AWS Secret Access Key now. This will be securely used to provision and manage cloud resources (like kubernetes clusters) for your chain. Let me know once you\'re ready!" 3) "Great! ✅ I\'ve got your AWS credentials. Step 3️⃣ – AWS Region Please enter your AWS region where you want to deploy your rollup chain. Common regions include: us-east-1, us-west-2, eu-west-1, ap-northeast-1, ap-southeast-1. This is where your infrastructure will be provisioned." 
       Step 5️⃣: ETHEREUM L1 CONFIGURATION FLOW: After AWS credentials, collect Ethereum endpoints: 1) "Ethereum L1 RPC URL Please enter your Ethereum testnet RPC URL. This is the endpoint used to interact with the Ethereum Layer 1 network — it\'s essential for submitting L2 batches and reading L1 data. You can get a free RPC endpoint from providers like: Alchemy 🟢 Recommended – generous free tier suitable for testnets, QuickNode, ChainList, Infura. Example: https://eth-sepolia.g.alchemy.com/v2/<your-api-key> or https://magical-red-uranium.ethereum-sepolia.quiknode.pro/<your-token> ℹ️ If you\'re on a free plan, Alchemy is recommended — it provides reliable API credits and request-per-second (RPS) limits for smooth testing. Let me know once you have your RPC URL ready!" 2) "✅ Thanks! Your Ethereum RPC URL is set. Now let\'s complete the Ethereum connection by adding the Beacon URL. Step 5️⃣ – Ethereum Beacon URL Please enter your Ethereum Beacon Node URL. This is used by the rollup to fetch consensus information, such as finalized block roots and proofs. It\'s essential for cross-layer interactions like withdrawals. You can get this endpoint from QuickNode: 🔍 How to get it: Log in to QuickNode, Create a new endpoint, Choose Ethereum Sepolia, Select the free plan, Copy the Beacon URL shown in the dashboard. 📘 Example format: https://serene-restless-card.ethereum-sepolia.quiknode.pro/<your-beacon-token> Let me know once you\'ve added the Beacon URL — then we\'ll move on to naming your chain! 🎯" 3) "✅ Perfect — your Ethereum Beacon URL is set. Let\'s now personalize your rollup." 
       Step 6️⃣: CHAIN NAMING FLOW: After Ethereum configuration, collect chain name: 1) "Chain Name What would you like to name your new rollup chain? This name will be used to identify your chain across the dashboard, logs, and metadata files. You can use spaces, hyphens, or capital letters (e.g., TRH MCP, AwesomeL2, Tokamak L2). Let me know your preferred chain name! 🏷️" 2) "✅ Awesome — your chain will be named [CHAIN_NAME] 🎉 Now it\'s time to set up the accounts that will manage and operate your rollup." 
       Step 7️⃣: ACCOUNT SETUP FLOW: After chain naming, present account setup options: 1) "Account Setup You can choose how to provide the accounts that control key roles in your rollup: Option A – Use a Seed Phrase I\'ll generate 10 accounts from your phrase, and you can select which ones to use for: Admin, Sequencer, Batcher, Proposer. Option B – Provide Private Keys You can directly paste the private keys you want to use for each role. Private keys give you full control, while seed phrases are easier for quick setups and testing. How would you like to proceed? Just reply with A for seed phrase or B for private keys." 2) "✅ Got it — you\'ve chosen to manually provide private keys for your rollup accounts. We\'ll need one private key for each of the following roles: 👑 Admin – governance and configuration control, ⚙️ Sequencer – orders and executes L2 transactions, 📦 Batcher – bundles transactions to post on Ethereum, 🧠 Proposer – posts rollup outputs to Ethereum and submits proofs. Please paste each key one by one or as a bundle like this: admin: <your-admin-private-key>, sequencer: <your-sequencer-private-key>, batcher: <your-batcher-private-key>, proposer: <your-proposer-private-key>. 🔒 Make sure you\'re using testnet accounts only. These keys should never be reused on mainnet. Once I receive all 4 keys, I\'ll proceed with the next step!" 3) "✅ All private keys have been received successfully and validated for the following roles: 👑 Admin, ⚙️ Sequencer, 📦 Batcher, 🧠 Proposer. Nice work! 🔐 Your chain is now fully equipped with the necessary accounts." 
       Step 8️⃣: CANDIDATE REGISTRATION FLOW: After account setup, present candidate registration option: 1) "Register Candidate (Optional) Now, a quick question before we launch the deployment: Would you like to register this chain as a candidate? This is used for governance and staking within Tokamak DAO environment. If enabled, you\'ll need to provide some additional info like: TON amount (e.g., >1000.1), Candidate name, Short memo or description. On testnet, this is optional. Most users skip this unless they want to test DAO features. Would you like to register your chain as a candidate? Just reply with: ✅ Yes to register candidate, 🚫 No to skip candidate registration" 2) "Great — skipping candidate registration for now ✅ We\'re almost there!" 
       🚀 FINAL STEP: DEPLOYMENT SUMMARY AND LAUNCH: After all configuration is complete, show deployment summary and start deployment: "🚀 Final Step – Chain Deployment Everything is set for your \"[CHAIN_NAME]\" rollup chain: Item | Value, Network Type | [NETWORK_TYPE], Chain Name | [CHAIN_NAME], AWS Region | [AWS_REGION], Ethereum L1 RPC | (provided by user), Ethereum Beacon URL | (provided by user), MCP Server | [MCP_URL], Account Setup | Private Keys (all 4 roles), Register Candidate | ❌ Skipped, Config | Default testnet config. I\'ll now begin deploying your rollup chain infrastructure using the TRH SDK and your provided configurations. This process typically takes 30–40 minutes ⏳ Would you like me to: 🔁 Check deployment status every 5 minutes and keep you updated? 🕒 Let you know only when deployment is complete? Let me know how you\'d prefer to proceed!" 
     `,
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