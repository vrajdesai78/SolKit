import { Framework, Dependency, ProjectInfo } from "../types";
import { Logger } from "../utils/logger";
import { PackageManagerUtils } from "../utils/package-manager";

const logger = Logger.getInstance();

/**
 * Dependency manager for Solana integration
 */
export class DependencyManager {
  /**
   * Get required dependencies for Solana integration based on framework
   */
  public static getDependencies(projectInfo: ProjectInfo): Dependency[] {
    const dependencies: Dependency[] = [];

    // Common Solana dependencies
    dependencies.push(
      { name: "@solana/web3.js", version: "^1.87.3" },
      { name: "@solana/wallet-adapter-base", version: "^0.9.23" },
      { name: "@solana/wallet-adapter-react", version: "^0.15.35" },
      { name: "@solana/wallet-adapter-wallets", version: "^0.19.23" }
    );

    // Framework-specific dependencies
    switch (projectInfo.framework) {
      case Framework.REACT:
        dependencies.push({
          name: "@solana/wallet-adapter-react-ui",
          version: "^0.9.35",
        });
        break;

      case Framework.NEXTJS:
        dependencies.push(
          { name: "@solana/wallet-adapter-react-ui", version: "^0.9.35" },
          { name: "next-transpile-modules", version: "^10.0.1", isDev: true }
        );
        break;

      case Framework.VUE:
        dependencies.push(
          { name: "@solana/wallet-adapter-vue", version: "^0.3.4" },
          { name: "@solana/wallet-adapter-vue-ui", version: "^0.3.4" }
        );
        break;

      default:
        logger.warn("Unknown framework, adding only core Solana dependencies");
    }

    // Add additional dependencies for tokens feature if needed
    if (projectInfo.packageJson.solanaConfig?.features?.tokens) {
      dependencies.push({ name: "@solana/spl-token", version: "^0.3.8" });
    }

    // Add additional dependencies for NFTs feature if needed
    if (projectInfo.packageJson.solanaConfig?.features?.nfts) {
      dependencies.push({
        name: "@metaplex-foundation/js",
        version: "^0.19.4",
      });
    }

    return dependencies;
  }

  /**
   * Install Solana dependencies
   */
  public static async installDependencies(
    projectInfo: ProjectInfo
  ): Promise<void> {
    logger.info("Installing Solana dependencies...");

    const dependencies = this.getDependencies(projectInfo);

    try {
      await PackageManagerUtils.installDependencies(
        dependencies,
        projectInfo.projectRoot,
        projectInfo.packageManager
      );

      logger.success("Solana dependencies installed successfully");
    } catch (error) {
      logger.error("Failed to install Solana dependencies", error as Error);
      throw new Error("Failed to install dependencies");
    }
  }
}
