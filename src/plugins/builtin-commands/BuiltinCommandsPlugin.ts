import { AddToCommand } from "./AddToCommand.js";
import { BackCommand } from "./BackCommand.js";
import { CanvasCommand } from "./CanvasCommand.js";
import { CreateCommand } from "./CreateCommand.js";
import { DeleteCommand } from "./DeleteCommand.js";
import { FrontCommand } from "./FrontCommand.js";
import { GroupCommand } from "./GroupCommand.js";
import { HelpCommand } from "./HelpCommand.js";
import { InitCommand } from "./InitCommand.js";
import { MoveCommand } from "./MoveCommand.js";
import { ReadCommand } from "./ReadCommand.js";
import { RedoCommand } from "./RedoCommand.js";
import { SaveCommand } from "./SaveCommand.js";
import { ScaleCommand } from "./ScaleCommand.js";
import { SetCommand } from "./SetCommand.js";
import { ShowCommand } from "./ShowCommand.js";
import { TreeCommand } from "./TreeCommand.js";
import { UndoCommand } from "./UndoCommand.js";
import { UngroupCommand } from "./UngroupCommand.js";
import { CommandDefinition } from "./CommandDefinition.js";
import { ShapeRenderer, TreeRenderer, EditorError,
  type CommandToken, type EditorCommand, type Plugin,
  type PluginContext, type PluginServices } from "../../api.js";

type CommandBuilder = (tokens: readonly CommandToken[]) => EditorCommand;

export default class BuiltinCommandsPlugin implements Plugin {
  private readonly treeRenderer: TreeRenderer;
  private readonly shapeRenderer = new ShapeRenderer();
  private readonly builders = new Map<string, CommandBuilder>([
    ["init", (tokens) => this.init(tokens)],
    ["read", (tokens) => this.read(tokens)],
    ["save", (tokens) => this.save(tokens)],
    ["canvas", (tokens) => this.canvas(tokens)],
    ["create", (tokens) => this.createShape(tokens)],
    ["delete", (tokens) => this.delete(tokens)],
    ["move", (tokens) => this.move(tokens)],
    ["scale", (tokens) => this.scale(tokens)],
    ["set", (tokens) => this.set(tokens)],
    ["group", (tokens) => this.group(tokens)],
    ["ungroup", (tokens) => this.ungroup(tokens)],
    ["addto", (tokens) => this.addTo(tokens)],
    ["front", (tokens) => this.front(tokens)],
    ["back", (tokens) => this.back(tokens)],
    ["tree", (tokens) => this.tree(tokens)],
    ["show", (tokens) => this.show(tokens)],
    ["help", (tokens) => this.help(tokens)],
    ["undo", (tokens) => this.undo(tokens)],
    ["redo", (tokens) => this.redo(tokens)],
  ]);

  public constructor(private readonly services: PluginServices) {
    this.treeRenderer = new TreeRenderer(services.extensions);
  }
  public activate(context: PluginContext): void {
    const specifications = [
      ["init", "init [w] [h]", "Document"],
      ["read", "read <file.svg>", "Document"],
      ["save", "save [file.svg]", "Document"],
      ["canvas", "canvas [w] [h]", "Document"],
      ["create", "create <type> <id> [params...] [in <containerId>]", "Edit"],
      ["delete", "delete <id>", "Edit"],
      ["move", "move <id> <dx> <dy>", "Edit"],
      ["scale", "scale <id> <factor>", "Edit"],
      ["set", "set <id> <attr> <value>", "Edit"],
      ["group", "group <newGid> <id1> <id2>...", "Edit"],
      ["ungroup", "ungroup <gid>", "Edit"],
      ["addto", "addto <gid> <id>", "Edit"],
      ["front", "front <id>", "Edit"],
      ["back", "back <id>", "Edit"],
      ["tree", "tree [id]", "Display"],
      ["show", "show <id>", "Display"],
      ["help", "help", "Display"],
      ["undo", "undo", "History"],
      ["redo", "redo", "History"],
    ] as const;
    for (const [name, usage, section] of specifications) {
      const builder = this.builders.get(name);
      if (builder) context.registerCommand(new CommandDefinition(name, usage, section, builder));
    }
  }

  private init(tokens: readonly CommandToken[]): EditorCommand {
    if (tokens.length === 0) {
      return new InitCommand(800, 600);
    }
    this.arity("init [w] [h]", tokens, 2, 2);
    return new InitCommand(
      this.number(tokens[0], "width"),
      this.number(tokens[1], "height"),
    );
  }

  private read(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("read <file.svg>", tokens, 1, 1);
    return new ReadCommand(this.services.repository, tokens[0]?.value ?? "");
  }

  private save(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("save [file.svg]", tokens, 0, 1);
    return new SaveCommand(this.services.repository, tokens[0]?.value);
  }

  private canvas(tokens: readonly CommandToken[]): EditorCommand {
    if (tokens.length === 0) {
      return new CanvasCommand();
    }
    this.arity("canvas [w] [h]", tokens, 2, 2);
    return new CanvasCommand(
      this.number(tokens[0], "width"),
      this.number(tokens[1], "height"),
    );
  }

  private createShape(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("create <type> <id> [params...] [in <containerId>]", tokens, 2);
    const type = tokens[0]?.value ?? "";
    const id = tokens[1]?.value ?? "";
    let argumentTokens = tokens.slice(2);
    let parentId: string | undefined;
    const inToken = argumentTokens.at(-2);
    if (inToken?.value === "in" && !inToken.quoted) {
      parentId = argumentTokens.at(-1)?.value;
      argumentTokens = argumentTokens.slice(0, -2);
    }
    if (
      type === "text" &&
      (argumentTokens.length < 3 || !argumentTokens[2]?.quoted)
    ) {
      throw new EditorError('usage: create text <id> <x> <y> "content"');
    }
    return new CreateCommand(
      this.services.shapeFactory,
      type,
      id,
      argumentTokens.map((token) => token.value),
      parentId,
    );
  }

  private delete(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("delete <id>", tokens, 1, 1);
    return new DeleteCommand(tokens[0]?.value ?? "");
  }

  private move(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("move <id> <dx> <dy>", tokens, 3, 3);
    return new MoveCommand(
      tokens[0]?.value ?? "",
      this.number(tokens[1], "dx"),
      this.number(tokens[2], "dy"),
    );
  }

  private scale(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("scale <id> <factor>", tokens, 2, 2);
    return new ScaleCommand(
      tokens[0]?.value ?? "",
      this.number(tokens[1], "factor"),
    );
  }

  private set(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("set <id> <attr> <value>", tokens, 3, 3);
    return new SetCommand(
      tokens[0]?.value ?? "",
      tokens[1]?.value ?? "",
      tokens[2]?.value ?? "",
      this.services.extensions,
    );
  }

  private group(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("group <newGid> <id1> <id2>...", tokens, 2);
    return new GroupCommand(
      tokens[0]?.value ?? "",
      tokens.slice(1).map((token) => token.value),
    );
  }

  private ungroup(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("ungroup <gid>", tokens, 1, 1);
    return new UngroupCommand(tokens[0]?.value ?? "");
  }

  private addTo(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("addto <gid> <id>", tokens, 2, 2);
    return new AddToCommand(
      tokens[0]?.value ?? "",
      tokens[1]?.value ?? "",
    );
  }

  private front(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("front <id>", tokens, 1, 1);
    return new FrontCommand(tokens[0]?.value ?? "");
  }

  private back(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("back <id>", tokens, 1, 1);
    return new BackCommand(tokens[0]?.value ?? "");
  }

  private tree(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("tree [id]", tokens, 0, 1);
    return new TreeCommand(this.treeRenderer, tokens[0]?.value);
  }

  private show(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("show <id>", tokens, 1, 1);
    return new ShowCommand(
      this.shapeRenderer,
      tokens[0]?.value ?? "",
    );
  }

  private help(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("help", tokens, 0, 0);
    return new HelpCommand(this.services.extensions);
  }

  private undo(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("undo", tokens, 0, 0);
    return new UndoCommand(this.services.history);
  }

  private redo(tokens: readonly CommandToken[]): EditorCommand {
    this.arity("redo", tokens, 0, 0);
    return new RedoCommand(this.services.history);
  }

  private number(token: CommandToken | undefined, name: string): number {
    const value = Number(token?.value);
    if (token === undefined || !Number.isFinite(value)) {
      throw new EditorError(`invalid number for ${name}: ${token?.value ?? ""}`);
    }
    return value;
  }

  private arity(
    usage: string,
    tokens: readonly CommandToken[],
    minimum: number,
    maximum = Number.POSITIVE_INFINITY,
  ): void {
    if (tokens.length < minimum || tokens.length > maximum) {
      throw new EditorError(`usage: ${usage}`);
    }
  }
}
