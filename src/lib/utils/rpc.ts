import { ethers } from "ethers";


type BeaconGenesisResponse = {
    data: {
        genesis_time: string;
        genesis_validators_root: string;
        genesis_fork_version: string;
    };
};

export async function verifyL1RpcUrl(rpcUrl: string): Promise<{ isValid: boolean; chainId?: number; error?: string }> {
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        return { isValid: true, chainId: Number(network.chainId) };
    } catch (error) {
        return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}


export async function verifyL1BeaconUrl(beaconUrl: string): Promise<{ isValid: boolean; error?: string }> {
    try {
        new URL(beaconUrl);
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }

    const url = beaconUrl.replace(/\/+$/, "") + "/eth/v1/beacon/genesis";
    const resp = await fetch(url);

    if (!resp.ok) {
        return {
            isValid: false,
            error: `Error: Unexpected HTTP status ${resp.status} from beacon URL`
        };
    }

    const beaconResponse: BeaconGenesisResponse = await resp.json();

    if (
        !beaconResponse.data?.genesis_time ||
        !beaconResponse.data?.genesis_validators_root ||
        !beaconResponse.data?.genesis_fork_version
    ) {
        return {
            isValid: false,
            error: "Error: Missing required fields in beacon response."
        };
    }

    return {
        isValid: true,
        error: undefined
    };
}