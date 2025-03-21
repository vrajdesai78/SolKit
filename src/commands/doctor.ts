import { Command } from "commander";
import * as fs from "fs-extra";
import * as path from "path";
import { CommandResult, Framework, ProjectInfo } from "../types";
import { Logger } from "../utils/logger";
import { ProjectDetector } from "../core/project-detector";
import { ConfigManager } from "../core/config-manager";

const logger = Logger.getInstance();

/**
 * Doctor command for diagnosing issues with Solana integration
 */
export class DoctorCommand {
  /**
   * Register the doctor command with the CLI
   */
  public static register(program: Command): void {
    program
      .command("doctor")
      .description("Diagnose issues with Solana integration")
      .option(
        "-d, --dir <path>",
        "Project directory (defaults to current directory)"
      )
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
          logger.error("Unexpected error during diagnosis", error as Error);
          process.exit(1);
        }
      });
  }

  /**
   * Execute the doctor command with the given options
   */
  public static async execute(options: any): Promise<CommandResult> {
    logger.info("SolKit CLI - Diagnosing Solana integration");

    try {
      // Detect project
      const projectDir = options.dir || process.cwd();
      let projectInfo: ProjectInfo;

      try {
        projectInfo = await ProjectDetector.detectProject(projectDir);
        logger.success(`Project detected: ${projectInfo.framework}`);
        logger.info(`TypeScript: ${projectInfo.hasTypeScript ? "Yes" : "No"}`);
        logger.info(`Package manager: ${projectInfo.packageManager}`);
      } catch (error) {
        logger.error(
          "Failed to detect project framework and structure",
          error as Error
        );
        return {
          success: false,
          message: "Failed to detect project framework and structure",
          error: error as Error,
        };
      }

      // Check for SolKit configuration
      const configPath = path.join(projectInfo.projectRoot, ".solkitrc");
      if (await fs.pathExists(configPath)) {
        logger.success("SolKit configuration found");

        try {
          const config = await ConfigManager.getConfig(projectInfo.projectRoot);
          logger.info(`Network: ${config.network}`);
          logger.info(`Wallets: ${config.wallets.join(", ")}`);
          logger.info(
            `Transactions feature: ${
              config.features.transactions ? "Enabled" : "Disabled"
            }`
          );
          logger.info(
            `Tokens feature: ${config.features.tokens ? "Enabled" : "Disabled"}`
          );
          logger.info(
            `NFTs feature: ${config.features.nfts ? "Enabled" : "Disabled"}`
          );
        } catch (error) {
          logger.error("Failed to parse SolKit configuration", error as Error);
        }
      } else {
        logger.error("SolKit configuration not found (.solkitrc)");
      }

      // Check for .env files
      const envLocalPath = path.join(projectInfo.projectRoot, ".env.local");
      const envExamplePath = path.join(projectInfo.projectRoot, ".env.example");

      if (await fs.pathExists(envLocalPath)) {
        logger.success(".env.local file found");
      } else {
        logger.error(".env.local file not found");
      }

      if (await fs.pathExists(envExamplePath)) {
        logger.success(".env.example file found");
      } else {
        logger.warn(".env.example file not found");
      }

      // Check for Solana integration files
      const solanaDir = path.join(projectInfo.srcDir, "solana");
      if (await fs.pathExists(solanaDir)) {
        logger.success("Solana integration directory found");

        // Check for wallet adapter files
        const walletDir = path.join(solanaDir, "wallet");
        if (await fs.pathExists(walletDir)) {
          logger.success("Wallet adapter files found");
        } else {
          logger.error("Wallet adapter files not found");
        }

        // Check for transaction files if enabled
        const transactionsDir = path.join(solanaDir, "transactions");
        if (await fs.pathExists(transactionsDir)) {
          logger.success("Transaction utility files found");
        }

        // Check for token files if enabled
        const tokensDir = path.join(solanaDir, "tokens");
        if (await fs.pathExists(tokensDir)) {
          logger.success("Token utility files found");
        }

        // Check for NFT files if enabled
        const nftsDir = path.join(solanaDir, "nfts");
        if (await fs.pathExists(nftsDir)) {
          logger.success("NFT utility files found");
        }
      } else {
        logger.error("Solana integration directory not found");
      }

      // Check for dependencies in package.json
      try {
        const packageJson = await fs.readJson(
          path.join(projectInfo.projectRoot, "package.json")
        );
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const requiredDeps = [
          "@solana/web3.js",
          "@solana/wallet-adapter-base",
          "@solana/wallet-adapter-react",
          "@solana/wallet-adapter-wallets",
        ];

        const missingDeps = requiredDeps.filter((dep) => !dependencies[dep]);

        if (missingDeps.length === 0) {
          logger.success("All required Solana dependencies found");
        } else {
          logger.error(
            `Missing Solana dependencies: ${missingDeps.join(", ")}`
          );
        }
      } catch (error) {
        logger.error(
          "Failed to check package.json for dependencies",
          error as Error
        );
      }

      // Framework-specific checks
      switch (projectInfo.framework) {
        case Framework.NEXTJS:
          await this.checkNextjsIntegration(projectInfo);
          break;

        case Framework.REACT:
          await this.checkReactIntegration(projectInfo);
          break;

        case Framework.VUE:
          await this.checkVueIntegration(projectInfo);
          break;
      }

      // Check for common issues with Solana integration
      await this.checkCommonIssues(projectInfo);

      logger.success("Diagnosis complete");

      return {
        success: true,
        message: "Diagnosis complete",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to diagnose Solana integration",
        error: error as Error,
      };
    }
  }

  /**
   * Check Next.js specific integration
   */
  private static async checkNextjsIntegration(
    projectInfo: ProjectInfo
  ): Promise<void> {
    logger.info("Checking Next.js specific integration...");

    // Check next.config.js for transpilePackages
    const configPaths = [
      path.join(projectInfo.projectRoot, "next.config.js"),
      path.join(projectInfo.projectRoot, "next.config.mjs"),
      path.join(projectInfo.projectRoot, "next.config.ts"),
    ];

    let configFound = false;

    for (const configPath of configPaths) {
      if (await fs.pathExists(configPath)) {
        configFound = true;
        const content = await fs.readFile(configPath, "utf-8");

        if (
          content.includes("transpilePackages") &&
          content.includes("@solana/wallet-adapter")
        ) {
          logger.success("Next.js config has correct transpilePackages setup");
        } else {
          logger.error(
            "Next.js config missing proper transpilePackages setup for Solana packages"
          );
        }

        break;
      }
    }

    if (!configFound) {
      logger.error("Next.js config file not found");
    }

    // Check for SolanaProvider in layout.tsx (App Router) or _app.tsx (Pages Router)
    const ext = projectInfo.hasTypeScript ? "tsx" : "jsx";

    // Determine if we're using App Router by checking for app directory
    const appDir = path.join(projectInfo.srcDir, "app");
    const hasAppDir = await fs.pathExists(
      path.join(projectInfo.projectRoot, appDir)
    );

    if (hasAppDir) {
      // For App Router, check layout.tsx/jsx
      const appDirs = [
        path.join(projectInfo.srcDir, "app"),
        path.join(projectInfo.projectRoot, "app"),
      ];

      let layoutFound = false;

      for (const dir of appDirs) {
        const layoutPath = path.join(dir, `layout.${ext}`);

        if (await fs.pathExists(layoutPath)) {
          layoutFound = true;
          const content = await fs.readFile(layoutPath, "utf-8");

          if (content.includes("SolanaProvider")) {
            logger.success("SolanaProvider found in app layout file");
          } else {
            logger.error("SolanaProvider not found in app layout file");
          }

          break;
        }
      }

      if (!layoutFound) {
        logger.error("App layout file not found");
      }
    } else {
      // For Pages Router, check _app.tsx/jsx
      const pagesDirs = [
        path.join(projectInfo.srcDir, "pages"),
        path.join(projectInfo.projectRoot, "pages"),
      ];

      let appFileFound = false;

      for (const pagesDir of pagesDirs) {
        const appPath = path.join(pagesDir, `_app.${ext}`);

        if (await fs.pathExists(appPath)) {
          appFileFound = true;
          const content = await fs.readFile(appPath, "utf-8");

          if (content.includes("SolanaProvider")) {
            logger.success("SolanaProvider found in _app file");
          } else {
            logger.error("SolanaProvider not found in _app file");
          }

          break;
        }
      }

      if (!appFileFound) {
        logger.error("_app file not found");
      }
    }
  }

  /**
   * Check React specific integration
   */
  private static async checkReactIntegration(
    projectInfo: ProjectInfo
  ): Promise<void> {
    logger.info("Checking React specific integration...");

    // Check for SolanaProvider in entry point
    const possibleEntries = [
      path.join(projectInfo.srcDir, "index.tsx"),
      path.join(projectInfo.srcDir, "index.jsx"),
      path.join(projectInfo.srcDir, "index.ts"),
      path.join(projectInfo.srcDir, "index.js"),
      path.join(projectInfo.srcDir, "main.tsx"),
      path.join(projectInfo.srcDir, "main.jsx"),
      path.join(projectInfo.srcDir, "main.ts"),
      path.join(projectInfo.srcDir, "main.js"),
      path.join(projectInfo.projectRoot, "index.tsx"),
      path.join(projectInfo.projectRoot, "index.jsx"),
      path.join(projectInfo.projectRoot, "index.ts"),
      path.join(projectInfo.projectRoot, "index.js"),
    ];

    let entryFound = false;

    for (const entryPath of possibleEntries) {
      if (await fs.pathExists(entryPath)) {
        entryFound = true;
        const content = await fs.readFile(entryPath, "utf-8");

        if (content.includes("SolanaProvider")) {
          logger.success("SolanaProvider found in entry point");
        } else {
          logger.error("SolanaProvider not found in entry point");
        }

        break;
      }
    }

    if (!entryFound) {
      logger.error("Entry point file not found");
    }
  }

  /**
   * Check Vue specific integration
   */
  private static async checkVueIntegration(
    projectInfo: ProjectInfo
  ): Promise<void> {
    logger.info("Checking Vue specific integration...");

    // Check for SolanaPlugin in main.js/ts
    const ext = projectInfo.hasTypeScript ? "ts" : "js";
    const possibleMainFiles = [
      path.join(projectInfo.srcDir, `main.${ext}`),
      path.join(projectInfo.srcDir, `index.${ext}`),
      path.join(projectInfo.projectRoot, `main.${ext}`),
      path.join(projectInfo.projectRoot, `index.${ext}`),
    ];

    let mainFileFound = false;

    for (const mainPath of possibleMainFiles) {
      if (await fs.pathExists(mainPath)) {
        mainFileFound = true;
        const content = await fs.readFile(mainPath, "utf-8");

        if (
          content.includes("SolanaPlugin") ||
          content.includes("solana/wallet")
        ) {
          logger.success("Solana plugin found in main file");
        } else {
          logger.error("Solana plugin not found in main file");
        }

        break;
      }
    }

    if (!mainFileFound) {
      logger.error("Main file not found");
    }
  }

  /**
   * Check for common issues with Solana integration
   */
  private static async checkCommonIssues(
    projectInfo: ProjectInfo
  ): Promise<void> {
    logger.info("Checking for common issues...");

    try {
      // Check for React compatibility issues
      await this.checkReactCompatibility(projectInfo);

      // Framework-specific checks
      if (projectInfo.framework === Framework.NEXTJS) {
        const configPaths = [
          path.join(projectInfo.projectRoot, "next.config.js"),
          path.join(projectInfo.projectRoot, "next.config.mjs"),
          path.join(projectInfo.projectRoot, "next.config.ts"),
        ];

        for (const configPath of configPaths) {
          if (await fs.pathExists(configPath)) {
            const content = await fs.readFile(configPath, "utf-8");

            if (
              content.includes("transpilePackages") &&
              content.includes("@solana/wallet-adapter")
            ) {
              logger.success(
                "Next.js config has correct transpilePackages setup"
              );
            } else {
              logger.error(
                "Next.js config missing proper transpilePackages setup for Solana packages"
              );
            }
            break;
          }
        }
      }
    } catch (error) {
      logger.error("Failed to check for common issues", error as Error);
    }
  }

  /**
   * Check for React compatibility issues
   */
  private static async checkReactCompatibility(
    projectInfo: ProjectInfo
  ): Promise<void> {
    logger.info("Checking React compatibility...");

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

    // For React 19+, check if client-side components are used
    if (majorVersion >= 19) {
      logger.warn(
        "⚠️ Detected React 19 which may have compatibility issues with wallet adapters"
      );

      // Check if we're using App Router in Next.js
      if (
        projectInfo.framework === Framework.NEXTJS &&
        projectInfo.isAppRouter
      ) {
        const walletDir = path.join(projectInfo.srcDir, "solana", "wallet");

        if (await fs.pathExists(walletDir)) {
          // Check for ClientWalletProvider
          const ext = projectInfo.hasTypeScript ? "tsx" : "jsx";
          const clientProviderPath = path.join(
            walletDir,
            `ClientWalletProvider.${ext}`
          );

          if (!(await fs.pathExists(clientProviderPath))) {
            logger.error(
              "❌ Missing ClientWalletProvider component required for React 19+"
            );
            logger.info("📋 Run 'solkit update' to add compatibility fixes");
          } else {
            // Check if all wallet components have 'use client' directive
            const files = [
              path.join(
                walletDir,
                `index.${projectInfo.hasTypeScript ? "ts" : "js"}`
              ),
              path.join(walletDir, `useWallet.${ext}`),
              path.join(walletDir, `WalletConnectButton.${ext}`),
              clientProviderPath,
            ];

            for (const file of files) {
              if (await fs.pathExists(file)) {
                const content = await fs.readFile(file, "utf-8");

                if (
                  !content.includes("'use client'") &&
                  !content.includes('"use client"')
                ) {
                  logger.error(
                    `❌ Missing 'use client' directive in ${path.basename(
                      file
                    )}`
                  );
                  logger.info("📋 Add 'use client'; at the top of the file");
                }
              }
            }

            // Check if layout is using ClientWalletProvider instead of SolanaProvider
            await this.checkLayoutForClientComponent(projectInfo);
          }
        }
      }
    }
  }

  /**
   * Check if layout is using ClientWalletProvider
   */
  private static async checkLayoutForClientComponent(
    projectInfo: ProjectInfo
  ): Promise<void> {
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
      return;
    }

    // Look for layout file
    const layoutFile = path.join(appDir, `layout.${ext}`);

    if (!(await fs.pathExists(layoutFile))) {
      return;
    }

    // Read the layout file
    const content = await fs.readFile(layoutFile, "utf-8");

    // Check if using SolanaProvider instead of ClientWalletProvider
    if (
      content.includes("SolanaProvider") &&
      !content.includes("ClientWalletProvider")
    ) {
      logger.error(
        "❌ Layout is using SolanaProvider instead of ClientWalletProvider"
      );
      logger.info("📋 Run 'solkit update' to fix React compatibility issues");
    }
  }
}
