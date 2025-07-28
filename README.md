# Chain Deployment MCP Server

A Model Context Protocol (MCP) server for interacting with a chain deployment backend service. This server provides tools for deploying, monitoring, and managing blockchain chains with seed phrase account generation and balance checking.

## Features

- **Backend Initialization**: Initialize backend client with credentials
- **Seed Phrase Account Generation**: Generate 10 accounts from seed phrase and check balances
- **Chain Deployment**: Deploy new chains with comprehensive configuration
- **Network-Specific Defaults**: Automatic defaults based on Mainnet/Testnet selection
- **Status Monitoring**: Check deployment status and progress
- **Deployment Management**: List, stop, resume, and terminate deployments
- **Chain Information**: Retrieve detailed information about deployed chains
- **Integration Management**: Install/uninstall bridge, block explorer, and monitoring
- **Connection Testing**: Test backend connectivity
- **Default Configuration**: Get network-specific default chain configurations

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trh-mcp-server
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the project:
```bash
pnpm run build
```

## Configuration

The MCP server requires backend credentials to be provided. You can initialize the backend connection using the `initialize_backend` tool or by providing credentials with each tool call.

### Environment Variables (Optional)
You can set the following environment variables for convenience:

- `BACKEND_URL`: URL of your backend server (default: `http://localhost:8000`)
- `BACKEND_USERNAME`: Username for backend authentication
- `BACKEND_PASSWORD`: Password for backend authentication

Example:
```bash
export BACKEND_URL="https://your-backend-server.com"
export BACKEND_USERNAME="your-username"
export BACKEND_PASSWORD="your-password"
```

## Usage

### Running the MCP Server

**Production:**
```bash
pnpm start
```

**Development:**
```bash
pnpm run dev
```

**Development with watch mode:**
```bash
pnpm run dev:watch
```

### Available Tools

The MCP server provides the following tools:

#### 1. `initialize_backend`
Initialize backend client with credentials. Call this first to set up the connection.

**Parameters:**
- `backendUrl`: Backend server URL
- `username`: Backend username
- `password`: Backend password

#### 2. `get_accounts_from_seed`
Generate 10 accounts from seed phrase and fetch their balances from RPC.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `seedPhrase`: Seed phrase to generate accounts from
- `l1RpcUrl`: L1 RPC URL to check balances

**Example:**
```json
{
  "seedPhrase": "your twelve word seed phrase here",
  "l1RpcUrl": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
}
```

#### 3. `deploy_chain`
Deploy a new chain with the specified configuration.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `seedPhrase`: Seed phrase for account generation (optional if using private keys)
- `awsAccessKey`: AWS access key
- `awsSecretKey`: AWS secret access key
- `awsRegion`: AWS region (restricted list: us-east-1, us-west-2, eu-west-1, ap-southeast-1)
- `l1RpcUrl`: L1 RPC URL
- `l1BeaconUrl`: L1 beacon URL
- `useDefaultChainConfig`: Whether to use default chain configuration (recommended: true)
- `chainConfiguration`: Chain configuration (only used when useDefaultChainConfig is false)
  - `challengePeriod`: Challenge period in seconds
  - `l2BlockTime`: L2 block time in seconds
  - `outputRootFrequency`: Output root frequency
  - `batchSubmissionFrequency`: Batch submission frequency (must be divisible by 12)
- `chainName`: Name of the chain
- `network`: Network type (Mainnet, Testnet)
- `registerCandidate`: Whether to enable register candidate
- `registerCandidateParams`: Registration parameters (required if registerCandidate is true)
  - `amount`: Registration amount
  - `memo`: Registration memo
  - `nameInfo`: Registration name info
- `adminAccountIndex`: Index of admin account (0-9, must have balance > 0)
- `sequencerAccountIndex`: Index of sequencer account (0-9)
- `batcherAccountIndex`: Index of batcher account (0-9, must have balance > 0)
- `proposerAccountIndex`: Index of proposer account (0-9, must have balance > 0)

#### 4. `get_deployment_status`
Get the status of a chain deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to check

#### 5. `list_deployments`
List all chain deployments.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)

#### 6. `terminate_deployment`
Terminate a chain deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to terminate

#### 7. `stop_deployment`
Stop a running deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to stop

#### 8. `resume_deployment`
Resume a stopped deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to resume

#### 9. `install_bridge`
Install bridge for a chain deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to install bridge for

#### 10. `install_block_explorer`
Install block explorer for a chain deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to install block explorer for
- `databaseUsername`: Database username
- `databasePassword`: Database password
- `coinmarketcapKey`: CoinMarketCap API key
- `walletConnectId`: WalletConnect project ID

#### 11. `install_monitoring`
Install monitoring for a chain deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to install monitoring for
- `grafanaPassword`: Grafana admin password

#### 12. `uninstall_bridge`
Uninstall bridge from a chain deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to uninstall bridge from

#### 13. `uninstall_block_explorer`
Uninstall block explorer from a chain deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to uninstall block explorer from

#### 14. `uninstall_monitoring`
Uninstall monitoring from a chain deployment.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)
- `deploymentId`: Deployment ID to uninstall monitoring from

#### 15. `test_backend_connection`
Test connection to the backend server.

**Parameters:**
- `backendUrl`: Backend server URL (optional if already initialized)
- `username`: Backend username (optional if already initialized)
- `password`: Backend password (optional if already initialized)

#### 16. `get_default_chain_config`
Get default chain configuration for a network.

**Parameters:**
- `network`: Network type (Mainnet, Testnet)

## Network-Specific Defaults

### Mainnet Defaults:
- **Challenge Period**: 604800 seconds (7 days)
- **L2 Block Time**: 6 seconds
- **Output Root Frequency**: 64800 blocks (6 * 10800)
- **Batch Submission Frequency**: 18000 blocks (12 * 1500)

### Testnet Defaults:
- **Challenge Period**: 12 seconds
- **L2 Block Time**: 6 seconds
- **Output Root Frequency**: 720 blocks (6 * 120)
- **Batch Submission Frequency**: 1440 blocks (12 * 120)

## Example Usage Workflow

### 1. Initialize Backend Connection
```json
{
  "backendUrl": "https://your-backend-server.com",
  "username": "your-username",
  "password": "your-password"
}
```

### 2. Generate Accounts from Seed Phrase
```json
{
  "seedPhrase": "your twelve word seed phrase here",
  "l1RpcUrl": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
}
```

### 3. Deploy Chain with Selected Accounts
```json
{
  "seedPhrase": "your twelve word seed phrase here",
  "awsAccessKey": "AKIAIOSFODNN7EXAMPLE",
  "awsSecretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "awsRegion": "us-east-1",
  "l1RpcUrl": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  "l1BeaconUrl": "https://beacon.example.com",
  "useDefaultChainConfig": true,
  "chainName": "MyTestChain",
  "network": "Mainnet",
  "registerCandidate": true,
  "registerCandidateParams": {
    "amount": 1000000,
    "memo": "Test chain registration",
    "nameInfo": "MyTestChain"
  },
  "adminAccountIndex": 0,
  "sequencerAccountIndex": 1,
  "batcherAccountIndex": 2,
  "proposerAccountIndex": 3
}
```

## Backend API Endpoints

The MCP server expects the following backend API endpoints:

- `POST /api/v1/stacks/thanos` - Deploy a new chain
- `GET /api/v1/stacks/thanos` - List all deployments
- `GET /api/v1/stacks/thanos/:id` - Get deployment status
- `DELETE /api/v1/stacks/thanos/:id` - Terminate deployment
- `POST /api/v1/stacks/thanos/:id/stop` - Stop deployment
- `POST /api/v1/stacks/thanos/:id/resume` - Resume deployment
- `POST /api/v1/stacks/thanos/:id/integrations/bridge` - Install bridge
- `POST /api/v1/stacks/thanos/:id/integrations/block-explorer` - Install block explorer
- `POST /api/v1/stacks/thanos/:id/integrations/monitoring` - Install monitoring
- `DELETE /api/v1/stacks/thanos/:id/integrations/bridge` - Uninstall bridge
- `DELETE /api/v1/stacks/thanos/:id/integrations/block-explorer` - Uninstall block explorer
- `DELETE /api/v1/stacks/thanos/:id/integrations/monitoring` - Uninstall monitoring
- `GET /api/chain/:id` - Get chain information
- `GET /api/v1/health` - Health check

## Development

### Project Structure

```
src/
├── index.ts                 # Main entry point
├── mcp-server.ts           # MCP server implementation
├── services/
│   └── backend-client.ts   # Backend API client
├── lib/
│   ├── models/
│   │   ├── account.ts      # Account model
│   │   └── index.ts        # Model exports
│   └── utils/
│       ├── aws.ts          # AWS utilities
│       ├── rpc.ts          # RPC utilities
│       ├── wallet.ts       # Wallet utilities
│       └── index.ts        # Utility exports
└── types/
    └── chain-deployment.ts # TypeScript types and schemas
```

### Building

```bash
pnpm run build
```

### Testing

```bash
pnpm test
```

## Dependencies

- **@modelcontextprotocol/sdk**: MCP SDK for server implementation
- **@aws-sdk/client-ec2**: AWS EC2 client for infrastructure management
- **@aws-sdk/client-rds**: AWS RDS client for database management
- **@aws-sdk/client-sts**: AWS STS client for credential validation
- **ethers**: Ethereum library for account generation and balance checking
- **axios**: HTTP client for backend API calls
- **zod**: Schema validation
- **bip32**: BIP32 hierarchical deterministic wallet
- **bip39**: BIP39 mnemonic generation

## License

MIT 