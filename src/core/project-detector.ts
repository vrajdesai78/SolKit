import * as fs from "fs-extra";
import * as path from "path";
import globSync from "glob";
import { Framework, PackageManager, ProjectInfo } from "../types";
import { Logger } from "../utils/logger";
import { PackageManagerUtils } from "../utils/package-manager";

const logger = Logger.getInstance();

/**
 * Utility class for detecting project structure
 */
export class ProjectDetector {
  /**
   * Detect the project framework, package manager, and structure
   */
  public static async detectProject(projectPath: string): Promise<ProjectInfo> {
    const projectRoot = path.resolve(projectPath);
    logger.debug(`Detecting project at ${projectRoot}`);

    // Check if directory exists
    if (!(await fs.pathExists(projectRoot))) {
      throw new Error(`Project directory does not exist: ${projectRoot}`);
    }

    // Check for package.json
    const packageJsonPath = path.join(projectRoot, "package.json");
    if (!(await fs.pathExists(packageJsonPath))) {
      throw new Error(`No package.json found in ${projectRoot}`);
    }

    // Read package.json
    const packageJson = await fs.readJson(packageJsonPath);

    // Detect package manager
    const packageManager = await PackageManagerUtils.detectPackageManager(
      projectRoot
    );

    // Detect framework
    const framework = await this.detectFramework(projectRoot, packageJson);

    // Check for TypeScript
    const hasTypeScript = await this.hasTypeScript(projectRoot, packageJson);

    // Find the source directory
    const srcDir = await this.findSrcDir(projectRoot);

    // Detect Next.js version for app router vs pages router
    const isNext13OrLater = await this.isNext13OrLater(packageJson);

    // Check if using Next.js app router
    const isAppRouter =
      framework === Framework.NEXTJS
        ? await this.isAppRouter(projectRoot)
        : false;

    logger.debug(`Project detection results:
      Framework: ${framework}
      Package Manager: ${packageManager}
      TypeScript: ${hasTypeScript ? "Yes" : "No"}
      Source Directory: ${srcDir}
      Next.js 13+: ${isNext13OrLater ? "Yes" : "No"}
      App Router: ${isAppRouter ? "Yes" : "No"}
    `);

    return {
      framework,
      packageManager,
      hasTypeScript,
      projectRoot,
      srcDir,
      packageJson,
      isNext13OrLater,
      isAppRouter,
    };
  }

  /**
   * Detect the framework from package.json and file patterns
   */
  private static async detectFramework(
    projectRoot: string,
    packageJson: any
  ): Promise<Framework> {
    logger.debug("Detecting framework");

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for Next.js
    if (dependencies.next) {
      logger.debug("Detected Next.js framework");
      return Framework.NEXTJS;
    }

    // Check for React
    if (dependencies.react && dependencies["react-dom"]) {
      // Look for JSX/TSX files to confirm React
      try {
        const jsxPattern = path.join(projectRoot, "**", "*.jsx");
        const tsxPattern = path.join(projectRoot, "**", "*.tsx");

        const jsxFiles = globSync.sync(jsxPattern, {
          ignore: path.join(projectRoot, "node_modules", "**"),
        });
        const tsxFiles = globSync.sync(tsxPattern, {
          ignore: path.join(projectRoot, "node_modules", "**"),
        });

        if (jsxFiles.length > 0 || tsxFiles.length > 0) {
          logger.debug("Detected React framework");
          return Framework.REACT;
        }
      } catch (error) {
        logger.debug(`Error checking for React files: ${error}`);
      }
    }

    // Check for Vue
    if (dependencies.vue) {
      // Look for Vue files to confirm Vue
      try {
        const vuePattern = path.join(projectRoot, "**", "*.vue");
        const vueFiles = globSync.sync(vuePattern, {
          ignore: path.join(projectRoot, "node_modules", "**"),
        });

        if (vueFiles.length > 0) {
          logger.debug("Detected Vue framework");
          return Framework.VUE;
        }
      } catch (error) {
        logger.debug(`Error checking for Vue files: ${error}`);
      }
    }

    logger.debug("Could not detect framework, marking as unknown");
    return Framework.UNKNOWN;
  }

  /**
   * Check if the project uses TypeScript
   */
  private static async hasTypeScript(
    projectRoot: string,
    packageJson: any
  ): Promise<boolean> {
    logger.debug("Checking for TypeScript");

    // Check for TypeScript in dependencies
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (dependencies.typescript) {
      logger.debug("TypeScript found in dependencies");

      // Check for TypeScript config file
      const hasTsConfig = await fs.pathExists(
        path.join(projectRoot, "tsconfig.json")
      );

      if (hasTsConfig) {
        logger.debug("tsconfig.json found");

        // Look for TS files to confirm TypeScript is used
        try {
          const tsPattern = path.join(projectRoot, "**", "*.ts");
          const tsxPattern = path.join(projectRoot, "**", "*.tsx");

          const tsFiles = globSync.sync(tsPattern, {
            ignore: path.join(projectRoot, "node_modules", "**"),
          });
          const tsxFiles = globSync.sync(tsxPattern, {
            ignore: path.join(projectRoot, "node_modules", "**"),
          });

          return tsFiles.length > 0 || tsxFiles.length > 0;
        } catch (error) {
          logger.debug(`Error checking for TypeScript files: ${error}`);
        }
      }
    }

    logger.debug("TypeScript not detected");
    return false;
  }

  /**
   * Find the source directory of the project
   */
  private static async findSrcDir(projectRoot: string): Promise<string> {
    logger.debug("Finding source directory");

    // Check for common source directories
    const commonSrcDirs = ["src", "app", "pages"];
    for (const dir of commonSrcDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (await fs.pathExists(dirPath)) {
        logger.debug(`Found source directory: ${dir}`);
        return dir;
      }
    }

    // Default to project root if no source directory found
    logger.debug("No specific source directory found, using project root");
    return ".";
  }

  /**
   * Check if Next.js version is 13 or later
   */
  private static async isNext13OrLater(packageJson: any): Promise<boolean> {
    logger.debug("Checking Next.js version");

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (dependencies.next) {
      const nextVersion = dependencies.next.replace(/[^0-9.]/g, "");
      const majorVersion = parseInt(nextVersion.split(".")[0], 10);
      logger.debug(`Next.js version detected: ${majorVersion}`);
      return majorVersion >= 13;
    }

    return false;
  }

  /**
   * Check if Next.js project uses the app router
   */
  private static async isAppRouter(projectRoot: string): Promise<boolean> {
    logger.debug("Checking for Next.js app router");

    const appDirPath = path.join(projectRoot, "app");
    const hasPagesDir = await fs.pathExists(path.join(projectRoot, "pages"));

    // The project uses app router if it has an app directory
    // and no pages directory, or if it has both
    const hasAppDir = await fs.pathExists(appDirPath);

    if (hasAppDir) {
      logger.debug("Found app directory, likely using app router");
      return true;
    }

    return false;
  }
}
