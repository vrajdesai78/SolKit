import * as path from "path";
import * as fs from "fs-extra";
import { ProjectInfo, SolanaConfig, TemplateContext } from "../../types";
import { Logger } from "../../utils/logger";
import { TemplateEngine } from "../../core/template-engine";

const logger = Logger.getInstance();

/**
 * React framework integration for Solana
 */
export class ReactFramework {
  /**
   * Initialize Solana integration for React
   */
  public static async init(
    projectInfo: ProjectInfo,
    solanaConfig: SolanaConfig
  ): Promise<void> {
    logger.info("Initializing Solana integration for React...");

    const templateDir = path.join(__dirname, "../../../templates/react");

    // Create template context
    const context: TemplateContext = {
      projectInfo,
      solanaConfig,
      typescriptExtension: projectInfo.hasTypeScript ? "tsx" : "jsx",
      javascriptExtension: projectInfo.hasTypeScript ? "ts" : "js",
    };

    // Create Solana directory in the project
    const solanaDir = path.join(projectInfo.srcDir, "solana");
    await fs.ensureDir(solanaDir);

    try {
      // Copy wallet adapter files
      await this.generateWalletAdapter(projectInfo, solanaConfig, context);

      // Generate transaction utilities if needed
      if (solanaConfig.features.transactions) {
        await this.generateTransactionUtils(projectInfo, context);
      }

      // Generate token utilities if needed
      if (solanaConfig.features.tokens) {
        await this.generateTokenUtils(projectInfo, context);
      }

      // Generate NFT utilities if needed
      if (solanaConfig.features.nfts) {
        await this.generateNftUtils(projectInfo, context);
      }

      // Generate example component
      await this.generateExampleComponent(projectInfo, context);

      logger.success("React Solana integration complete");
    } catch (error) {
      logger.error(
        "Failed to initialize Solana integration for React",
        error as Error
      );
      throw error;
    }
  }

  /**
   * Generate wallet adapter files
   */
  private static async generateWalletAdapter(
    projectInfo: ProjectInfo,
    solanaConfig: SolanaConfig,
    context: TemplateContext
  ): Promise<void> {
    const templateDir = path.join(__dirname, "../../../templates/react/wallet");
    const targetDir = path.join(projectInfo.srcDir, "solana/wallet");

    await fs.ensureDir(targetDir);

    // Generate context file
    const ext = projectInfo.hasTypeScript ? "tsx" : "jsx";

    // Copy and process wallet adapter files
    await TemplateEngine.copyTemplateDirectory(templateDir, targetDir, context);

    logger.debug("Generated wallet adapter files");
  }

  /**
   * Generate transaction utilities
   */
  private static async generateTransactionUtils(
    projectInfo: ProjectInfo,
    context: TemplateContext
  ): Promise<void> {
    const templateDir = path.join(
      __dirname,
      "../../../templates/react/transactions"
    );
    const targetDir = path.join(projectInfo.srcDir, "solana/transactions");

    await fs.ensureDir(targetDir);

    // Copy and process transaction utility files
    await TemplateEngine.copyTemplateDirectory(templateDir, targetDir, context);

    logger.debug("Generated transaction utilities");
  }

  /**
   * Generate token utilities
   */
  private static async generateTokenUtils(
    projectInfo: ProjectInfo,
    context: TemplateContext
  ): Promise<void> {
    const templateDir = path.join(__dirname, "../../../templates/react/tokens");
    const targetDir = path.join(projectInfo.srcDir, "solana/tokens");

    await fs.ensureDir(targetDir);

    // Copy and process token utility files
    await TemplateEngine.copyTemplateDirectory(templateDir, targetDir, context);

    logger.debug("Generated token utilities");
  }

  /**
   * Generate NFT utilities
   */
  private static async generateNftUtils(
    projectInfo: ProjectInfo,
    context: TemplateContext
  ): Promise<void> {
    const templateDir = path.join(__dirname, "../../../templates/react/nfts");
    const targetDir = path.join(projectInfo.srcDir, "solana/nfts");

    await fs.ensureDir(targetDir);

    // Copy and process NFT utility files
    await TemplateEngine.copyTemplateDirectory(templateDir, targetDir, context);

    logger.debug("Generated NFT utilities");
  }

  /**
   * Generate example component
   */
  private static async generateExampleComponent(
    projectInfo: ProjectInfo,
    context: TemplateContext
  ): Promise<void> {
    const templateDir = path.join(
      __dirname,
      "../../../templates/react/examples"
    );
    const targetDir = path.join(projectInfo.srcDir, "components");

    await fs.ensureDir(targetDir);

    // Copy example components
    await TemplateEngine.copyTemplateDirectory(templateDir, targetDir, context);

    logger.debug("Generated example components");
  }

  /**
   * Update React entry point to include Solana providers
   */
  public static async updateEntryPoint(
    projectInfo: ProjectInfo
  ): Promise<void> {
    logger.info("Updating React entry point with Solana providers...");

    // Try to find the main entry point
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

    let entryFile = "";

    for (const file of possibleEntries) {
      if (await fs.pathExists(file)) {
        entryFile = file;
        break;
      }
    }

    if (!entryFile) {
      logger.warn(
        "Could not find React entry point. Please manually update your entry point to include SolanaProvider."
      );
      return;
    }

    try {
      // Read the entry file
      const content = await fs.readFile(entryFile, "utf-8");

      // Check if SolanaProvider already exists
      if (content.includes("SolanaProvider")) {
        logger.debug("SolanaProvider already present in entry point");
        return;
      }

      // Add import statement
      let updatedContent = content;

      // Find import section
      const importSection = updatedContent.match(/^import.*?;(\r?\n|$)/gm);
      if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        const importPos =
          updatedContent.lastIndexOf(lastImport) + lastImport.length;
        updatedContent =
          updatedContent.substring(0, importPos) +
          `\nimport { SolanaProvider } from './solana/wallet';\n` +
          updatedContent.substring(importPos);
      } else {
        // No imports found, add at the beginning
        updatedContent =
          `import { SolanaProvider } from './solana/wallet';\n\n` +
          updatedContent;
      }

      // Find App/root component and wrap with SolanaProvider
      const appRenderMatch =
        updatedContent.match(
          /(ReactDOM\.render\s*\(\s*<)(.*?)(\s*\/?\s*>\s*,\s*document\.getElementById)/
        ) ||
        updatedContent.match(
          /(createRoot.*?\)\.render\s*\(\s*<)(.*?)(\s*\/?\s*>\s*\))/
        );

      if (appRenderMatch) {
        const [fullMatch, prefix, app, suffix] = appRenderMatch;
        const wrappedApp = `${prefix}<SolanaProvider>\n  ${app}\n</SolanaProvider>${suffix}`;
        updatedContent = updatedContent.replace(fullMatch, wrappedApp);
      } else {
        logger.warn(
          "Could not automatically update entry point with SolanaProvider. Please add it manually."
        );
        return;
      }

      // Write updated content
      await fs.writeFile(entryFile, updatedContent);
      logger.success(`Added SolanaProvider to ${entryFile}`);
    } catch (error) {
      logger.error("Failed to update React entry point", error as Error);
    }
  }
}
