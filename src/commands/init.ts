import inquirer from "inquirer";
import { Command } from "commander";
import { Framework, SolanaConfig, CommandResult, ProjectInfo } from "../types";
import { Logger } from "../utils/logger";
import { ProjectDetector } from "../core/project-detector";
import { ConfigManager } from "../core/config-manager";
import { DependencyManager } from "../core/dependency-manager";
import { FrameworkResolver } from "../core/framework-resolver";
import * as path from "path";
import * as fs from "fs-extra";

const logger = Logger.getInstance();

/**
 * Init command for initializing Solana integration in a project
 */
export class InitCommand {
  /**
   * Register the init command with the CLI
   */
  public static register(program: Command): void {
    program
      .command("init")
      .description("Initialize Solana integration in your project")
      .option(
        "-d, --dir <path>",
        "Project directory (defaults to current directory)"
      )
      .option(
        "-n, --network <network>",
        "Solana network (mainnet-beta, testnet, devnet, localnet)"
      )
      .option("-t, --transactions", "Include transaction utilities")
      .option("--tokens", "Include token utilities")
      .option("--nfts", "Include NFT utilities")
      .option(
        "-f, --framework <framework>",
        "Specify framework if detection fails"
      )
      .option("--project-id <id>", "Reown AppKit project ID")
      .option("-y, --yes", "Skip confirmation prompts with default values")
      .option("-v, --verbose", "Enable verbose logging")
      .action(async (options) => {
        // Set verbose mode if requested
        logger.setVerbose(options.verbose || false);

        try {
          const result = await this.execute(options);

          if (!result.success) {
            logger.error(result.message, result.error);
            process.exit(1);
          }
        } catch (error) {
          logger.error(
            "Unexpected error during initialization",
            error as Error
          );
          process.exit(1);
        }
      });
  }

  /**
   * Execute the init command with the given options
   */
  public static async execute(options: any): Promise<CommandResult> {
    logger.info("SolKit CLI - Initializing Solana integration");

    try {
      // Detect project
      const projectDir = options.dir || process.cwd();
      let projectInfo: ProjectInfo;

      try {
        projectInfo = await ProjectDetector.detectProject(projectDir);
      } catch (error) {
        return {
          success: false,
          message: "Failed to detect project framework and structure",
          error: error as Error,
        };
      }

      // Check if framework was manually specified and override detection
      if (options.framework) {
        const specifiedFramework = options.framework.toLowerCase();

        if (FrameworkResolver.isFrameworkSupported(specifiedFramework)) {
          logger.info(
            `Using manually specified framework: ${specifiedFramework}`
          );
          projectInfo.framework = specifiedFramework as Framework;
        } else {
          return {
            success: false,
            message: `Unsupported framework: ${specifiedFramework}`,
          };
        }
      }

      // Check if framework is supported
      if (projectInfo.framework === Framework.UNKNOWN) {
        // Ask user to specify framework if not detected
        const frameworkAnswers = await inquirer.prompt([
          {
            type: "list",
            name: "framework",
            message:
              "Could not detect framework automatically. Please select your framework:",
            choices: FrameworkResolver.getSupportedFrameworks(),
          },
        ]);

        projectInfo.framework = frameworkAnswers.framework as Framework;
      }

      // Get configuration
      let config = await ConfigManager.getConfig(projectInfo.projectRoot);

      // Set default configuration
      config.useAppKit = true; // Always use AppKit
      config.projectId = config.projectId || "b56e18d47c72ab683b10814fe9495694";

      // Override config with command line options
      if (options.network) {
        config.network = options.network;
      }

      // Features not relevant with AppKit
      config.features.transactions = false;
      config.features.tokens = false;
      config.features.nfts = false;

      // Set project ID if provided
      if (options.projectId !== undefined) {
        config.projectId = options.projectId;
      }

      // If not using --yes flag, prompt for configuration options
      if (!options.yes) {
        config = await this.promptForConfig(config);
      }

      // Save configuration
      await ConfigManager.saveConfig(projectInfo.projectRoot, config);

      // Create environment variables file
      await ConfigManager.createEnvFile(projectInfo.projectRoot, config);

      // Install dependencies
      await DependencyManager.installDependencies(projectInfo);

      // Get framework module
      const frameworkModule = FrameworkResolver.getFrameworkModule(projectInfo);

      // Initialize framework-specific integration
      await frameworkModule.init(projectInfo, config);

      // Check for React compatibility issues
      await this.checkReactCompatibility(projectInfo);

      // Log success message
      logger.success("Solana integration initialized successfully! 🚀");
      logger.info(`Network: ${config.network}`);
      logger.info("Features enabled:");
      if (config.useAppKit) {
        logger.info(` - Reown AppKit: ✅`);
        logger.info(` - Project ID: ${config.projectId}`);
      } else {
        logger.info(` - Wallet Connection: ✅`);
        logger.info(
          ` - Transactions: ${config.features.transactions ? "✅" : "❌"}`
        );
        logger.info(
          ` - Token Management: ${config.features.tokens ? "✅" : "❌"}`
        );
        logger.info(` - NFT Support: ${config.features.nfts ? "✅" : "❌"}`);
      }

      return {
        success: true,
        message: "Solana integration initialized successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to initialize Solana integration",
        error: error as Error,
      };
    }
  }

  /**
   * Prompt user for configuration options
   */
  private static async promptForConfig(
    defaultConfig: SolanaConfig
  ): Promise<SolanaConfig> {
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "network",
        message: "Select Solana network:",
        default: defaultConfig.network,
        choices: [
          { name: "Mainnet Beta", value: "mainnet-beta" },
          { name: "Testnet", value: "testnet" },
          { name: "Devnet", value: "devnet" },
          { name: "Localnet", value: "localnet" },
        ],
      },
      {
        type: "checkbox",
        name: "wallets",
        message: "Select wallets to support:",
        default: defaultConfig.wallets,
        choices: [
          { name: "Phantom", value: "phantom", checked: true },
          { name: "Solflare", value: "solflare", checked: true },
          { name: "Backpack", value: "backpack", checked: true },
          { name: "Brave", value: "brave", checked: true },
          { name: "Slope", value: "slope" },
          { name: "Coin98", value: "coin98" },
          { name: "Ledger", value: "ledger" },
          { name: "Keystone", value: "keystone" },
        ],
      },
      {
        type: "input",
        name: "projectId",
        message: "Enter Reown AppKit project ID:",
        default: defaultConfig.projectId || "b56e18d47c72ab683b10814fe9495694",
      },
      {
        type: "confirm",
        name: "transactionsFeature",
        message: "Include transaction utilities?",
        default: defaultConfig.features.transactions,
        when: (answers) => !answers.useAppKit, // Only ask if not using AppKit
      },
      {
        type: "confirm",
        name: "tokensFeature",
        message: "Include token management utilities?",
        default: defaultConfig.features.tokens,
        when: (answers) => !answers.useAppKit, // Only ask if not using AppKit
      },
      {
        type: "confirm",
        name: "nftsFeature",
        message: "Include NFT support?",
        default: defaultConfig.features.nfts,
        when: (answers) => !answers.useAppKit, // Only ask if not using AppKit
      },
    ]);

    return {
      network: answers.network,
      wallets: answers.wallets,
      useAppKit: true, // Always use AppKit
      projectId: answers.projectId,
      features: {
        transactions: false, // Not needed with AppKit
        tokens: false, // Not needed with AppKit
        nfts: false, // Not needed with AppKit
      },
    };
  }

  /**
   * Check for React compatibility issues
   */
  private static async checkReactCompatibility(
    projectInfo: ProjectInfo
  ): Promise<void> {
    // Only check for Next.js and React frameworks
    if (
      projectInfo.framework !== Framework.NEXTJS &&
      projectInfo.framework !== Framework.REACT
    ) {
      return;
    }

    // Check if react package exists
    if (!projectInfo.packageJson.dependencies?.react) {
      return;
    }

    // Extract React version
    const reactVersion = projectInfo.packageJson.dependencies.react;
    const versionMatch = reactVersion.match(/[\d\.]+/);

    if (!versionMatch) {
      return;
    }

    const version = versionMatch[0];
    const majorVersion = parseInt(version.split(".")[0], 10);

    // For React 19+, check if we need compatibility fixes
    if (majorVersion >= 19) {
      logger.warn(
        "⚠️ Detected React 19 which may have compatibility issues with wallet adapters. Use 'solkit update' command to fix."
      );
    }
  }
}
