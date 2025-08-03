import { BackendClient } from '../../../services/backend-client.js';
import { generateAccountsFromSeedPhrase } from '../../utils/wallet.js';
import { getDefaultChainConfig, getDefaultConfigMessage, NetworkType } from '../../config/chain.js';
import { validateAwsCredentials, getSupportedAwsRegions } from '../../utils/aws.js';
import { verifyL1BeaconUrl, verifyL1RpcUrl } from '../../utils/rpc.js';

export class DeploymentHandlers {
  constructor(private backendClient: BackendClient) {}

  async handleDeployChain(args: any) {
    console.error('🚀 Starting chain deployment process...');
    
    // Validate required parameters
    const requiredParams = ['awsAccessKey', 'awsSecretKey', 'awsRegion', 'l1RpcUrl', 'l1BeaconUrl', 'chainName', 'network', 'registerCandidate', 'useDefaultChainConfig'];
    const missingParams = requiredParams.filter(param => args[param] === undefined);
    
    if (missingParams.length > 0) {
      console.error('❌ MISSING REQUIRED PARAMETERS:');
      console.error('The following parameters are required but not provided:');
      missingParams.forEach(param => console.error(`• ${param}`));
      console.error('');
      console.error('💡 Please provide all required parameters before proceeding with deployment.');
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }
    
    // Validate registerCandidateParams when registerCandidate is true
    if (args.registerCandidate === true && !args.registerCandidateParams) {
      console.error('❌ MISSING REGISTRATION PARAMETERS:');
      console.error('When registerCandidate is true, you must provide registerCandidateParams with:');
      console.error('• amount (must be > 1000)');
      console.error('• memo');
      console.error('• nameInfo');
      throw new Error('Missing required parameters: registerCandidateParams');
    }
    
    if (args.registerCandidate === true && args.registerCandidateParams) {
      const requiredRegParams = ['amount', 'memo', 'nameInfo'];
      const missingRegParams = requiredRegParams.filter(param => args.registerCandidateParams[param] === undefined);
      
      if (missingRegParams.length > 0) {
        console.error('❌ MISSING REGISTRATION PARAMETERS:');
        console.error('The following registration parameters are required but not provided:');
        missingRegParams.forEach(param => console.error(`• ${param}`));
        throw new Error(`Missing required registration parameters: ${missingRegParams.join(', ')}`);
      }
      
      if (args.registerCandidateParams.amount <= 1000) {
        throw new Error('Registration amount must be greater than 1000');
      }
    }
    
    // Normalize network to lowercase and validate
    let network = args.network.toLowerCase();
    if (network !== 'testnet' && network !== 'mainnet') {
      throw new Error('Invalid network. Must be "testnet" or "mainnet"');
    }
    
    // Show default configuration to user before proceeding
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

      // Handle chain configuration based on user preference
      let chainConfig;
      const useDefaultConfig = args.useDefaultChainConfig;
      
      // Show default configuration for reference
      const defaultConfig = getDefaultChainConfig(network);
      const defaultConfigMessage = getDefaultConfigMessage(network);
      
      console.error('⚙️  CHAIN CONFIGURATION:');
      console.error('='.repeat(80));
      console.error(defaultConfigMessage);
      console.error('='.repeat(80));
      
      if (useDefaultConfig) {
        console.error('✅ Using default chain configuration as specified.');
        chainConfig = defaultConfig;
      } else {
        console.error('⚠️  Custom chain configuration requested.');
        // Check if custom values are provided
        if (args.l2BlockTime !== undefined || args.batchSubmissionFrequency !== undefined || 
            args.outputRootFrequency !== undefined || args.challengePeriod !== undefined) {
          chainConfig = {
            l2BlockTime: args.l2BlockTime || defaultConfig.l2BlockTime,
            batchSubmissionFrequency: args.batchSubmissionFrequency || defaultConfig.batchSubmissionFrequency,
            outputRootFrequency: args.outputRootFrequency || defaultConfig.outputRootFrequency,
            challengePeriod: args.challengePeriod || defaultConfig.challengePeriod
          };
          console.error(`⚙️  Using CUSTOM chain configuration for ${network}:`, JSON.stringify(chainConfig, null, 2));
        } else if (args.chainConfiguration) {
          chainConfig = args.chainConfiguration;
          console.error(`⚙️  Using PROVIDED chain configuration for ${network}:`, JSON.stringify(chainConfig, null, 2));
        } else {
          throw new Error('Custom configuration requested but no custom values provided. Please provide l2BlockTime, batchSubmissionFrequency, outputRootFrequency, and challengePeriod, or set useDefaultChainConfig to true.');
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
      
      // Create a user-friendly confirmation message
      const confirmationMessage = this.createDeploymentConfirmation(args, backendArgs, useDefaultConfig, network);
      
      console.error('🔍 DEPLOYMENT CONFIRMATION REQUIRED:');
      console.error('='.repeat(80));
      console.error(confirmationMessage);
      console.error('='.repeat(80));
      console.error('⚠️  Please review the configuration above carefully.');
      console.error('🚀 Proceeding with deployment...');
      
      try {
        console.error(`📋 Backend payload:`, JSON.stringify(backendArgs, null, 2));
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

      const configType = useDefaultConfig 
        ? (network === 'testnet' ? 'recommended default' : 'default (review carefully)')
        : 'custom (not recommended)';
      
      // Include default configuration info in the response
      const responseDefaultConfig = getDefaultChainConfig(args.network);
      
      let responseText = `🚀 Chain deployment ${result.status === 200 ? 'initiated successfully' : 'failed'} using ${configType} configuration.`;

      if (result.status === 200 && result.data?.stackId) {
        responseText += `
        📋 DEPLOYMENT INFORMATION:
        • Stack ID: ${result.data.stackId}
        • Chain Name: ${args.chainName}
        • Network: ${network.charAt(0).toUpperCase() + network.slice(1)}

        📋 Default Configuration for ${network} (for reference):
        • Challenge Period: ${responseDefaultConfig.challengePeriod} ${network.toLowerCase() === 'mainnet' ? 'seconds (7 days)' : 'seconds (12 seconds)'}
        • L2 Block Time: ${responseDefaultConfig.l2BlockTime} seconds
        • Output Root Frequency: ${responseDefaultConfig.outputRootFrequency} seconds (${responseDefaultConfig.outputRootFrequency / responseDefaultConfig.l2BlockTime} blocks)
        • Batch Submission Frequency: ${responseDefaultConfig.batchSubmissionFrequency} seconds (${responseDefaultConfig.batchSubmissionFrequency / 12} L1 blocks)

        ⏱️  DEPLOYMENT TIMELINE:
        • Expected Duration: 30-40 minutes

        📊 MONITORING OPTIONS:
        1. **Automatic Monitoring**: The system will check deployment status every 5 minutes
        2. **Manual Check**: Use \`get_deployment_status\` with Stack ID: ${result.data.stackId}
        3. **List All**: Use \`list_deployments\` to see all your deployments

        🔍 STATUS CHECKING:
        • Use: \`get_deployment_status\` with deploymentId: "${result.data.stackId}"
        • Expected final status: "Deployed" (when complete)
        • URLs will be provided once deployment is finished

        ⚠️  IMPORTANT NOTES:
        • Deployment is running in the background - you can close this session
        • AWS resources are being created (may incur costs)
        • Check status periodically or wait for completion notification
        • If deployment fails, you can retry or check logs for details`;
      } else {
        responseText += ` ${result.message || ''}`;
      }

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
    try {
      const deployment = await this.backendClient.getDeployment(args.deploymentId);
      
      let statusText = `📊 DEPLOYMENT STATUS REPORT
          ${'='.repeat(50)}

          🔍 Deployment ID: ${args.deploymentId}
          📋 Chain Name: ${deployment.config?.chainName || 'Unknown'}
          🌐 Network: ${deployment.config?.network || 'Unknown'}
          ⏱️  Status: ${deployment.status}`;

                if (deployment.status === 'Deployed') {
                  statusText += `

          ✅ DEPLOYMENT COMPLETED SUCCESSFULLY!

          🔗 ACCESS URLs:
          • L2 RPC URL: ${deployment.metadata?.l2_url || 'Not available'}
          • Bridge URL: ${deployment.metadata?.bridge_url || 'Not available'}

          🎉 Your chain is now live and ready to use!
          💡 You can now install additional components like bridge, block explorer, or monitoring.`;
                } else if (deployment.status === 'Deploying') {
                  statusText += `

          ⏳ DEPLOYMENT IN PROGRESS:
          • Expected completion: 30-40 minutes from start time

          💡 TIP: Check back in 5-10 minutes for status updates
          📊 Use \`list_deployments\` to see all your deployments
        `;
      } else if (deployment.status === 'Failed') {
        statusText += `
          ❌ DEPLOYMENT FAILED:
          • Verify your AWS credentials and permissions
          • Ensure all required parameters are correct

          🔄 You can retry the deployment or contact support for assistance.`;
                } else if (deployment.status === 'Stopped') {
                  statusText += `

          ⏸️  DEPLOYMENT STOPPED:
          • Deployment was manually stopped
          • Use \`resume_deployment\` to continue
          • Or use \`terminate_deployment\` to clean up resources`;
                } else {
                  statusText += `

          📋 Status Details: ${deployment.status}
          💡 Check back later for updates or use \`list_deployments\` for overview.
        `;
      }

      return {
        content: [
          {
            type: 'text',
            text: statusText
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error checking deployment status: ${error instanceof Error ? error.message : 'Unknown error'}\n\n💡 Verify the deployment ID is correct and try again.`
          }
        ]
      };
    }
  }

  async handleListDeployments() {
    try {
      const deployments = await this.backendClient.listDeployments();

      if (deployments.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📊 DEPLOYMENT LIST
                ${'='.repeat(30)}

                ❌ No deployments found.

                💡 To create a new deployment, use the \`deploy_chain\` tool.
              `
            }
          ]
        };
      }

      const deploymentList = deployments.map(d => {
        const statusEmoji = d.status === 'Deployed' ? '✅' : 
                           d.status === 'Deploying' ? '⏳' : 
                           d.status === 'Failed' ? '❌' : 
                           d.status === 'Stopped' ? '⏸️' : '❓';
        
        return `${statusEmoji} ${d.id}: ${d.status} - ${d.config?.chainName || 'Unknown'} (${d.config?.network || 'Unknown'})`;
      }).join('\n');

      const summary = deployments.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const summaryText = Object.entries(summary)
        .map(([status, count]) => `${status}: ${count}`)
        .join(', ');

      return {
        content: [
          {
            type: 'text',
            text: `📊 DEPLOYMENT LIST
              ${'='.repeat(30)}

              📋 Summary: ${summaryText}
              📊 Total Deployments: ${deployments.length}

              ${deploymentList}

              💡 Use \`get_deployment_status\` with a deployment ID to get detailed information.
              ⏱️  Deploying status typically takes 30-40 minutes to complete.
            `
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error listing deployments: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
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

  private createDeploymentConfirmation(args: any, backendArgs: any, useDefaultConfig: boolean, network: string): string {
    const configType = useDefaultConfig 
      ? (network === 'testnet' ? '✅ RECOMMENDED DEFAULT' : '⚠️  DEFAULT (REVIEW CAREFULLY)')
      : '⚠️  CUSTOM (NOT RECOMMENDED)';
    const networkDisplay = network.charAt(0).toUpperCase() + network.slice(1);
    
    // Mask sensitive information
    const maskPrivateKey = (key: string) => key ? `${key.substring(0, 8)}...${key.substring(key.length - 8)}` : 'Not provided';
    const maskPassword = (password: string) => password ? '*'.repeat(Math.min(password.length, 8)) : 'Not provided';
    
    let confirmation = `🔧 CHAIN DEPLOYMENT CONFIGURATION SUMMARY
      ${'='.repeat(60)}

      📋 BASIC INFORMATION:
      • Chain Name: ${args.chainName}
      • Network: ${networkDisplay}
      • Configuration Type: ${configType}

      🌐 NETWORK CONFIGURATION:
      • L1 RPC URL: ${args.l1RpcUrl}
      • L1 Beacon URL: ${args.l1BeaconUrl}

      ☁️  AWS CONFIGURATION:
      • AWS Region: ${args.awsRegion}
      • AWS Access Key: ${args.awsAccessKey ? `${args.awsAccessKey.substring(0, 8)}...` : 'Not provided'}
      • AWS Secret Key: ${args.awsSecretKey ? '***MASKED***' : 'Not provided'}

      ⚙️  CHAIN CONFIGURATION:
      • L2 Block Time: ${backendArgs.l2BlockTime} seconds
      • Batch Submission Frequency: ${backendArgs.batchSubmissionFrequency} seconds (${backendArgs.batchSubmissionFrequency / 12} L1 blocks)
      • Output Root Frequency: ${backendArgs.outputRootFrequency} seconds (${backendArgs.outputRootFrequency / backendArgs.l2BlockTime} blocks)
      • Challenge Period: ${backendArgs.challengePeriod} seconds (${network.toLowerCase() === 'mainnet' ? '7 days' : '12 seconds'})

      👤 ACCOUNT CONFIGURATION:
      • Admin Account: ${maskPrivateKey(backendArgs.adminAccount)}
      • Sequencer Account: ${maskPrivateKey(backendArgs.sequencerAccount)}
      • Batcher Account: ${maskPrivateKey(backendArgs.batcherAccount)}
      • Proposer Account: ${maskPrivateKey(backendArgs.proposerAccount)}

      🎯 REGISTRATION CONFIGURATION:
      • Register Candidate: ${args.registerCandidate ? '✅ YES' : '❌ NO'}`;

          if (args.registerCandidate && args.registerCandidateParams) {
            confirmation += `
      • Registration Amount: ${args.registerCandidateParams.amount} ETH
      • Registration Memo: ${args.registerCandidateParams.memo}
      • Registration Name: ${args.registerCandidateParams.nameInfo}
      `;
    }

    confirmation += `
      💡 CONFIGURATION NOTES:
      • ${useDefaultConfig 
          ? (network === 'testnet' 
              ? 'Using optimized default values recommended for testnet' 
              : 'Using default values for mainnet - review carefully and consider custom configuration')
          : 'Using custom values - ensure you understand the implications'}
      • ${network.toLowerCase() === 'mainnet' ? 'Mainnet deployment - real funds will be used' : 'Testnet deployment - no real funds required'}
      • Deployment will create AWS resources that may incur costs

      ⚠️  IMPORTANT: Review all parameters above before proceeding.
    `;

    return confirmation;
  }
} 