import * as fs from "fs-extra";
import * as path from "path";
import { FileToGenerate, TemplateContext } from "../types";
import { Logger } from "../utils/logger";

const logger = Logger.getInstance();

/**
 * Template engine for generating files from templates
 */
export class TemplateEngine {
  private static TEMPLATE_PLACEHOLDER_REGEX = /\{\{(.*?)\}\}/g;

  /**
   * Generate files from templates
   */
  public static async generateFiles(
    filesToGenerate: FileToGenerate[]
  ): Promise<void> {
    logger.info(`Generating ${filesToGenerate.length} files...`);

    for (const file of filesToGenerate) {
      await this.generateFile(file.sourcePath, file.targetPath, file.context);
    }

    logger.success("File generation complete");
  }

  /**
   * Generate a single file from a template
   */
  private static async generateFile(
    sourcePath: string,
    targetPath: string,
    context: TemplateContext
  ): Promise<void> {
    try {
      // Make sure source file exists
      if (!(await fs.pathExists(sourcePath))) {
        logger.error(`Template file ${sourcePath} does not exist`);
        throw new Error(`Template file ${sourcePath} does not exist`);
      }

      // Create directory if it doesn't exist
      const targetDir = path.dirname(targetPath);
      await fs.ensureDir(targetDir);

      // Read the template
      const templateContent = await fs.readFile(sourcePath, "utf-8");

      // Process the template
      const processedContent = this.processTemplate(templateContent, context);

      // Write the file
      await fs.writeFile(targetPath, processedContent);

      logger.debug(`Generated file: ${targetPath}`);
    } catch (error) {
      logger.error(`Failed to generate file: ${targetPath}`, error as Error);
      throw error;
    }
  }

  /**
   * Process a template by replacing placeholders with values from the context
   */
  public static processTemplate(
    templateContent: string,
    context: TemplateContext
  ): string {
    return templateContent.replace(
      this.TEMPLATE_PLACEHOLDER_REGEX,
      (match, placeholder) => {
        const trimmedPlaceholder = placeholder.trim();
        const value = this.getValueFromContext(trimmedPlaceholder, context);

        return value !== undefined ? value : match;
      }
    );
  }

  /**
   * Process filename templates by replacing placeholders with values
   */
  public static processFileName(
    fileName: string,
    context: TemplateContext
  ): string {
    return fileName.replace(
      this.TEMPLATE_PLACEHOLDER_REGEX,
      (match, placeholder) => {
        const trimmedPlaceholder = placeholder.trim();
        const value = this.getValueFromContext(trimmedPlaceholder, context);

        return value !== undefined ? value : match;
      }
    );
  }

  /**
   * Get a value from the context using dot notation
   */
  private static getValueFromContext(
    path: string,
    context: TemplateContext
  ): string | undefined {
    const parts = path.split(".");
    let value: any = context;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }

      value = value[part];
    }

    return value !== undefined ? String(value) : undefined;
  }

  /**
   * Copy a directory recursively, processing templates
   */
  public static async copyTemplateDirectory(
    sourceDir: string,
    targetDir: string,
    context: TemplateContext
  ): Promise<void> {
    try {
      // Make sure source directory exists
      if (!(await fs.pathExists(sourceDir))) {
        logger.error(`Template directory ${sourceDir} does not exist`);
        throw new Error(`Template directory ${sourceDir} does not exist`);
      }

      // Create target directory if it doesn't exist
      await fs.ensureDir(targetDir);

      // Read all files and directories in the source directory
      const entries = await fs.readdir(sourceDir);

      for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry);

        // Process placeholders in the file/directory name
        const processedEntryName = this.processFileName(entry, context);
        const targetPath = path.join(targetDir, processedEntryName);

        const stat = await fs.stat(sourcePath);

        if (stat.isDirectory()) {
          // Recursively copy directory
          await this.copyTemplateDirectory(sourcePath, targetPath, context);
        } else {
          // Process and copy file
          const content = await fs.readFile(sourcePath, "utf-8");
          const processedContent = this.processTemplate(content, context);
          await fs.writeFile(targetPath, processedContent);
          logger.debug(`Generated file: ${targetPath}`);
        }
      }
    } catch (error) {
      logger.error(
        `Failed to copy template directory: ${sourceDir} -> ${targetDir}`,
        error as Error
      );
      throw error;
    }
  }
}
