/**
 * Re-export bridge — delegates all public APIs to the companion-core package.
 *
 * This file is a temporary bridge while yumema transitions from its own
 * src/core/ implementation to the @sixtdreamnight/companion-engine package.
 * Files outside src/core/ import from here via the package name.
 * Once the transition is complete this file and the remaining src/core/
 * files can be removed.
 */
export * from "@sixtdreamnight/companion-engine";
