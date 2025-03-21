import chalk from "chalk";

/**
 * Logger utility for consistent CLI feedback
 */
export class Logger {
  private static instance: Logger;
  private verbose: boolean = false;

  private constructor() {}

  /**
   * Get the logger instance (singleton)
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set verbose mode
   */
  public setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  /**
   * Log an informational message
   */
  public info(message: string): void {
    console.log(chalk.blue("ℹ ") + message);
  }

  /**
   * Log a success message
   */
  public success(message: string): void {
    console.log(chalk.green("✓ ") + message);
  }

  /**
   * Log a warning message
   */
  public warn(message: string): void {
    console.log(chalk.yellow("⚠ ") + message);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error): void {
    console.error(chalk.red("✖ ") + message);
    if (error && this.verbose) {
      console.error(chalk.red(error.stack || error.message));
    }
  }

  /**
   * Log a debug message (only in verbose mode)
   */
  public debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray("🔍 ") + message);
    }
  }

  /**
   * Log a title (section header)
   */
  public title(message: string): void {
    console.log("\n" + chalk.bold.cyan(message));
    console.log(chalk.cyan("=".repeat(message.length)) + "\n");
  }

  /**
   * Log a step in a process
   */
  public step(stepNumber: number, message: string): void {
    console.log(chalk.cyan(`Step ${stepNumber}: `) + message);
  }
}
