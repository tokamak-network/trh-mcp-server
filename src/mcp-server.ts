import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { BackendClient } from './services/backend-client.js';
import { ChainDeploymentRequest } from './types/chain-deployment.js';

class ChainDeploymentMCPServer {
  private server: Server;
  private backendClient: BackendClient;

  constructor() {
    this.server = new Server(
      {
        name: 'chain-deployment-mcp-server',
        version: '1.0.0',
      },
    );

    // Initialize backend client from environment variables
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const apiKey = process.env.BACKEND_API_KEY;
    this.backendClient = new BackendClient(backendUrl, apiKey);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'deploy_chain',
            description: 'Deploy a new chain with the specified configuration',
            inputSchema: {
              type: 'object',
              properties: {
                adminAccount: { type: 'string', description: 'Admin account address' },
                awsAccessKey: { type: 'string', description: 'AWS access key' },
                awsRegion: { type: 'string', description: 'AWS region' },
                awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
                batchSubmissionFrequency: { type: 'number', description: 'Batch submission frequency' },
                batcherAccount: { type: 'string', description: 'Batcher account address' },
                chainName: { type: 'string', description: 'Name of the chain' },
                challengePeriod: { type: 'number', description: 'Challenge period in blocks' },
                deploymentPath: { type: 'string', description: 'Deployment path' },
                l1BeaconUrl: { type: 'string', description: 'L1 beacon URL' },
                l1RpcUrl: { type: 'string', description: 'L1 RPC URL' },
                l2BlockTime: { type: 'number', description: 'L2 block time in seconds' },
                network: { 
                  type: 'string', 
                  enum: ['Mainnet', 'Testnet', 'Devnet'],
                  description: 'Network type'
                },
                outputRootFrequency: { type: 'number', description: 'Output root frequency' },
                proposerAccount: { type: 'string', description: 'Proposer account address' },
                registerCandidate: { type: 'boolean', description: 'Whether to register as candidate' },
                registerCandidateParams: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', description: 'Registration amount' },
                    memo: { type: 'string', description: 'Registration memo' },
                    nameInfo: { type: 'string', description: 'Registration name info' }
                  },
                  required: ['amount', 'memo', 'nameInfo']
                },
                sequencerAccount: { type: 'string', description: 'Sequencer account address' }
              },
              required: [
                'adminAccount', 'awsAccessKey', 'awsRegion', 'awsSecretAccessKey',
                'batchSubmissionFrequency', 'batcherAccount', 'chainName', 'challengePeriod',
                'deploymentPath', 'l1BeaconUrl', 'l1RpcUrl', 'l2BlockTime', 'network',
                'outputRootFrequency', 'proposerAccount', 'registerCandidate',
                'registerCandidateParams', 'sequencerAccount'
              ]
            }
          },
          {
            name: 'get_deployment_status',
            description: 'Get the status of a chain deployment',
            inputSchema: {
              type: 'object',
              properties: {
                deploymentId: { type: 'string', description: 'Deployment ID to check' }
              },
              required: ['deploymentId']
            }
          },
          {
            name: 'list_deployments',
            description: 'List all chain deployments',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'cancel_deployment',
            description: 'Cancel a chain deployment',
            inputSchema: {
              type: 'object',
              properties: {
                deploymentId: { type: 'string', description: 'Deployment ID to cancel' }
              },
              required: ['deploymentId']
            }
          },
          {
            name: 'get_chain_info',
            description: 'Get information about a deployed chain',
            inputSchema: {
              type: 'object',
              properties: {
                chainId: { type: 'string', description: 'Chain ID to get info for' }
              },
              required: ['chainId']
            }
          },
          {
            name: 'test_backend_connection',
            description: 'Test connection to the backend server',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ] as Tool[]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'deploy_chain':
            return await this.handleDeployChain(args as ChainDeploymentRequest);

          case 'get_deployment_status':
            return await this.handleGetDeploymentStatus(args as { deploymentId: string });

          case 'list_deployments':
            return await this.handleListDeployments();

          case 'cancel_deployment':
            return await this.handleCancelDeployment(args as { deploymentId: string });

          case 'get_chain_info':
            return await this.handleGetChainInfo(args as { chainId: string });

          case 'test_backend_connection':
            return await this.handleTestConnection();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
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

  private async handleDeployChain(args: ChainDeploymentRequest) {
    const result = await this.backendClient.deployChain(args);
    
    return {
      content: [
        {
          type: 'text',
          text: `Chain deployment ${result.success ? 'initiated successfully' : 'failed'}. ${
            result.deploymentId ? `Deployment ID: ${result.deploymentId}` : ''
          } ${result.message || ''}`
        }
      ]
    };
  }

  private async handleGetDeploymentStatus(args: { deploymentId: string }) {
    const status = await this.backendClient.getDeploymentStatus(args.deploymentId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Deployment Status: ${status.status}\nProgress: ${status.progress || 0}%\nMessage: ${status.message || 'No message'}\nChain ID: ${status.chainId || 'Not assigned yet'}`
        }
      ]
    };
  }

  private async handleListDeployments() {
    const deployments = await this.backendClient.listDeployments();
    
    const deploymentList = deployments.map(d => 
      `- ${d.deploymentId}: ${d.status} (${d.progress || 0}%) - ${d.chainName || 'Unknown'}`
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

  private async handleCancelDeployment(args: { deploymentId: string }) {
    const result = await this.backendClient.cancelDeployment(args.deploymentId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Deployment cancellation ${result.success ? 'successful' : 'failed'}: ${result.message}`
        }
      ]
    };
  }

  private async handleGetChainInfo(args: { chainId: string }) {
    const chainInfo = await this.backendClient.getChainInfo(args.chainId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Chain Info for ${args.chainId}:\n${JSON.stringify(chainInfo, null, 2)}`
        }
      ]
    };
  }

  private async handleTestConnection() {
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Chain Deployment MCP Server started');
  }
}

// Start the server
const server = new ChainDeploymentMCPServer();
server.run().catch(console.error); 