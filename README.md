# Chain Deployment MCP Server

A Model Context Protocol (MCP) server for interacting with a chain deployment backend service. This server provides tools for deploying, monitoring, and managing blockchain chains with seed phrase account generation and balance checking.

## Features

- **Seed Phrase Account Generation**: Generate 10 accounts from seed phrase and check balances
- **Chain Deployment**: Deploy new chains with comprehensive configuration
- **Network-Specific Defaults**: Automatic defaults based on Mainnet/Testnet selection
- **Status Monitoring**: Check deployment status and progress
- **Deployment Management**: List, cancel, and manage deployments
- **Chain Information**: Retrieve detailed information about deployed chains
- **Connection Testing**: Test backend connectivity

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

The MCP server supports two ways to configure backend credentials:

### Option 1: Environment Variables (Recommended for automation)
Set the following environment variables:

- `BACKEND_URL`: URL of your backend server (default: `http://localhost:8000`)
- `BACKEND_USERNAME`: Username for backend authentication
- `BACKEND_PASSWORD`: Password for backend authentication

Example:
```bash
export BACKEND_URL="https://your-backend-server.com"
export BACKEND_USERNAME="your-username"
export BACKEND_PASSWORD="your-password"
```

### Option 2: Interactive Prompts (Recommended for development)
If environment variables are not provided, the server will prompt for credentials interactively:

```
🔐 Backend Authentication Setup
===============================
Backend URL (default: http://localhost:8000): 
Username: 
Password: 
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

### Available Tools

The MCP server provides the following tools:

#### 1. `get_accounts_from_seed`
Generate 10 accounts from seed phrase and fetch their balances from RPC.

**Parameters:**
- `seedPhrase`: Seed phrase to generate accounts from
- `l1RpcUrl`: L1 RPC URL to check balances

**Example:**
```json
{
  "seedPhrase": "your twelve word seed phrase here",
  "l1RpcUrl": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
}
```

#### 2. `deploy_chain`
Deploy a new chain with the specified configuration.

**Parameters:**
- `seedPhrase`: Seed phrase for account generation
- `awsAccessKey`: AWS access key
- `awsSecretKey`: AWS secret access key
- `awsRegion`: AWS region (us-east-1, us-west-2, eu-west-1, ap-southeast-1)
- `l1RpcUrl`: L1 RPC URL
- `l1BeaconUrl`: L1 beacon URL
- `chainConfiguration`: Chain configuration (optional, uses network defaults)
  - `challengePeriod`: Challenge period in blocks
  - `l2BlockTime`: L2 block time in seconds
  - `outputRootFrequency`: Output root frequency
  - `batchSubmissionFrequency`: Batch submission frequency
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

#### 3. `get_deployment_status`
Get the status of a chain deployment.

**Parameters:**
- `deploymentId`: Deployment ID to check

#### 4. `list_deployments`
List all chain deployments.

#### 5. `terminate_deployment`
Terminate a chain deployment.

**Parameters:**
- `deploymentId`: Deployment ID to terminate

#### 6. `install_bridge`
Install bridge for a chain deployment.

**Parameters:**
- `deploymentId`: Deployment ID to install bridge for

#### 7. `get_chain_info`
Get information about a deployed chain.

**Parameters:**
- `chainId`: Chain ID to get info for

#### 7. `test_backend_connection`
Test connection to the backend server.

## Network-Specific Defaults

### Mainnet Defaults:
- **Challenge Period**: 50400 blocks (7 days)
- **L2 Block Time**: 6 seconds
- **Output Root Frequency**: 64800 blocks (6 * 10800)
- **Batch Submission Frequency**: 18000 blocks (12 * 1500)

### Testnet Defaults:
- **Challenge Period**: 12 blocks
- **L2 Block Time**: 6 seconds
- **Output Root Frequency**: 1440 blocks
- **Batch Submission Frequency**: 1440 blocks

## Example Usage Workflow

### 1. Generate Accounts from Seed Phrase
```json
{
  "seedPhrase": "your twelve word seed phrase here",
  "l1RpcUrl": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
}
```

### 2. Deploy Chain with Selected Accounts
```json
{
  "seedPhrase": "your twelve word seed phrase here",
  "awsAccessKey": "AKIAIOSFODNN7EXAMPLE",
  "awsSecretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "awsRegion": "us-east-1",
  "l1RpcUrl": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  "l1BeaconUrl": "https://beacon.example.com",
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
- `POST /api/v1/stacks/thanos/:id/integrations/bridge` - Install bridge
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
- **ethers**: Ethereum library for account generation and balance checking
- **axios**: HTTP client for backend API calls
- **zod**: Schema validation

## License

MIT 