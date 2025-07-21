# Chain Deployment MCP Server

A Model Context Protocol (MCP) server for interacting with a chain deployment backend service. This server provides tools for deploying, monitoring, and managing blockchain chains.

## Features

- **Chain Deployment**: Deploy new chains with comprehensive configuration
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
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

Set the following environment variables:

- `BACKEND_URL`: URL of your backend server (default: `http://localhost:3000`)
- `BACKEND_API_KEY`: API key for backend authentication (optional)

Example:
```bash
export BACKEND_URL="https://your-backend-server.com"
export BACKEND_API_KEY="your-api-key"
```

## Usage

### Running the MCP Server

```bash
npm start
```

Or for development:
```bash
npm run dev
```

### Available Tools

The MCP server provides the following tools:

#### 1. `deploy_chain`
Deploy a new chain with the specified configuration.

**Parameters:**
- `adminAccount`: Admin account address
- `awsAccessKey`: AWS access key
- `awsRegion`: AWS region
- `awsSecretAccessKey`: AWS secret access key
- `batchSubmissionFrequency`: Batch submission frequency
- `batcherAccount`: Batcher account address
- `chainName`: Name of the chain
- `challengePeriod`: Challenge period in blocks
- `deploymentPath`: Deployment path
- `l1BeaconUrl`: L1 beacon URL
- `l1RpcUrl`: L1 RPC URL
- `l2BlockTime`: L2 block time in seconds
- `network`: Network type (Mainnet, Testnet, Devnet)
- `outputRootFrequency`: Output root frequency
- `proposerAccount`: Proposer account address
- `registerCandidate`: Whether to register as candidate
- `registerCandidateParams`: Registration parameters
  - `amount`: Registration amount
  - `memo`: Registration memo
  - `nameInfo`: Registration name info
- `sequencerAccount`: Sequencer account address

#### 2. `get_deployment_status`
Get the status of a chain deployment.

**Parameters:**
- `deploymentId`: Deployment ID to check

#### 3. `list_deployments`
List all chain deployments.

#### 4. `cancel_deployment`
Cancel a chain deployment.

**Parameters:**
- `deploymentId`: Deployment ID to cancel

#### 5. `get_chain_info`
Get information about a deployed chain.

**Parameters:**
- `chainId`: Chain ID to get info for

#### 6. `test_backend_connection`
Test connection to the backend server.

## Example Chain Deployment Request

```json
{
  "adminAccount": "0x1234567890123456789012345678901234567890",
  "awsAccessKey": "AKIAIOSFODNN7EXAMPLE",
  "awsRegion": "us-east-1",
  "awsSecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "batchSubmissionFrequency": 10,
  "batcherAccount": "0x1234567890123456789012345678901234567890",
  "chainName": "MyTestChain",
  "challengePeriod": 7,
  "deploymentPath": "/path/to/deployment",
  "l1BeaconUrl": "https://beacon.example.com",
  "l1RpcUrl": "https://rpc.example.com",
  "l2BlockTime": 2,
  "network": "Testnet",
  "outputRootFrequency": 1000,
  "proposerAccount": "0x1234567890123456789012345678901234567890",
  "registerCandidate": true,
  "registerCandidateParams": {
    "amount": 1000000,
    "memo": "Test chain registration",
    "nameInfo": "MyTestChain"
  },
  "sequencerAccount": "0x1234567890123456789012345678901234567890"
}
```

## Backend API Endpoints

The MCP server expects the following backend API endpoints:

- `POST /api/chain/deploy` - Deploy a new chain
- `GET /api/chain/deployment/{id}/status` - Get deployment status
- `GET /api/chain/deployments` - List all deployments
- `POST /api/chain/deployment/{id}/cancel` - Cancel deployment
- `GET /api/chain/{id}` - Get chain information
- `GET /api/health` - Health check

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
npm run build
```

### Testing

```bash
npm test
```

## License

MIT 