#!/usr/bin/env node

import { Command } from "commander";
import { InitCommand } from "./commands/init";
import { DoctorCommand } from "./commands/doctor";
import { UpdateCommand } from "./commands/update";
import { Logger } from "./utils/logger";

// Get package version from package.json
const { version } = require("../package.json");

// Initialize logger
const logger = Logger.getInstance();

/**
 * Main CLI entry point
 */
async function main() {
  // Create program
  const program = new Command();

  // Set program metadata
  program
    .name("solkit")
    .description(
      "CLI tool that automates the integration of Solana Appkit into web projects"
    )
    .version(version);

  // Register commands
  InitCommand.register(program);
  DoctorCommand.register(program);
  UpdateCommand.register(program);

  // Add global verbose option
  program.option("-v, --verbose", "Enable verbose output");

  // Parse arguments
  program.parse(process.argv);

  // Set verbose mode if requested
  const options = program.opts();
  logger.setVerbose(options.verbose || false);
}

// Start CLI
main().catch((error) => {
  logger.error("Unexpected error", error as Error);
  process.exit(1);
});
