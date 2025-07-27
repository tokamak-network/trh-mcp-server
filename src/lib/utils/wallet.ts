import { ethers } from "ethers";
import { Account } from "../models";




export function validateSeedPhrase(phrase: string): {
    isValid: boolean;
    message?: string;
} {
    const words = phrase
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
  
    if (words.length === 0) {
      return { isValid: false };
    }
  
    if (words.length !== 12) {
      return {
        isValid: false,
        message: `Please enter all 12 words (currently have ${words.length})`,
      };
    }
  
    if (!ethers.Mnemonic.isValidMnemonic(phrase.trim())) {
      return {
        isValid: false,
        message:
          "One or more words are not valid BIP39 words. Please check for typos.",
      };
    }
  
    return { isValid: true };
  }


  export async function generateAccountsFromSeedPhrase(
    seedPhrase: string,
    rpcUrl: string
  ): Promise<Account[]> {
    const validation = validateSeedPhrase(seedPhrase);
    if (!validation.isValid) {
      return [];
    }
  
    const accounts: Account[] = [];
  
    try {
      // Generate accounts using standard HD path for Ethereum
      const baseNode = ethers.HDNodeWallet.fromPhrase(
        seedPhrase.trim(),
        "",
        "m/44'/60'/0'/0"
      );
      for (let i = 0; i < 10; i++) {
        const wallet = baseNode.deriveChild(i);
        const path = `m/44'/60'/0'/0/${i}`;
        accounts.push({
          address: wallet.address,
          balance: 0,
          path: path,
          privateKey: wallet.privateKey,
        });
      }
  
      // Fetch balances if we have accounts
      if (accounts.length > 0) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const accountsWithBalances = await Promise.all(
          accounts.map(async (account) => {
            try {
              const balance = await provider.getBalance(account.address);
              return {
                ...account,
                balance: parseFloat(ethers.formatEther(balance)),
              };
            } catch (error) {
              console.error(
                `Error fetching balance for ${account.address}:`,
                error
              );
              return {
                ...account,
                balance: 0,
              };
            }
          })
        );
        return accountsWithBalances;
      }
    } catch (error) {
      console.error("Error generating accounts:", error);
    }
  
    return accounts;
  }


  