import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ChainDeploymentResponse,
  ChainDeploymentStatus,
  BackendDeploymentRequestSchema,
  AccountInfo
} from '../types/chain-deployment.js';

export class BackendClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;

    // Initialize client without auth header initially
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
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
   * Login to get access token
   */
  private async login(): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/auth/login`, {
        email: this.username,
        password: this.password
      });

      return response.data.token;
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize the client with authentication
   */
  async initialize(): Promise<void> {
    try {
      const token = await this.login();

      // Update the client with the auth token
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      throw new Error(`Failed to initialize client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deploy a new chain
   */
  async deployChain(request: any): Promise<ChainDeploymentResponse> {
    try {
      // Validate the request using the backend schema
      const validatedRequest = BackendDeploymentRequestSchema.parse(request);

      const response: AxiosResponse<ChainDeploymentResponse> = await this.client.post(
        '/api/v1/stacks/thanos',
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
        `/api/v1/stacks/thanos/${deploymentId}`
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
        '/api/v1/stacks/thanos'
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
      const response: AxiosResponse<{ success: boolean; message: string }> = await this.client.delete(
        `/api/v1/stacks/thanos/${deploymentId}`
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
      await this.client.get('/api/v1/health');
      return true;
    } catch (error) {
      console.error('Failed to test connection:', error);
      return false;
    }
  }
} 