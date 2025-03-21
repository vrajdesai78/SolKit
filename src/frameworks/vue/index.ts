import * as path from "path";
import * as fs from "fs-extra";
import { ProjectInfo, SolanaConfig, TemplateContext } from "../../types";
import { Logger } from "../../utils/logger";
import { TemplateEngine } from "../../core/template-engine";

const logger = Logger.getInstance();

/**
 * Vue.js framework integration for Solana
 */
export class VueFramework {
  /**
   * Initialize Solana integration for Vue.js
   */
  public static async init(
    projectInfo: ProjectInfo,
    solanaConfig: SolanaConfig
  ): Promise<void> {
    logger.info("Initializing Solana integration for Vue.js...");

    // Create template context
    const context: TemplateContext = {
      projectInfo,
      solanaConfig,
      typescriptExtension: projectInfo.hasTypeScript ? "ts" : "js",
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

      // Update main.js/ts file
      await this.updateMainFile(projectInfo);

      logger.success("Vue.js Solana integration complete");
    } catch (error) {
      logger.error(
        "Failed to initialize Solana integration for Vue.js",
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
    const templateDir = path.join(__dirname, "../../../templates/vue/wallet");
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
    const templateDir = path.join(
      __dirname,
      "../../../templates/vue/transactions"
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
    const templateDir = path.join(__dirname, "../../../templates/vue/tokens");
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
    const templateDir = path.join(__dirname, "../../../templates/vue/nfts");
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
    const templateDir = path.join(__dirname, "../../../templates/vue/examples");
    const targetDir = path.join(projectInfo.srcDir, "components");

    await fs.ensureDir(targetDir);

    // Copy example components
    await TemplateEngine.copyTemplateDirectory(templateDir, targetDir, context);

    logger.debug("Generated example components");
  }

  /**
   * Update main.js/ts file to include Solana plugin
   */
  private static async updateMainFile(projectInfo: ProjectInfo): Promise<void> {
    logger.info("Updating Vue.js main file with Solana plugin...");

    // Try to find the main entry point
    const ext = projectInfo.hasTypeScript ? "ts" : "js";
    const possibleMainFiles = [
      path.join(projectInfo.srcDir, `main.${ext}`),
      path.join(projectInfo.srcDir, `index.${ext}`),
      path.join(projectInfo.projectRoot, `main.${ext}`),
      path.join(projectInfo.projectRoot, `index.${ext}`),
    ];

    let mainFile = "";

    for (const file of possibleMainFiles) {
      if (await fs.pathExists(file)) {
        mainFile = file;
        break;
      }
    }

    if (!mainFile) {
      logger.warn(
        "Could not find Vue.js main file. Please manually add the Solana plugin to your main file."
      );
      return;
    }

    try {
      // Read the main file
      const content = await fs.readFile(mainFile, "utf-8");

      // Check if Solana plugin already exists
      if (
        content.includes("SolanaPlugin") ||
        content.includes("solana/wallet")
      ) {
        logger.debug("Solana plugin already present in main file");
        return;
      }

      // Add import statement
      let updatedContent = content;

      // Find import section
      const importSection = updatedContent.match(/^import.*?;?(\r?\n|$)/gm);
      if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        const importPos =
          updatedContent.lastIndexOf(lastImport) + lastImport.length;
        updatedContent =
          updatedContent.substring(0, importPos) +
          `\nimport { SolanaPlugin } from './solana/wallet';\n` +
          updatedContent.substring(importPos);
      } else {
        // No imports found, add at the beginning
        updatedContent =
          `import { SolanaPlugin } from './solana/wallet';\n\n` +
          updatedContent;
      }

      // Find app creation and use statement
      if (updatedContent.includes("createApp(")) {
        // For Vue 3
        const appMatch = updatedContent.match(
          /(const\s+app\s*=\s*createApp\s*\(.*?\))(.*?)(app\.mount)/s
        );

        if (appMatch) {
          const [fullMatch, appCreation, middlewareSection, appMount] =
            appMatch;

          // Check if there are existing app.use calls
          if (middlewareSection.includes("app.use(")) {
            // Add after the last app.use
            const lastUse = middlewareSection.lastIndexOf("app.use(");
            const lastUseEndIndex = middlewareSection.indexOf(")", lastUse) + 1;

            const updatedMiddlewareSection =
              middlewareSection.substring(0, lastUseEndIndex) +
              "\napp.use(SolanaPlugin)" +
              middlewareSection.substring(lastUseEndIndex);

            updatedContent = updatedContent.replace(
              middlewareSection,
              updatedMiddlewareSection
            );
          } else {
            // Add right after app creation
            updatedContent = updatedContent.replace(
              appCreation,
              `${appCreation}\napp.use(SolanaPlugin)`
            );
          }
        } else {
          // Try simpler pattern for Vue 3
          const createAppMatch = updatedContent.match(
            /(createApp\s*\(.*?\).*?)\.mount/s
          );

          if (createAppMatch) {
            const [fullMatch, appCreation] = createAppMatch;
            updatedContent = updatedContent.replace(
              appCreation,
              `${appCreation}.use(SolanaPlugin)`
            );
          } else {
            logger.warn(
              "Could not automatically update main file with Solana plugin. Please add it manually."
            );
          }
        }
      } else if (updatedContent.includes("new Vue(")) {
        // For Vue 2
        const vueOptionsMatch = updatedContent.match(
          /(new\s+Vue\s*\(\s*\{)(.*?)(\}\s*\))/s
        );

        if (vueOptionsMatch) {
          const [fullMatch, vueStart, vueOptions, vueEnd] = vueOptionsMatch;

          // Add SolanaPlugin as a plugin
          if (!vueOptions.includes("plugins")) {
            const updatedOptions = vueOptions + `\n  plugins: [SolanaPlugin],`;
            updatedContent = updatedContent.replace(vueOptions, updatedOptions);
          } else {
            // Update existing plugins array
            const pluginsMatch = vueOptions.match(
              /(plugins\s*:\s*\[)(.*?)(\])/s
            );

            if (pluginsMatch) {
              const [pluginsFullMatch, pluginsStart, pluginsList, pluginsEnd] =
                pluginsMatch;
              const updatedPlugins = pluginsList
                ? `${pluginsList}, SolanaPlugin`
                : "SolanaPlugin";
              updatedContent = updatedContent.replace(
                pluginsFullMatch,
                `${pluginsStart}${updatedPlugins}${pluginsEnd}`
              );
            } else {
              logger.warn(
                "Could not automatically update plugins in main file. Please add SolanaPlugin manually."
              );
            }
          }
        } else {
          logger.warn(
            "Could not automatically update main file with Solana plugin. Please add it manually."
          );
        }
      } else {
        logger.warn(
          "Could not automatically update main file with Solana plugin. Please add it manually."
        );
      }

      // Write updated content
      await fs.writeFile(mainFile, updatedContent);
      logger.success(`Added Solana plugin to ${mainFile}`);
    } catch (error) {
      logger.error("Failed to update Vue.js main file", error as Error);
    }
  }
}
