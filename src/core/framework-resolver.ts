import { Framework, ProjectInfo } from "../types";
import { Logger } from "../utils/logger";
import { ReactFramework } from "../frameworks/react";
import { NextjsFramework } from "../frameworks/nextjs";
import { VueFramework } from "../frameworks/vue";

const logger = Logger.getInstance();

/**
 * Framework resolver for Solana integration
 */
export class FrameworkResolver {
  /**
   * Get the appropriate framework integration module based on detected framework
   */
  public static getFrameworkModule(projectInfo: ProjectInfo): any {
    logger.debug(`Resolving framework module for ${projectInfo.framework}`);

    switch (projectInfo.framework) {
      case Framework.REACT:
        return ReactFramework;

      case Framework.NEXTJS:
        return NextjsFramework;

      case Framework.VUE:
        return VueFramework;

      case Framework.UNKNOWN:
        throw new Error("Unknown framework. Cannot proceed with integration.");

      default:
        const frameworkType: never = projectInfo.framework;
        throw new Error(`Unsupported framework: ${frameworkType}`);
    }
  }

  /**
   * Get a list of supported frameworks
   */
  public static getSupportedFrameworks(): string[] {
    return [Framework.REACT, Framework.NEXTJS, Framework.VUE];
  }

  /**
   * Check if a framework is supported
   */
  public static isFrameworkSupported(framework: string): boolean {
    return this.getSupportedFrameworks().includes(framework as Framework);
  }
}
