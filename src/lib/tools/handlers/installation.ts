import { BackendClient } from '../../../services/backend-client.js';
import { validateRdsPostgresCredentials, validateGrafanaPassword } from '../../utils/aws.js';

export class InstallationHandlers {
  constructor(private backendClient: BackendClient) {}

  async handleInstallBridge(args: { deploymentId: string }) {
    const result = await this.backendClient.installBridge(args.deploymentId);

    return {
      content: [
        {
          type: 'text',
          text: `Bridge installation ${result.success ? 'successful' : 'failed'}: ${result.message}`
        }
      ]
    };
  }

  async handleInstallBlockExplorer(args: { 
    deploymentId: string;
    databaseUsername: string;
    databasePassword: string;
    coinmarketcapKey: string;
    walletConnectId: string;
  }) {
    try {
      console.error('🔍 Validating AWS RDS PostgreSQL credentials...');
      
      // Validate AWS RDS PostgreSQL credentials
      const rdsValidation = await validateRdsPostgresCredentials(
        args.databaseUsername,
        args.databasePassword
      );

      if (!rdsValidation.isValid) {
        throw new Error(`AWS RDS PostgreSQL validation failed: ${rdsValidation.error}`);
      }

      console.error('✅ AWS RDS PostgreSQL credentials validated successfully');

      // Prepare the payload for block explorer installation
      const payload = {
        databaseUsername: args.databaseUsername,
        databasePassword: args.databasePassword,
        coinmarketcapKey: args.coinmarketcapKey,
        walletConnectId: args.walletConnectId
      };

      console.error('🚀 Installing block explorer...');
      const result = await this.backendClient.installBlockExplorer(args.deploymentId, payload);

      return {
        content: [
          {
            type: 'text',
            text: `Block explorer installation ${result.success ? 'successful' : 'failed'}: ${result.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Block explorer installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  async handleInstallMonitoring(args: { 
    deploymentId: string;
    grafanaPassword: string;
  }) {
    try {
      console.error('🔍 Validating Grafana password...');
      
      // Validate Grafana password
      const passwordValidation = validateGrafanaPassword(args.grafanaPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Grafana password validation failed: ${passwordValidation.error}`);
      }

      console.error('✅ Grafana password validated successfully');

      // Prepare the payload for monitoring installation
      const payload = {
        grafanaPassword: args.grafanaPassword
      };

      console.error('🚀 Installing monitoring tools...');
      const result = await this.backendClient.installMonitoring(args.deploymentId, payload);

      return {
        content: [
          {
            type: 'text',
            text: `Monitoring tools installation ${result.success ? 'successful' : 'failed'}: ${result.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Monitoring tools installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  async handleUninstallBridge(args: { deploymentId: string }) {
    try {
      console.error('🚀 Uninstalling bridge...');
      const result = await this.backendClient.uninstallBridge(args.deploymentId);

      return {
        content: [
          {
            type: 'text',
            text: `Bridge uninstallation ${result.success ? 'successful' : 'failed'}: ${result.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Bridge uninstallation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  async handleUninstallBlockExplorer(args: { deploymentId: string }) {
    try {
      console.error('🚀 Uninstalling block explorer...');
      const result = await this.backendClient.uninstallBlockExplorer(args.deploymentId);

      return {
        content: [
          {
            type: 'text',
            text: `Block explorer uninstallation ${result.success ? 'successful' : 'failed'}: ${result.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Block explorer uninstallation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  async handleUninstallMonitoring(args: { deploymentId: string }) {
    try {
      console.error('🚀 Uninstalling monitoring tools...');
      const result = await this.backendClient.uninstallMonitoring(args.deploymentId);

      return {
        content: [
          {
            type: 'text',
            text: `Monitoring tools uninstallation ${result.success ? 'successful' : 'failed'}: ${result.message}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Monitoring tools uninstallation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
} 