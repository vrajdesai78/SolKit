/**
 * Supported project frameworks
 */
export enum Framework {
  REACT = "react",
  NEXTJS = "nextjs",
  VUE = "vue",
  UNKNOWN = "unknown",
}

/**
 * Package managers supported by the CLI
 */
export enum PackageManager {
  NPM = "npm",
  YARN = "yarn",
  PNPM = "pnpm",
}

/**
 * Project detection result
 */
export interface ProjectInfo {
  framework: Framework;
  packageManager: PackageManager;
  hasTypeScript: boolean;
  projectRoot: string;
  srcDir: string;
  packageJson: any;
  isNext13OrLater: boolean;
  isAppRouter: boolean;
  // Metadata properties for templating
  name?: string;
  description?: string;
  url?: string;
  icon?: string;
}

/**
 * Configuration options for Solana integration
 */
export interface SolanaConfig {
  network: "mainnet-beta" | "testnet" | "devnet" | "localnet";
  wallets: string[];
  features: {
    transactions: boolean;
    tokens: boolean;
    nfts: boolean;
  };
  // Reown AppKit configuration
  useAppKit?: boolean;
  projectId?: string;
  appKitConfig?: {
    themeMode?: "light" | "dark";
    analytics?: boolean;
    accentColor?: string;
    icon?: string;
    name?: string;
    description?: string;
    url?: string;
  };
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  message: string;
  error?: Error;
}

/**
 * Template rendering context
 */
export interface TemplateContext {
  projectInfo: ProjectInfo;
  solanaConfig: SolanaConfig;
  [key: string]: any;
}

/**
 * File to be generated
 */
export interface FileToGenerate {
  sourcePath: string;
  targetPath: string;
  context: TemplateContext;
}

/**
 * Dependency information
 */
export interface Dependency {
  name: string;
  version: string;
  isDev?: boolean;
}

/**
 * Error codes for structured error handling
 */
export enum ErrorCode {
  UNSUPPORTED_FRAMEWORK = "UNSUPPORTED_FRAMEWORK",
  DETECTION_FAILED = "DETECTION_FAILED",
  DEPENDENCY_INSTALLATION_FAILED = "DEPENDENCY_INSTALLATION_FAILED",
  FILE_GENERATION_FAILED = "FILE_GENERATION_FAILED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  CONFIG_CREATION_FAILED = "CONFIG_CREATION_FAILED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
