import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { EC2Client, DescribeRegionsCommand } from "@aws-sdk/client-ec2";

export async function getSupportedAwsRegions(accessKeyId: string, secretAccessKey: string): Promise<string[]> {
  // Get all AWS regions
  const ec2 = new EC2Client({
    region: "ap-southeast-1", 
    credentials: { accessKeyId, secretAccessKey }
  });
  const regionsResp = await ec2.send(new DescribeRegionsCommand({}));
  const regions = regionsResp.Regions?.map(r => r.RegionName!).filter(Boolean) || [];

  // Test credentials in each region
  const validRegions: string[] = [];
  for (const region of regions) {
    const sts = new STSClient({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });
    try {
      await sts.send(new GetCallerIdentityCommand({}));
      validRegions.push(region);
    } catch (e) {
      // Ignore regions where credentials are not valid
    }
  }
  return validRegions;
}

export async function validateAwsCredentials(accessKeyId: string, secretAccessKey: string, region: string): Promise<{ isValid: boolean; accountId?: string; error?: string }> {
  try {
    const sts = new STSClient({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });
    
    const response = await sts.send(new GetCallerIdentityCommand({}));
    
    return {
      isValid: true,
      accountId: response.Account
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown AWS error'
    };
  }
}

export async function validateRdsPostgresCredentials(
  databaseUsername: string,
  databasePassword: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Validate database username format
    if (!databaseUsername || databaseUsername.trim().length === 0) {
      return {
        isValid: false,
        error: 'Database username cannot be empty'
      };
    }

    if (databaseUsername.length < 1 || databaseUsername.length > 63) {
      return {
        isValid: false,
        error: 'Database username must be between 1 and 63 characters long'
      };
    }

    // PostgreSQL username validation: alphanumeric and underscore only, must start with letter
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!usernameRegex.test(databaseUsername)) {
      return {
        isValid: false,
        error: 'Database username must start with a letter and contain only letters, numbers, and underscores'
      };
    }

    // Validate database password strength
    if (!databasePassword || databasePassword.trim().length === 0) {
      return {
        isValid: false,
        error: 'Database password cannot be empty'
      };
    }

    if (databasePassword.length < 8) {
      return {
        isValid: false,
        error: 'Database password must be at least 8 characters long'
      };
    }

    if (databasePassword.length > 128) {
      return {
        isValid: false,
        error: 'Database password must not exceed 128 characters'
      };
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', '12345678', 'admin', 'root', 'test'];
    if (weakPasswords.includes(databasePassword.toLowerCase())) {
      return {
        isValid: false,
        error: 'Database password is too weak. Please choose a stronger password'
      };
    }

    // Check for basic password complexity (at least one letter and one number)
    const hasLetter = /[a-zA-Z]/.test(databasePassword);
    const hasNumber = /[0-9]/.test(databasePassword);
    
    if (!hasLetter || !hasNumber) {
      return {
        isValid: false,
        error: 'Database password must contain at least one letter and one number'
      };
    }

    // Check for special characters (recommended but not required)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(databasePassword);
    if (!hasSpecialChar) {
      console.error('⚠️  Warning: Database password does not contain special characters. Consider adding special characters for better security.');
    }

    return {
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

export function validateGrafanaPassword(password: string): { isValid: boolean; error?: string } {
  try {
    // Validate password is not empty
    if (!password || password.trim().length === 0) {
      return {
        isValid: false,
        error: 'Grafana password cannot be empty'
      };
    }

    // Validate password length (Grafana typically requires 6+ characters)
    if (password.length < 6) {
      return {
        isValid: false,
        error: 'Grafana password must be at least 6 characters long'
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        error: 'Grafana password must not exceed 128 characters'
      };
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'admin', 'root', 'test', 'grafana'];
    if (weakPasswords.includes(password.toLowerCase())) {
      return {
        isValid: false,
        error: 'Grafana password is too weak. Please choose a stronger password'
      };
    }

    // Check for basic password complexity (at least one letter and one number)
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasLetter || !hasNumber) {
      return {
        isValid: false,
        error: 'Grafana password must contain at least one letter and one number'
      };
    }

    // Check for special characters (recommended but not required)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    if (!hasSpecialChar) {
      console.error('⚠️  Warning: Grafana password does not contain special characters. Consider adding special characters for better security.');
    }

    return {
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}