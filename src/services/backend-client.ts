import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ChainDeploymentRequest, 
  ChainDeploymentResponse, 
  ChainDeploymentStatus,
  ChainDeploymentRequestSchema 
} from '../types/chain-deployment.js';

export class BackendClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Backend API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Deploy a new chain
   */
  async deployChain(request: ChainDeploymentRequest): Promise<ChainDeploymentResponse> {
    try {
      // Validate the request
      const validatedRequest = ChainDeploymentRequestSchema.parse(request);
      
      const response: AxiosResponse<ChainDeploymentResponse> = await this.client.post(
        '/api/chain/deploy',
        validatedRequest
      );

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to deploy chain: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<ChainDeploymentStatus> {
    try {
      const response: AxiosResponse<ChainDeploymentStatus> = await this.client.get(
        `/api/chain/deployment/${deploymentId}/status`
      );

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get deployment status: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List all deployments
   */
  async listDeployments(): Promise<ChainDeploymentStatus[]> {
    try {
      const response: AxiosResponse<ChainDeploymentStatus[]> = await this.client.get(
        '/api/chain/deployments'
      );

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list deployments: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.post(
        `/api/chain/deployment/${deploymentId}/cancel`
      );

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to cancel deployment: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get chain information
   */
  async getChainInfo(chainId: string): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.client.get(
        `/api/chain/${chainId}`
      );

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get chain info: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test connection to backend
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/api/health');
      return true;
    } catch (error) {
      return false;
    }
  }
} 