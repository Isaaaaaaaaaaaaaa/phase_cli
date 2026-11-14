import type { ShapeFactory } from "../domain/ShapeFactory.js";
import type { SvgRepository } from "../application/ports/SvgRepository.js";
import type { HistoryManager } from "../application/HistoryManager.js";
import type { ExtensionRegistry } from "./ExtensionRegistry.js";
import type { DirectoryReader } from "../application/ports/DirectoryReader.js";

export interface PluginServices {
  readonly shapeFactory: ShapeFactory;
  readonly repository: SvgRepository;
  readonly history: HistoryManager;
  readonly extensions: ExtensionRegistry;
  readonly directory: DirectoryReader;
}
