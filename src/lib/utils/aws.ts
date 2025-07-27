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