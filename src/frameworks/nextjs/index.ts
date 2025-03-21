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
      // Check if we should use Reown AppKit integration
      if (solanaConfig.useAppKit) {
        // Generate AppKit integration
        await this.generateAppKitIntegration(
          projectInfo,
          solanaConfig,
          context
        );
      } else {
        // Copy wallet adapter files (legacy method)
        await this.generateWalletAdapter(projectInfo, solanaConfig, context);
      }

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
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
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
      } else if (!updatedContent.includes("externals")) {
        // Add externals to existing webpack config
        updatedContent = updatedContent.replace(
          /(webpack\s*:\s*\(\s*config\s*\)\s*=>\s*{[^}]*)(return config;)/,
          "$1config.externals.push('pino-pretty', 'lokijs', 'encoding');\n    $2"
        );
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
        "Could not find app directory. Please manually add AppKit provider to your root layout."
      );
      return;
    }

    // Look for layout file
    let layoutFile = path.join(appDir, `layout.${ext}`);

    if (!(await fs.pathExists(layoutFile))) {
      // Try with an alternative extension
      const altExt = ext === "tsx" ? "jsx" : "tsx";
      layoutFile = path.join(appDir, `layout.${altExt}`);

      if (!(await fs.pathExists(layoutFile))) {
        // If still not found, try without typescript extension
        layoutFile = path.join(appDir, "layout.js");

        if (!(await fs.pathExists(layoutFile))) {
          logger.warn(
            `Layout file not found at ${layoutFile}. Please manually add AppKit provider to your root layout.`
          );
          return;
        }
      }
    }

    try {
      // Read the layout file
      let content = await fs.readFile(layoutFile, "utf-8");

      // Check if using AppKit or standard wallet adapter
      if (context.config.useAppKit) {
        // Check if context provider already exists
        if (
          content.includes("ContextProvider") ||
          content.includes("AppKitProvider")
        ) {
          logger.debug("AppKit provider already present in layout");
          return;
        }

        // Very specific pattern for Next.js 15 template
        // Matches <body ...>{\s*children\s*}</body>
        const nextjsBodyPattern =
          /<body\s+[^>]*>\s*\{\s*children\s*\}\s*<\/body>/s;

        if (nextjsBodyPattern.test(content)) {
          // Replace body children with ContextProvider-wrapped children
          content = content.replace(
            /<body(\s+[^>]*)>\s*\{\s*children\s*\}\s*<\/body>/s,
            "<body$1>\n        <ContextProvider>\n          {children}\n        </ContextProvider>\n      </body>"
          );

          // Add import at the top of the file
          const importStatement =
            '\nimport ContextProvider from "@/context";\n';

          // Find a good spot to add the import
          if (content.includes('import "./globals.css"')) {
            content = content.replace(
              'import "./globals.css";',
              'import "./globals.css";' + importStatement
            );
          } else if (content.match(/^import .+$/m)) {
            // Find the last import statement
            const imports = content.match(/^import .+$/gm);
            if (imports && imports.length > 0) {
              const lastImport = imports[imports.length - 1];
              content = content.replace(
                lastImport,
                lastImport + importStatement
              );
            } else {
              // Just add at the beginning
              content = importStatement + content;
            }
          } else {
            // Just add at the beginning
            content = importStatement + content;
          }

          // Write the file
          await fs.writeFile(layoutFile, content);
          logger.success(`Added ContextProvider to ${layoutFile}`);
          return;
        }

        // Add import statement for AppKit
        let updatedContent = content;

        // Find import section and add import
        const importSection = updatedContent.match(/^import.*?;(\r?\n|$)/gm);
        if (importSection) {
          const lastImport = importSection[importSection.length - 1];
          const importPos =
            updatedContent.lastIndexOf(lastImport) + lastImport.length;
          updatedContent =
            updatedContent.substring(0, importPos) +
            `\n// Import AppKit provider\nimport { AppKitProvider } from '../config/context';\n` +
            updatedContent.substring(importPos);
        } else {
          // No imports found, add at the beginning
          updatedContent =
            `// Import AppKit provider\nimport { AppKitProvider } from '../config/context';\n\n` +
            updatedContent;
        }

        // Try to find the body tag and add the provider
        const bodyPattern =
          /(<body[^>]*>)([\s\S]*?)(\{children\})([\s\S]*?)(<\/body>)/;
        const bodyMatch = updatedContent.match(bodyPattern);

        if (bodyMatch) {
          const [
            fullMatch,
            bodyOpen,
            beforeChildren,
            children,
            afterChildren,
            bodyClose,
          ] = bodyMatch;
          const wrappedContent = `${bodyOpen}${beforeChildren}<AppKitProvider>${children}</AppKitProvider>${afterChildren}${bodyClose}`;
          updatedContent = updatedContent.replace(fullMatch, wrappedContent);
        } else {
          // Direct children pattern without body tag formatting
          const simpleBodyPattern = /(<body[^>]*>)([\s\S]*?)(<\/body>)/;
          const simpleBodyMatch = updatedContent.match(simpleBodyPattern);

          if (simpleBodyMatch) {
            const [fullMatch, bodyOpen, bodyContent, bodyClose] =
              simpleBodyMatch;

            // Replace {children} in body content
            if (bodyContent.includes("{children}")) {
              const newBodyContent = bodyContent.replace(
                "{children}",
                "<AppKitProvider>{children}</AppKitProvider>"
              );
              updatedContent = updatedContent.replace(
                fullMatch,
                `${bodyOpen}${newBodyContent}${bodyClose}`
              );
            } else {
              // Cannot find children in body tag, try to insert it anyway
              const insertionPoint = bodyContent.lastIndexOf("<");
              if (insertionPoint > 0) {
                const beforeInsert = bodyContent.substring(0, insertionPoint);
                const afterInsert = bodyContent.substring(insertionPoint);
                updatedContent = updatedContent.replace(
                  fullMatch,
                  `${bodyOpen}${beforeInsert}<AppKitProvider>${
                    afterInsert.trim().startsWith("{children}")
                      ? afterInsert
                      : `{children}${afterInsert}`
                  }</AppKitProvider>${bodyClose}`
                );
              } else {
                updatedContent = updatedContent.replace(
                  fullMatch,
                  `${bodyOpen}<AppKitProvider>${
                    bodyContent || "{children}"
                  }</AppKitProvider>${bodyClose}`
                );
              }
            }
          } else {
            // If still can't match, try a simple return pattern
            const returnPattern = /return\s*\(\s*([^]*?)\);?\s*(?:}|$)/s;
            const returnMatch = updatedContent.match(returnPattern);

            if (returnMatch) {
              const [fullMatch, returnContent] = returnMatch;

              if (returnContent.includes("{children}")) {
                const newReturnContent = returnContent.replace(
                  "{children}",
                  "<AppKitProvider>{children}</AppKitProvider>"
                );
                updatedContent = updatedContent.replace(
                  fullMatch,
                  `return (${newReturnContent});`
                );
              } else {
                logger.warn(
                  "Could not locate {children} in return statement. Please add AppKitProvider manually."
                );
                return;
              }
            } else {
              logger.warn(
                "Could not automatically update layout with AppKitProvider. Please add it manually."
              );
              return;
            }
          }
        }

        // Write updated content
        await fs.writeFile(layoutFile, updatedContent);
        logger.success(`Added AppKitProvider to ${layoutFile}`);
      } else {
        // Standard wallet adapter integration
        // Check if ClientWalletProvider already exists
        if (content.includes("ClientWalletProvider")) {
          logger.debug("ClientWalletProvider already present in layout");
          return;
        }

        // Very specific pattern for Next.js 15 template
        // Matches <body ...>{\s*children\s*}</body>
        const nextjsBodyPattern =
          /<body\s+[^>]*>\s*\{\s*children\s*\}\s*<\/body>/s;

        if (nextjsBodyPattern.test(content)) {
          // Replace body children with ClientWalletProvider-wrapped children
          content = content.replace(
            /<body(\s+[^>]*)>\s*\{\s*children\s*\}\s*<\/body>/s,
            "<body$1>\n        <ClientWalletProvider>\n          {children}\n        </ClientWalletProvider>\n      </body>"
          );

          // Add import at the top of the file
          const importStatement =
            '\nimport { ClientWalletProvider } from "../solana/wallet";\n';

          // Find a good spot to add the import
          if (content.includes('import "./globals.css"')) {
            content = content.replace(
              'import "./globals.css";',
              'import "./globals.css";' + importStatement
            );
          } else if (content.match(/^import .+$/m)) {
            // Find the last import statement
            const imports = content.match(/^import .+$/gm);
            if (imports && imports.length > 0) {
              const lastImport = imports[imports.length - 1];
              content = content.replace(
                lastImport,
                lastImport + importStatement
              );
            } else {
              // Just add at the beginning
              content = importStatement + content;
            }
          } else {
            // Just add at the beginning
            content = importStatement + content;
          }

          // Write the file
          await fs.writeFile(layoutFile, content);
          logger.success(`Added ClientWalletProvider to ${layoutFile}`);
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

        // Try to find the body tag and add the provider
        const bodyPattern =
          /(<body[^>]*>)([\s\S]*?)(\{children\})([\s\S]*?)(<\/body>)/;
        const bodyMatch = updatedContent.match(bodyPattern);

        if (bodyMatch) {
          const [
            fullMatch,
            bodyOpen,
            beforeChildren,
            children,
            afterChildren,
            bodyClose,
          ] = bodyMatch;
          const wrappedContent = `${bodyOpen}${beforeChildren}<ClientWalletProvider>${children}</ClientWalletProvider>${afterChildren}${bodyClose}`;
          updatedContent = updatedContent.replace(fullMatch, wrappedContent);
        } else {
          // Direct children pattern without body tag formatting
          const simpleBodyPattern = /(<body[^>]*>)([\s\S]*?)(<\/body>)/;
          const simpleBodyMatch = updatedContent.match(simpleBodyPattern);

          if (simpleBodyMatch) {
            const [fullMatch, bodyOpen, bodyContent, bodyClose] =
              simpleBodyMatch;

            // Replace {children} in body content
            if (bodyContent.includes("{children}")) {
              const newBodyContent = bodyContent.replace(
                "{children}",
                "<ClientWalletProvider>{children}</ClientWalletProvider>"
              );
              updatedContent = updatedContent.replace(
                fullMatch,
                `${bodyOpen}${newBodyContent}${bodyClose}`
              );
            } else {
              // Cannot find children in body tag, try to insert it anyway
              const insertionPoint = bodyContent.lastIndexOf("<");
              if (insertionPoint > 0) {
                const beforeInsert = bodyContent.substring(0, insertionPoint);
                const afterInsert = bodyContent.substring(insertionPoint);
                updatedContent = updatedContent.replace(
                  fullMatch,
                  `${bodyOpen}${beforeInsert}<ClientWalletProvider>${
                    afterInsert.trim().startsWith("{children}")
                      ? afterInsert
                      : `{children}${afterInsert}`
                  }</ClientWalletProvider>${bodyClose}`
                );
              } else {
                updatedContent = updatedContent.replace(
                  fullMatch,
                  `${bodyOpen}<ClientWalletProvider>${
                    bodyContent || "{children}"
                  }</ClientWalletProvider>${bodyClose}`
                );
              }
            }
          } else {
            // If still can't match, try a simple return pattern
            const returnPattern = /return\s*\(\s*([^]*?)\);?\s*(?:}|$)/s;
            const returnMatch = updatedContent.match(returnPattern);

            if (returnMatch) {
              const [fullMatch, returnContent] = returnMatch;

              if (returnContent.includes("{children}")) {
                const newReturnContent = returnContent.replace(
                  "{children}",
                  "<ClientWalletProvider>{children}</ClientWalletProvider>"
                );
                updatedContent = updatedContent.replace(
                  fullMatch,
                  `return (${newReturnContent});`
                );
              } else {
                logger.warn(
                  "Could not locate {children} in return statement. Please add ClientWalletProvider manually."
                );
                return;
              }
            } else {
              logger.warn(
                "Could not automatically update layout with ClientWalletProvider. Please add it manually."
              );
              return;
            }
          }
        }

        // Write updated content
        await fs.writeFile(layoutFile, updatedContent);
        logger.success(`Added ClientWalletProvider to ${layoutFile}`);
      }
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

  /**
   * Generate Reown AppKit integration files
   */
  private static async generateAppKitIntegration(
    projectInfo: ProjectInfo,
    solanaConfig: SolanaConfig,
    context: TemplateContext
  ): Promise<void> {
    logger.info("Initializing Reown AppKit for Next.js...");

    // Create directories
    const configDir = path.join(projectInfo.srcDir, "config");
    const contextDir = path.join(projectInfo.srcDir, "context");
    const componentsDir = path.join(projectInfo.srcDir, "components");
    const hooksDir = path.join(projectInfo.srcDir, "hooks");

    await fs.ensureDir(configDir);
    await fs.ensureDir(contextDir);
    await fs.ensureDir(componentsDir);
    await fs.ensureDir(hooksDir);

    // Enhance context with AppKit-specific values
    const appKitContext = {
      ...context,
      projectInfo: {
        ...projectInfo,
        name: projectInfo.name || "Solana App",
        description:
          projectInfo.description || "A Next.js app with Solana integration",
        url: projectInfo.url || "https://example.com",
        icon: projectInfo.icon || "https://example.com/icon.png",
        themeMode: solanaConfig.appKitConfig?.themeMode || "dark",
        analytics: solanaConfig.appKitConfig?.analytics || false,
        accentColor: solanaConfig.appKitConfig?.accentColor || "#3b82f6",
        projectId: solanaConfig.projectId || "demo-project-123",
      },
      solanaConfig: {
        ...solanaConfig,
        includeMainnet: true,
        includeTestnet: true,
        includeDevnet: true,
        wallets: ["Phantom", "Solflare"],
      },
    };

    // Copy AppKit template files
    // 1. Configuration
    const configTemplateDir = path.join(
      __dirname,
      "../../../templates/nextjs/app-router/config"
    );
    await TemplateEngine.copyTemplateDirectory(
      configTemplateDir,
      configDir,
      appKitContext
    );

    // 2. Context
    const contextTemplateDir = path.join(
      __dirname,
      "../../../templates/nextjs/app-router/context"
    );
    await TemplateEngine.copyTemplateDirectory(
      contextTemplateDir,
      contextDir,
      appKitContext
    );

    // 3. Components
    const componentsTemplateDir = path.join(
      __dirname,
      "../../../templates/nextjs/app-router/components"
    );
    await TemplateEngine.copyTemplateDirectory(
      componentsTemplateDir,
      componentsDir,
      appKitContext
    );

    // 4. Hooks
    const hooksTemplateDir = path.join(
      __dirname,
      "../../../templates/nextjs/app-router/hooks"
    );
    await TemplateEngine.copyTemplateDirectory(
      hooksTemplateDir,
      hooksDir,
      appKitContext
    );

    // Update package.json with AppKit dependencies
    await this.updatePackageJson(projectInfo);

    // Install AppKit dependencies
    logger.info("Installing AppKit dependencies...");
    try {
      // Use child_process to run pnpm add
      const { execSync } = require("child_process");
      execSync("pnpm add @reown/appkit @reown/appkit-adapter-solana", {
        cwd: projectInfo.projectRoot,
        stdio: "inherit",
      });
      logger.success("Successfully installed AppKit dependencies");
    } catch (error) {
      logger.error("Failed to install AppKit dependencies", error as Error);
      // Continue with the setup even if installation fails
      logger.warn(
        "You may need to run 'pnpm add @reown/appkit @reown/appkit-adapter-solana' manually to complete the setup"
      );
    }

    // Create .env.local file with AppKit configuration
    await this.createEnvFile(projectInfo, solanaConfig);

    // Update page.tsx/jsx to include AppKit components
    await this.updateHomePage(projectInfo);

    logger.debug("Generated Reown AppKit integration files");
  }

  /**
   * Update package.json with AppKit dependencies
   */
  private static async updatePackageJson(
    projectInfo: ProjectInfo
  ): Promise<void> {
    try {
      const packageJsonPath = path.join(
        projectInfo.projectRoot,
        "package.json"
      );

      // Read the current package.json
      const packageJson = await fs.readJson(packageJsonPath);

      // Add AppKit dependencies
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies["@reown/appkit"] = "1.7.0";
      packageJson.dependencies["@reown/appkit-adapter-solana"] = "1.7.0";

      // Write back the updated package.json
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      logger.success("Updated package.json with AppKit dependencies");
    } catch (error) {
      logger.error(
        "Failed to update package.json with AppKit dependencies",
        error as Error
      );
    }
  }

  /**
   * Create .env file with AppKit configuration
   */
  private static async createEnvFile(
    projectInfo: ProjectInfo,
    solanaConfig: SolanaConfig
  ): Promise<void> {
    // Create .env.local file
    const envContent = `NEXT_PUBLIC_PROJECT_ID=${solanaConfig.projectId || ""}`;
    const envPath = path.join(projectInfo.projectRoot, ".env.local");

    await fs.writeFile(envPath, envContent);

    logger.debug("Created .env.local with AppKit configuration");
  }

  /**
   * Update home page with AppKit components
   */
  private static async updateHomePage(projectInfo: ProjectInfo): Promise<void> {
    // Determine file extension based on TypeScript usage
    const ext = projectInfo.hasTypeScript ? "tsx" : "jsx";

    // Find app directory
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
      logger.warn("Could not find app directory to update home page.");
      return;
    }

    // Find page file
    let pageFile = path.join(appDir, `page.${ext}`);

    if (!(await fs.pathExists(pageFile))) {
      // Try with an alternative extension
      const altExt = ext === "tsx" ? "jsx" : "tsx";
      pageFile = path.join(appDir, `page.${altExt}`);

      if (!(await fs.pathExists(pageFile))) {
        // If still not found, try without typescript extension
        pageFile = path.join(appDir, "page.js");

        if (!(await fs.pathExists(pageFile))) {
          logger.warn(`Home page file not found at ${pageFile}.`);

          // Create page file if it doesn't exist
          pageFile = path.join(appDir, `page.${ext}`);
          await this.createHomePage(pageFile);
          return;
        }
      }
    }

    try {
      // Create AppKit demo content
      const appKitPageContent = `
import { ConnectButton } from "@/components/ConnectButton";
import { ActionButtonList } from "@/components/ActionButtonList";
import { InfoList } from "@/components/InfoList";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Reown AppKit + Solana Integration</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Wallet Connection</h2>
          <ConnectButton />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Actions</h2>
            <ActionButtonList />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Wallet Info</h2>
            <InfoList />
          </div>
        </div>
      </div>
    </main>
  );
}
`;

      // Write the updated page file
      await fs.writeFile(pageFile, appKitPageContent);
      logger.success(`Updated home page with AppKit components: ${pageFile}`);
    } catch (error) {
      logger.error(
        "Failed to update home page with AppKit components",
        error as Error
      );
    }
  }

  /**
   * Create the home page if it doesn't exist
   */
  private static async createHomePage(pageFile: string): Promise<void> {
    try {
      const appKitPageContent = `
import { ConnectButton } from "@/components/ConnectButton";
import { ActionButtonList } from "@/components/ActionButtonList";
import { InfoList } from "@/components/InfoList";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Reown AppKit + Solana Integration</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Wallet Connection</h2>
          <ConnectButton />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Actions</h2>
            <ActionButtonList />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Wallet Info</h2>
            <InfoList />
          </div>
        </div>
      </div>
    </main>
  );
}
`;

      // Ensure directory exists
      await fs.ensureDir(path.dirname(pageFile));

      // Create the page file
      await fs.writeFile(pageFile, appKitPageContent);
      logger.success(`Created home page with AppKit components: ${pageFile}`);
    } catch (error) {
      logger.error(
        "Failed to create home page with AppKit components",
        error as Error
      );
    }
  }
}
