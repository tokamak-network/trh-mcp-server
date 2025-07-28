import { BackendClient } from '../../../services/backend-client.js';
import { generateAccountsFromSeedPhrase } from '../../utils/wallet.js';
import { getDefaultChainConfig, getDefaultConfigMessage, NetworkType } from '../../config/chain.js';
import { validateAwsCredentials, getSupportedAwsRegions } from '../../utils/aws.js';
import { verifyL1BeaconUrl, verifyL1RpcUrl } from '../../utils/rpc.js';

export class DeploymentHandlers {
  constructor(private backendClient: BackendClient) {}

  async handleDeployChain(args: any) {
    console.error('🚀 Starting chain deployment process...');
    
    // Show default configuration to user before proceeding
    const network = args.network || 'testnet';
    const defaultConfigMessage = getDefaultConfigMessage(network);
    console.error(defaultConfigMessage);
    
    try {
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

      console.error('🌐 Validating L1 RPC URL...');
      const l1RpcValidation = await verifyL1RpcUrl(args.l1RpcUrl);
      if (!l1RpcValidation.isValid) {
        throw new Error(`L1 RPC URL validation failed: ${l1RpcValidation.error}`);
      }

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
      const defaultConfig = getDefaultChainConfig(args.network);
      
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

  async handleGetDeploymentStatus(args: { deploymentId: string }) {
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

  async handleListDeployments() {
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

  async handleTerminateDeployment(args: { deploymentId: string }) {
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

  async handleStopDeployment(args: { deploymentId: string }) {
    try {
      console.error('⏸️  Stopping deployment...');
      const result = await this.backendClient.stopDeployment(args.deploymentId);

      return {
        content: [
          {
            type: 'text',
            text: `Deployment stop ${result.success ? 'successful' : 'failed'}: ${result.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Deployment stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  async handleResumeDeployment(args: { deploymentId: string }) {
    try {
      console.error('▶️  Resuming deployment...');
      const result = await this.backendClient.resumeDeployment(args.deploymentId);

      return {
        content: [
          {
            type: 'text',
            text: `Deployment resume ${result.success ? 'successful' : 'failed'}: ${result.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Deployment resume failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
} 