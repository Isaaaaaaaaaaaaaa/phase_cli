#!/usr/bin/env node
import { EditorHost } from "../host/EditorHost.js";
import { CodeAssembly } from "../host/CodeAssembly.js";

const host = new EditorHost();
const args = process.argv.slice(2);
const configIndex = args.indexOf("--config");
if (configIndex >= 0) host.diagnostics.push(...await host.loader.config(args[configIndex + 1] ?? ""));
else if (!args.includes("--no-plugins")) new CodeAssembly().install(host);
for (const diagnostic of host.diagnostics) console.log(diagnostic);
host.application.run();
