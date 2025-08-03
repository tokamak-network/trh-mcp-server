import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BackendClient } from '../../services/backend-client.js';
import { TOOLS } from '../tools/tool-definitions.js';
import { DeploymentHandlers } from '../tools/handlers/deployment.js';
import { InstallationHandlers } from '../tools/handlers/installation.js';
import { UtilityHandlers } from '../tools/handlers/utility.js';

export class ChainDeploymentMCPServer {
  private server: Server;
  private backendClient: BackendClient | null = null;
  private isInitialized: boolean = false;
  private deploymentHandlers: DeploymentHandlers | null = null;
  private installationHandlers: InstallationHandlers | null = null;
  private utilityHandlers: UtilityHandlers | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'trh-mcp-server',
        version: '1.0.0',
      },
    );

    // Initialize utility handlers immediately since some tools don't need backend client
    this.utilityHandlers = new UtilityHandlers(null);

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

    // Initialize handlers with the backend client
    this.deploymentHandlers = new DeploymentHandlers(this.backendClient);
    this.installationHandlers = new InstallationHandlers(this.backendClient);
    // Update utility handlers with backend client (they were already initialized in constructor)
    this.utilityHandlers = new UtilityHandlers(this.backendClient);
  }

  private async ensureBackendClient(args: any): Promise<void> {
    // If backend client is already initialized, use it
    if (this.isInitialized && this.backendClient) {
      return;
    }

    // If credentials are provided in args, use them
    if (args.backendUrl && args.username && args.password) {
      console.error('📡 Initializing backend client with provided credentials...');
      await this.initializeBackendClient(args.backendUrl as string, args.username as string, args.password as string);
      return;
    }

    // If no credentials provided and not initialized, throw a helpful error
    throw new Error('Backend credentials required. Please provide backendUrl, username, and password parameters in your request, or call initialize_backend first with your credentials.');
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: TOOLS
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      console.error(`🔧 Tool called: ${name}`);

      if (!args) {
        throw new Error('Arguments are required');
      }

      try {
        switch (name) {
          case 'initialize_backend':
            await this.initializeBackendClient(args.backendUrl as string, args.username as string, args.password as string);
            return await this.utilityHandlers!.handleInitializeBackend(args as { backendUrl: string; username: string; password: string });

          case 'deploy_chain':
            // Ensure backend client is initialized
            await this.ensureBackendClient(args);
            return await this.deploymentHandlers!.handleDeployChain(args);

          case 'get_deployment_status':
            await this.ensureBackendClient(args);
            return await this.deploymentHandlers!.handleGetDeploymentStatus({ deploymentId: args.deploymentId as string });

          case 'list_deployments':
            await this.ensureBackendClient(args);
            return await this.deploymentHandlers!.handleListDeployments();

          case 'terminate_deployment':
            await this.ensureBackendClient(args);
            return await this.deploymentHandlers!.handleTerminateDeployment({ deploymentId: args.deploymentId as string });

          case 'stop_deployment':
            await this.ensureBackendClient(args);
            return await this.deploymentHandlers!.handleStopDeployment({ deploymentId: args.deploymentId as string });

          case 'resume_deployment':
            await this.ensureBackendClient(args);
            return await this.deploymentHandlers!.handleResumeDeployment({ deploymentId: args.deploymentId as string });

          case 'install_bridge':
            await this.ensureBackendClient(args);
            return await this.installationHandlers!.handleInstallBridge({ deploymentId: args.deploymentId as string });

          case 'install_block_explorer':
            await this.ensureBackendClient(args);
            return await this.installationHandlers!.handleInstallBlockExplorer({
              deploymentId: args.deploymentId as string,
              databaseUsername: args.databaseUsername as string,
              databasePassword: args.databasePassword as string,
              coinmarketcapKey: args.coinmarketcapKey as string,
              walletConnectId: args.walletConnectId as string
            });

          case 'install_monitoring':
            await this.ensureBackendClient(args);
            return await this.installationHandlers!.handleInstallMonitoring({
              deploymentId: args.deploymentId as string,
              grafanaPassword: args.grafanaPassword as string
            });

          case 'uninstall_bridge':
            await this.ensureBackendClient(args);
            return await this.installationHandlers!.handleUninstallBridge({ deploymentId: args.deploymentId as string });

          case 'uninstall_block_explorer':
            await this.ensureBackendClient(args);
            return await this.installationHandlers!.handleUninstallBlockExplorer({ deploymentId: args.deploymentId as string });

          case 'uninstall_monitoring':
            await this.ensureBackendClient(args);
            return await this.installationHandlers!.handleUninstallMonitoring({ deploymentId: args.deploymentId as string });

          case 'get_accounts_from_seed':
            // This tool doesn't need backend credentials - it only uses L1 RPC
            return await this.utilityHandlers!.handleGetAccountsFromSeed({
              seedPhrase: args.seedPhrase as string,
              l1RpcUrl: args.l1RpcUrl as string
            });

          case 'test_backend_connection':
            await this.ensureBackendClient(args);
            return await this.utilityHandlers!.handleTestConnection();

          case 'get_default_chain_config':
            // This tool doesn't need backend credentials - it returns static configuration data
            return await this.utilityHandlers!.handleGetDefaultChainConfig({ network: args.network as string });

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