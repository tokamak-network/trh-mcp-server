import { ChainDeploymentMCPServer } from './lib/server/chain-deployment.js';

// Start the server
const server = new ChainDeploymentMCPServer();
server.run().catch(console.error); 