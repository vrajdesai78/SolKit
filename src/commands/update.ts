import inquirer from "inquirer";
import { Command } from "commander";
import * as path from "path";
import * as fs from "fs-extra";
import {
  Framework,
  SolanaConfig,
  CommandResult,
  ProjectInfo,
  TemplateContext,
} from "../types";
import { Logger } from "../utils/logger";
import { ProjectDetector } from "../core/project-detector";
import { ConfigManager } from "../core/config-manager";
import { DependencyManager } from "../core/dependency-manager";
import { FrameworkResolver } from "../core/framework-resolver";
import { TemplateEngine } from "../core/template-engine";

const logger = Logger.getInstance();

/**
 * Update command for updating Solana integration in a project
 */
export class UpdateCommand {
  /**
   * Register the update command with the CLI
   */
  public static register(program: Command): void {
    program
      .command("update")
      .description("Update Solana integration in your project")
      .option(
        "-d, --dir <path>",
        "Project directory (defaults to current directory)"
      )
      .option(
        "-n, --network <network>",
        "Update Solana network (mainnet-beta, testnet, devnet, localnet)"
      )
      .option("-t, --transactions", "Add transaction utilities")
      .option("--tokens", "Add token utilities")
      .option("--nfts", "Add NFT utilities")
      .option("-v, --verbose", "Enable verbose logging")
      .option("-y, --yes", "Skip confirmation prompts with default values")
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
          logger.error("Unexpected error during update", error as Error);
          process.exit(1);
        }
      });
  }

  /**
   * Execute the update command with the given options
   */
  public static async execute(options: any): Promise<CommandResult> {
    logger.info("SolKit CLI - Updating Solana integration");

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

      // Check if Solana integration exists
      const configPath = path.join(projectInfo.projectRoot, ".solkitrc");
      if (!(await fs.pathExists(configPath))) {
        return {
          success: false,
          message:
            "Solana integration not found. Please run 'solkit init' first.",
        };
      }

      // Get existing configuration
      let config = await ConfigManager.getConfig(projectInfo.projectRoot);
      const originalConfig = { ...config };

      // Override config with command line options
      if (options.network) {
        config.network = options.network;
      }

      if (options.transactions) {
        config.features.transactions = true;
      }

      if (options.tokens) {
        config.features.tokens = true;
      }

      if (options.nfts) {
        config.features.nfts = true;
      }

      // If not using --yes flag, prompt for configuration options
      if (!options.yes) {
        config = await this.promptForConfig(config);
      }

      // Check if there are any changes
      const hasChanges =
        originalConfig.network !== config.network ||
        JSON.stringify(originalConfig.wallets) !==
          JSON.stringify(config.wallets) ||
        originalConfig.features.transactions !== config.features.transactions ||
        originalConfig.features.tokens !== config.features.tokens ||
        originalConfig.features.nfts !== config.features.nfts;

      if (!hasChanges) {
        logger.info("No changes to apply. Configuration remains the same.");
        return {
          success: true,
          message: "No changes needed for Solana integration",
        };
      }

      // Save updated configuration
      await ConfigManager.saveConfig(projectInfo.projectRoot, config);

      // Update environment variables file
      await ConfigManager.createEnvFile(projectInfo.projectRoot, config);

      // Update dependencies
      await DependencyManager.installDependencies(projectInfo);

      // Get framework module
      const frameworkModule = FrameworkResolver.getFrameworkModule(projectInfo);

      // Update framework-specific integration
      await frameworkModule.init(projectInfo, config);

      // Check and fix React compatibility issues
      await this.checkReactCompatibility(projectInfo);

      // Log success message
      logger.success("Solana integration updated successfully! 🚀");
      logger.info(`Network: ${config.network}`);
      logger.info("Features enabled:");
      logger.info(` - Wallet Connection: ✅`);
      logger.info(
        ` - Transactions: ${config.features.transactions ? "✅" : "❌"}`
      );
      logger.info(
        ` - Token Management: ${config.features.tokens ? "✅" : "❌"}`
      );
      logger.info(` - NFT Support: ${config.features.nfts ? "✅" : "❌"}`);

      return {
        success: true,
        message: "Solana integration updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update Solana integration",
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
        type: "confirm",
        name: "transactionsFeature",
        message: "Include transaction utilities?",
        default: defaultConfig.features.transactions,
      },
      {
        type: "confirm",
        name: "tokensFeature",
        message: "Include token management utilities?",
        default: defaultConfig.features.tokens,
      },
      {
        type: "confirm",
        name: "nftsFeature",
        message: "Include NFT support?",
        default: defaultConfig.features.nfts,
      },
    ]);

    return {
      network: answers.network,
      wallets: answers.wallets,
      features: {
        transactions: answers.transactionsFeature,
        tokens: answers.tokensFeature,
        nfts: answers.nftsFeature,
      },
    };
  }

  /**
   * Check and fix React compatibility issues
   */
  private static async checkReactCompatibility(
    projectInfo: ProjectInfo
  ): Promise<void> {
    try {
      logger.info("Checking React compatibility...");

      // Check if using React
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

      // React 19+ requires special handling for wallet adapters
      if (majorVersion >= 19) {
        logger.warn(
          "Detected React 19+ which may have compatibility issues with Solana wallet adapters"
        );

        const answer = await inquirer.prompt([
          {
            type: "confirm",
            name: "fixReact",
            message: "Would you like to add a compatibility fix for React 19+?",
            default: true,
          },
        ]);

        if (answer.fixReact) {
          await this.addReactCompatibilityFix(projectInfo);
        }
      }
    } catch (error) {
      logger.error("Error checking React compatibility", error as Error);
    }
  }

  /**
   * Add React compatibility fix for React 19+
   */
  private static async addReactCompatibilityFix(
    projectInfo: ProjectInfo
  ): Promise<void> {
    try {
      const walletDir = path.join(projectInfo.srcDir, "solana", "wallet");

      if (!(await fs.pathExists(walletDir))) {
        logger.warn(
          "Wallet directory not found, skipping React compatibility fix"
        );
        return;
      }

      // Check if ClientWalletProvider already exists
      const ext = projectInfo.hasTypeScript ? "tsx" : "jsx";
      const clientProviderPath = path.join(
        walletDir,
        `ClientWalletProvider.${ext}`
      );

      if (!(await fs.pathExists(clientProviderPath))) {
        // Copy template
        const templateDir = path.join(__dirname, "../../templates");
        const templatePath = path.join(
          templateDir,
          "nextjs",
          "app-router",
          "wallet",
          `ClientWalletProvider.{{typescriptExtension}}`
        );

        if (!(await fs.pathExists(templatePath))) {
          logger.warn("ClientWalletProvider template not found");
          return;
        }

        // Create template context
        const config = await ConfigManager.getConfig(projectInfo.projectRoot);
        const context: TemplateContext = {
          projectInfo,
          solanaConfig: config,
          typescriptExtension: ext,
          javascriptExtension: projectInfo.hasTypeScript ? "ts" : "js",
        };

        // Process the template
        const content = await fs.readFile(templatePath, "utf-8");
        const processedContent = TemplateEngine.processTemplate(
          content,
          context
        );

        // Write the file
        await fs.writeFile(clientProviderPath, processedContent);
        logger.success(
          `Created ClientWalletProvider.${ext} for React 19+ compatibility`
        );

        // Update index file to export ClientWalletProvider
        const indexPath = path.join(
          walletDir,
          projectInfo.hasTypeScript ? "index.ts" : "index.js"
        );

        if (await fs.pathExists(indexPath)) {
          const indexContent = await fs.readFile(indexPath, "utf-8");

          if (!indexContent.includes("ClientWalletProvider")) {
            const updatedContent = indexContent.replace(
              /export \* from ['"]\.\/SolanaProvider['"]/,
              "export * from './ClientWalletProvider'"
            );

            await fs.writeFile(indexPath, updatedContent);
            logger.success(
              "Updated wallet index to export ClientWalletProvider"
            );
          }
        }

        // Look for layout file
        await this.updateLayoutForClientComponent(projectInfo);
      } else {
        logger.info("ClientWalletProvider already exists, skipping creation");
      }

      logger.success("React 19+ compatibility fix applied");
    } catch (error) {
      logger.error("Error applying React compatibility fix", error as Error);
    }
  }

  /**
   * Update layout file to use ClientWalletProvider
   */
  private static async updateLayoutForClientComponent(
    projectInfo: ProjectInfo
  ): Promise<void> {
    try {
      // Check if using Next.js App Router
      if (
        projectInfo.framework !== Framework.NEXTJS ||
        !projectInfo.isAppRouter
      ) {
        return;
      }

      const ext = projectInfo.hasTypeScript ? "tsx" : "jsx";

      // Check for app directory
      let appDir = "";
      const possibleAppDirs = [
        path.join(projectInfo.srcDir, "app"),
        path.join(projectInfo.projectRoot, "app"),
      ];

      for (const dir of possibleAppDirs) {
        if (await fs.pathExists(dir)) {
          appDir = dir;
          break;
        }
      }

      if (!appDir) {
        logger.warn("App directory not found, skipping layout update");
        return;
      }

      // Look for layout file
      const layoutFile = path.join(appDir, `layout.${ext}`);

      if (!(await fs.pathExists(layoutFile))) {
        logger.warn("Layout file not found, skipping update");
        return;
      }

      // Read the layout file
      const content = await fs.readFile(layoutFile, "utf-8");

      // Replace SolanaProvider with ClientWalletProvider
      if (
        content.includes("SolanaProvider") &&
        !content.includes("ClientWalletProvider")
      ) {
        let updatedContent = content;

        // Update import
        updatedContent = updatedContent.replace(
          /import\s*{\s*SolanaProvider\s*}\s*from\s*['"](.+)['"]/,
          "import { ClientWalletProvider } from '$1'"
        );

        // Update component usage
        updatedContent = updatedContent.replace(
          /<SolanaProvider([^>]*)>([\s\S]*?)<\/SolanaProvider>/g,
          "<ClientWalletProvider$1>$2</ClientWalletProvider>"
        );

        // Write updated content
        await fs.writeFile(layoutFile, updatedContent);
        logger.success("Updated layout to use ClientWalletProvider");
      }
    } catch (error) {
      logger.error("Error updating layout file", error as Error);
    }
  }
}
