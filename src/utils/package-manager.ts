import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs-extra";
import * as path from "path";
import { PackageManager, Dependency } from "../types";
import { Logger } from "./logger";

const execAsync = promisify(exec);
const logger = Logger.getInstance();

/**
 * Utility class for package manager operations
 */
export class PackageManagerUtils {
  /**
   * Detect the package manager used in the project
   */
  public static async detectPackageManager(
    projectRoot: string
  ): Promise<PackageManager> {
    logger.debug(`Detecting package manager for project at ${projectRoot}`);

    // Check for lockfiles to determine package manager
    const hasYarnLock = await fs.pathExists(
      path.join(projectRoot, "yarn.lock")
    );
    if (hasYarnLock) {
      logger.debug("Found yarn.lock, using Yarn");
      return PackageManager.YARN;
    }

    const hasPnpmLock = await fs.pathExists(
      path.join(projectRoot, "pnpm-lock.yaml")
    );
    if (hasPnpmLock) {
      logger.debug("Found pnpm-lock.yaml, using PNPM");
      return PackageManager.PNPM;
    }

    const hasNpmLock = await fs.pathExists(
      path.join(projectRoot, "package-lock.json")
    );
    if (hasNpmLock) {
      logger.debug("Found package-lock.json, using NPM");
      return PackageManager.NPM;
    }

    // Default to npm if no lockfile found
    logger.debug("No lockfile found, defaulting to NPM");
    return PackageManager.NPM;
  }

  /**
   * Get the install command for the specified package manager
   */
  public static getInstallCommand(packageManager: PackageManager): string {
    switch (packageManager) {
      case PackageManager.YARN:
        return "yarn add";
      case PackageManager.PNPM:
        return "pnpm add";
      case PackageManager.NPM:
      default:
        return "npm install";
    }
  }

  /**
   * Get the dev install command for the specified package manager
   */
  public static getDevInstallCommand(packageManager: PackageManager): string {
    switch (packageManager) {
      case PackageManager.YARN:
        return "yarn add -D";
      case PackageManager.PNPM:
        return "pnpm add -D";
      case PackageManager.NPM:
      default:
        return "npm install --save-dev";
    }
  }

  /**
   * Install dependencies using the detected package manager
   */
  public static async installDependencies(
    dependencies: Dependency[],
    projectRoot: string,
    packageManager: PackageManager
  ): Promise<void> {
    const prodDeps = dependencies.filter((dep) => !dep.isDev);
    const devDeps = dependencies.filter((dep) => dep.isDev);

    if (prodDeps.length > 0) {
      const depsWithVersions = prodDeps.map(
        (dep) => `${dep.name}@${dep.version}`
      );
      const installCmd = `${this.getInstallCommand(
        packageManager
      )} ${depsWithVersions.join(" ")}`;

      logger.info(`Installing production dependencies...`);
      logger.debug(`Running command: ${installCmd}`);

      try {
        await execAsync(installCmd, { cwd: projectRoot });
        logger.success("Production dependencies installed successfully");
      } catch (error) {
        logger.error(
          "Failed to install production dependencies",
          error as Error
        );
        throw new Error("Dependency installation failed");
      }
    }

    if (devDeps.length > 0) {
      const depsWithVersions = devDeps.map(
        (dep) => `${dep.name}@${dep.version}`
      );
      const installCmd = `${this.getDevInstallCommand(
        packageManager
      )} ${depsWithVersions.join(" ")}`;

      logger.info(`Installing development dependencies...`);
      logger.debug(`Running command: ${installCmd}`);

      try {
        await execAsync(installCmd, { cwd: projectRoot });
        logger.success("Development dependencies installed successfully");
      } catch (error) {
        logger.error(
          "Failed to install development dependencies",
          error as Error
        );
        throw new Error("Dependency installation failed");
      }
    }
  }

  /**
   * Get the current project's package.json content
   */
  public static async getPackageJson(projectRoot: string): Promise<any> {
    const packageJsonPath = path.join(projectRoot, "package.json");

    try {
      return await fs.readJson(packageJsonPath);
    } catch (error) {
      logger.error("Failed to read package.json", error as Error);
      throw new Error("Could not read package.json");
    }
  }

  /**
   * Update the project's package.json content
   */
  public static async updatePackageJson(
    projectRoot: string,
    updates: any
  ): Promise<void> {
    const packageJsonPath = path.join(projectRoot, "package.json");

    try {
      const packageJson = await this.getPackageJson(projectRoot);
      const updatedPackageJson = { ...packageJson, ...updates };
      await fs.writeJson(packageJsonPath, updatedPackageJson, { spaces: 2 });
      logger.success("Updated package.json successfully");
    } catch (error) {
      logger.error("Failed to update package.json", error as Error);
      throw new Error("Could not update package.json");
    }
  }
}
