import * as path from "path";
import * as fs from "fs-extra";
import { ProjectInfo, SolanaConfig, TemplateContext } from "../../types";
import { Logger } from "../../utils/logger";
import { TemplateEngine } from "../../core/template-engine";

const logger = Logger.getInstance();

/**
 * Next.js framework integration for Solana
 */
export class NextjsFramework {
  /**
   * Initialize Solana integration for Next.js
   */
  public static async init(
    projectInfo: ProjectInfo,
    solanaConfig: SolanaConfig
  ): Promise<void> {
    logger.info("Initializing Solana integration for Next.js...");

    // Create template context
    const context: TemplateContext = {
      projectInfo,
      solanaConfig,
      typescriptExtension: projectInfo.hasTypeScript ? "tsx" : "jsx",
      javascriptExtension: projectInfo.hasTypeScript ? "ts" : "js",
      isAppRouter: projectInfo.isAppRouter,
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

      // Update Next.js config
      await this.updateNextConfig(projectInfo);

      // Update app entry point
      await this.updateAppEntryPoint(projectInfo, context);

      logger.success("Next.js Solana integration complete");
    } catch (error) {
      logger.error(
        "Failed to initialize Solana integration for Next.js",
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
    // Use different templates for App Router vs Pages Router
    const templateDir = projectInfo.isAppRouter
      ? path.join(__dirname, "../../../templates/nextjs/app-router/wallet")
      : path.join(__dirname, "../../../templates/nextjs/pages-router/wallet");

    const targetDir = path.join(projectInfo.srcDir, "solana/wallet");

    await fs.ensureDir(targetDir);

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
    // Use different templates for App Router vs Pages Router
    const templateDir = projectInfo.isAppRouter
      ? path.join(
          __dirname,
          "../../../templates/nextjs/app-router/transactions"
        )
      : path.join(
          __dirname,
          "../../../templates/nextjs/pages-router/transactions"
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
    // Use different templates for App Router vs Pages Router
    const templateDir = projectInfo.isAppRouter
      ? path.join(__dirname, "../../../templates/nextjs/app-router/tokens")
      : path.join(__dirname, "../../../templates/nextjs/pages-router/tokens");
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
    // Use different templates for App Router vs Pages Router
    const templateDir = projectInfo.isAppRouter
      ? path.join(__dirname, "../../../templates/nextjs/app-router/nfts")
      : path.join(__dirname, "../../../templates/nextjs/pages-router/nfts");
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
    // Use different templates for App Router vs Pages Router
    const templateDir = projectInfo.isAppRouter
      ? path.join(__dirname, "../../../templates/nextjs/app-router/examples")
      : path.join(__dirname, "../../../templates/nextjs/pages-router/examples");

    const targetDir = path.join(projectInfo.srcDir, "components");

    await fs.ensureDir(targetDir);

    // Copy example components
    await TemplateEngine.copyTemplateDirectory(templateDir, targetDir, context);

    logger.debug("Generated example components");
  }

  /**
   * Update Next.js config to handle Solana dependencies
   */
  private static async updateNextConfig(
    projectInfo: ProjectInfo
  ): Promise<void> {
    logger.info("Updating Next.js configuration...");

    // Find Next.js config file
    const configPaths = [
      path.join(projectInfo.projectRoot, "next.config.js"),
      path.join(projectInfo.projectRoot, "next.config.mjs"),
      path.join(projectInfo.projectRoot, "next.config.ts"),
    ];

    let configPath = "";
    for (const p of configPaths) {
      if (await fs.pathExists(p)) {
        configPath = p;
        break;
      }
    }

    if (!configPath) {
      // Create a new config file if one doesn't exist
      configPath = path.join(projectInfo.projectRoot, "next.config.js");
      await fs.writeFile(
        configPath,
        `/** @type {import('next').NextConfig} */\nmodule.exports = {\n  reactStrictMode: true,\n};\n`
      );
    }

    try {
      // Read the config file content
      const content = await fs.readFile(configPath, "utf-8");

      // Check if config already has Solana setup
      if (content.includes("@solana/wallet-adapter")) {
        logger.debug("Next.js config already has Solana setup");
        return;
      }

      // Update the configuration
      let updatedContent = content;

      // Add transpile modules
      if (content.includes("transpilePackages")) {
        // Update existing transpilePackages
        updatedContent = updatedContent.replace(
          /transpilePackages\s*:\s*\[(.*?)\]/s,
          (match, packages) => {
            const packagesList = packages.trim();
            const newPackages = [
              "@solana/wallet-adapter-base",
              "@solana/wallet-adapter-react",
              "@solana/wallet-adapter-react-ui",
              "@solana/wallet-adapter-wallets",
            ];

            if (packagesList) {
              return `transpilePackages: [${packagesList}${
                packagesList.endsWith(",") ? "" : ","
              } '${newPackages.join("', '")}']`;
            }

            return `transpilePackages: ['${newPackages.join("', '")}']`;
          }
        );
      } else if (content.includes("module.exports")) {
        // Add transpilePackages to the config
        updatedContent = updatedContent.replace(
          /module\.exports\s*=\s*{/,
          `module.exports = {\n  transpilePackages: ['@solana/wallet-adapter-base', '@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui', '@solana/wallet-adapter-wallets'],`
        );
      } else if (content.includes("export default")) {
        // Add transpilePackages to the config (ES modules)
        updatedContent = updatedContent.replace(
          /export default\s*{/,
          `export default {\n  transpilePackages: ['@solana/wallet-adapter-base', '@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui', '@solana/wallet-adapter-wallets'],`
        );
      } else {
        // Fallback: create a simple config
        updatedContent = `/** @type {import('next').NextConfig} */\nmodule.exports = {
  reactStrictMode: true,
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets'
  ],
};\n`;
      }

      // Add webpack configuration for polyfills if needed
      if (!updatedContent.includes("webpack")) {
        const webpackConfig = `\n  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    return config;
  },`;

        // Add webpack config before the closing bracket
        if (updatedContent.match(/};\s*$/)) {
          updatedContent = updatedContent.replace(
            /};(\s*)$/,
            `${webpackConfig}\n};$1`
          );
        } else if (updatedContent.match(/}\s*$/)) {
          updatedContent = updatedContent.replace(
            /}(\s*)$/,
            `${webpackConfig}\n}$1`
          );
        }
      }

      // Write updated content
      await fs.writeFile(configPath, updatedContent);
      logger.success("Updated Next.js configuration");
    } catch (error) {
      logger.error("Failed to update Next.js config", error as Error);
      throw error;
    }
  }

  /**
   * Update app entry point to include Solana providers
   */
  private static async updateAppEntryPoint(
    projectInfo: ProjectInfo,
    context: TemplateContext
  ): Promise<void> {
    logger.info("Updating app entry point with Solana providers...");

    if (projectInfo.isAppRouter) {
      await this.updateAppRouterEntryPoint(projectInfo, context);
    } else {
      await this.updatePagesRouterEntryPoint(projectInfo, context);
    }
  }

  /**
   * Update App Router layout with Solana providers
   */
  private static async updateAppRouterEntryPoint(
    projectInfo: ProjectInfo,
    context: TemplateContext
  ): Promise<void> {
    // For App Router, we need to update the root layout file
    const ext = projectInfo.hasTypeScript ? "tsx" : "jsx";

    // Check for app directory in src or project root
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
      logger.warn(
        "Could not find app directory. Please manually add ClientWalletProvider to your root layout."
      );
      return;
    }

    // Look for layout file
    const layoutFile = path.join(appDir, `layout.${ext}`);

    if (!(await fs.pathExists(layoutFile))) {
      logger.warn(
        `Layout file not found at ${layoutFile}. Please manually add ClientWalletProvider to your root layout.`
      );
      return;
    }

    try {
      // Read the layout file
      const content = await fs.readFile(layoutFile, "utf-8");

      // Check if ClientWalletProvider already exists
      if (content.includes("ClientWalletProvider")) {
        logger.debug("ClientWalletProvider already present in layout");
        return;
      }

      // Add import statement
      let updatedContent = content;

      // Find import section and add import
      const importSection = updatedContent.match(/^import.*?;(\r?\n|$)/gm);
      if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        const importPos =
          updatedContent.lastIndexOf(lastImport) + lastImport.length;
        updatedContent =
          updatedContent.substring(0, importPos) +
          `\n// Import Solana wallet provider\nimport { ClientWalletProvider } from '../solana/wallet';\n` +
          updatedContent.substring(importPos);
      } else {
        // No imports found, add at the beginning
        updatedContent =
          `// Import Solana wallet provider\nimport { ClientWalletProvider } from '../solana/wallet';\n\n` +
          updatedContent;
      }

      // Find the children prop in the return statement and wrap with ClientWalletProvider
      const childrenMatch = updatedContent.match(
        /(\s*return\s*\(\s*<.*?>)(\s*\{children\}\s*)(<\/.*?>)/s
      );

      if (childrenMatch) {
        const [fullMatch, prefix, children, suffix] = childrenMatch;
        const wrappedChildren = `${prefix}\n      <ClientWalletProvider>\n        ${children}\n      </ClientWalletProvider>\n    ${suffix}`;
        updatedContent = updatedContent.replace(fullMatch, wrappedChildren);
      } else {
        logger.warn(
          "Could not automatically update layout with ClientWalletProvider. Please add it manually."
        );
        return;
      }

      // Write updated content
      await fs.writeFile(layoutFile, updatedContent);
      logger.success(`Added ClientWalletProvider to ${layoutFile}`);
    } catch (error) {
      logger.error("Failed to update App Router layout", error as Error);
    }
  }

  /**
   * Update Pages Router _app file with Solana providers
   */
  private static async updatePagesRouterEntryPoint(
    projectInfo: ProjectInfo,
    context: TemplateContext
  ): Promise<void> {
    // For Pages Router, we need to update the _app file
    const ext = projectInfo.hasTypeScript ? "tsx" : "jsx";

    // Check for pages directory in src or project root
    let pagesDir = "";
    const possiblePagesDirs = [
      path.join(projectInfo.srcDir, "pages"),
      path.join(projectInfo.projectRoot, "pages"),
    ];

    for (const dir of possiblePagesDirs) {
      if (await fs.pathExists(dir)) {
        pagesDir = dir;
        break;
      }
    }

    if (!pagesDir) {
      logger.warn(
        "Could not find pages directory. Please manually add SolanaProvider to your _app file."
      );
      return;
    }

    // Look for _app file
    let appFile = path.join(pagesDir, `_app.${ext}`);

    // If _app file doesn't exist, create it
    if (!(await fs.pathExists(appFile))) {
      logger.info(`Creating _app.${ext} file...`);

      // Get the template based on TypeScript usage
      const templatePath = path.join(
        __dirname,
        `../../../templates/nextjs/pages-router/_app.${ext}`
      );

      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        logger.warn(
          `Template file not found at ${templatePath}. Please manually create _app file with SolanaProvider.`
        );
        return;
      }

      // Copy and process template
      await TemplateEngine.copyTemplateDirectory(
        path.dirname(templatePath),
        pagesDir,
        context
      );

      logger.success(`Created _app.${ext} with SolanaProvider`);
      return;
    }

    try {
      // Read the _app file
      const content = await fs.readFile(appFile, "utf-8");

      // Check if SolanaProvider already exists
      if (content.includes("SolanaProvider")) {
        logger.debug("SolanaProvider already present in _app file");
        return;
      }

      // Add import statement
      let updatedContent = content;

      // Find import section and add import
      const importSection = updatedContent.match(/^import.*?;(\r?\n|$)/gm);
      if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        const importPos =
          updatedContent.lastIndexOf(lastImport) + lastImport.length;
        updatedContent =
          updatedContent.substring(0, importPos) +
          `\nimport { SolanaProvider } from '../solana/wallet';\n` +
          updatedContent.substring(importPos);
      } else {
        // No imports found, add at the beginning
        updatedContent =
          `import { SolanaProvider } from '../solana/wallet';\n\n` +
          updatedContent;
      }

      // Find the Component prop in the return statement and wrap with SolanaProvider
      const componentMatch = updatedContent.match(
        /(\s*return\s*\(\s*)(<Component\s*{.*?}\s*\/>)(\s*\))/s
      );

      if (componentMatch) {
        const [fullMatch, prefix, component, suffix] = componentMatch;
        const wrappedComponent = `${prefix}<SolanaProvider>\n      ${component}\n    </SolanaProvider>${suffix}`;
        updatedContent = updatedContent.replace(fullMatch, wrappedComponent);
      } else {
        logger.warn(
          "Could not automatically update _app with SolanaProvider. Please add it manually."
        );
        return;
      }

      // Write updated content
      await fs.writeFile(appFile, updatedContent);
      logger.success(`Added SolanaProvider to ${appFile}`);
    } catch (error) {
      logger.error("Failed to update Pages Router _app file", error as Error);
    }
  }
}
