import * as fs from "fs-extra";
import * as path from "path";
import { SolanaConfig } from "../types";
import { Logger } from "../utils/logger";

const logger = Logger.getInstance();

/**
 * Default Solana configuration
 */
const DEFAULT_CONFIG: SolanaConfig = {
  network: "devnet",
  wallets: ["phantom", "solflare", "backpack", "brave"],
  features: {
    transactions: true,
    tokens: false,
    nfts: false,
  },
  useAppKit: true,
  projectId: "b56e18d47c72ab683b10814fe9495694",
};

/**
 * Configuration manager for Solana integration
 */
export class ConfigManager {
  /**
   * Get the Solana configuration, creating a default one if it doesn't exist
   */
  public static async getConfig(projectRoot: string): Promise<SolanaConfig> {
    const configPath = path.join(projectRoot, ".solkitrc");

    // Check if config file exists
    if (await fs.pathExists(configPath)) {
      try {
        const configData = await fs.readFile(configPath, "utf-8");
        const config = JSON.parse(configData);
        logger.debug("Loaded existing SolKit configuration");
        return config;
      } catch (error) {
        logger.warn(
          "Failed to parse existing configuration file, using defaults"
        );
        return DEFAULT_CONFIG;
      }
    }

    // Return default config if no config file exists
    return DEFAULT_CONFIG;
  }

  /**
   * Save the Solana configuration to the project
   */
  public static async saveConfig(
    projectRoot: string,
    config: SolanaConfig
  ): Promise<void> {
    const configPath = path.join(projectRoot, ".solkitrc");

    try {
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      logger.success("Configuration saved successfully");
    } catch (error) {
      logger.error("Failed to save configuration", error as Error);
      throw new Error("Failed to save configuration");
    }
  }

  /**
   * Create environment variables file for Solana endpoints
   */
  public static async createEnvFile(
    projectRoot: string,
    config: SolanaConfig
  ): Promise<void> {
    const envPath = path.join(projectRoot, ".env.local");
    const envExamplePath = path.join(projectRoot, ".env.example");

    // Generate environment variables content based on network
    const envContent = this.generateEnvContent(config);

    // Write .env.local if it doesn't exist
    if (!(await fs.pathExists(envPath))) {
      try {
        await fs.writeFile(envPath, envContent);
        logger.success("Created .env.local with Solana configuration");
      } catch (error) {
        logger.error("Failed to create .env.local", error as Error);
      }
    } else {
      logger.debug(
        ".env.local already exists, checking if AppKit env vars need to be added"
      );

      // If using AppKit, ensure the project ID is set in the existing .env.local file
      if (config.useAppKit) {
        try {
          const currentEnv = await fs.readFile(envPath, "utf-8");

          // Check if project ID is already set
          if (!currentEnv.includes("NEXT_PUBLIC_PROJECT_ID=")) {
            const updatedEnv =
              currentEnv +
              `\n# Reown AppKit Configuration\nNEXT_PUBLIC_PROJECT_ID=${
                config.projectId || ""
              }\n`;
            await fs.writeFile(envPath, updatedEnv);
            logger.success("Updated .env.local with AppKit project ID");
          }
        } catch (error) {
          logger.error(
            "Failed to update .env.local with AppKit configuration",
            error as Error
          );
        }
      }
    }

    // Always write .env.example
    try {
      await fs.writeFile(envExamplePath, envContent);
      logger.success("Created .env.example with Solana configuration");
    } catch (error) {
      logger.error("Failed to create .env.example", error as Error);
    }
  }

  /**
   * Generate environment variables content based on network
   */
  private static generateEnvContent(config: SolanaConfig): string {
    const networkUrls = {
      "mainnet-beta": "https://api.mainnet-beta.solana.com",
      testnet: "https://api.testnet.solana.com",
      devnet: "https://api.devnet.solana.com",
      localnet: "http://127.0.0.1:8899",
    };

    let content = `# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=${config.network}
NEXT_PUBLIC_SOLANA_RPC_URL=${networkUrls[config.network]}

# For server-side operations (optional)
SOLANA_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# Note: Never commit private keys to source control
# Use this file as a template and create a .env.local file with your actual keys
`;

    // Add AppKit project ID if using AppKit
    if (config.useAppKit) {
      content += `
# Reown AppKit Configuration
NEXT_PUBLIC_PROJECT_ID=${config.projectId || ""}
`;
    }

    return content;
  }
}
