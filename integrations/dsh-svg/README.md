# DSH SVG Workbench

Four real DeepSeek Harness tools: `svg_inspect`, `svg_edit`, `svg_history`, `svg_save`. Each agent owns isolated state. An edit batch is atomic and one history unit; inspect is read-only, save is the only file-writing tool. Files stay inside the configured workspace, including symlink resolution, and input SVG files are limited to 2 MiB.

From this directory run `npm ci && npm test`, then `npm pack`. Install the resulting tarball using `dsh plugin --profile web add /absolute/path/dsh-svg-workbench-0.2.0.tgz`, then restart `dsh web`. The package bundles the CLI's public editor facade and plugin implementations; users do not need the course source checkout at runtime.

Tested SDK target: Cordis 4.1.0 and DSH tools 0.2.2-rc.3. DSH is in developer preview; use the matching 0.2.2-rc.3 host. Runtime SDK helpers are bundled so installation does not depend on pnpm auto-installing peer dependencies. The plugin still registers through the host's actual `ctx.tools` service. `engines.dsh` is checked by current hosts.

Example agent request: “Create a two-node SVG flowchart with Chinese labels, move the second node down, inspect the tree, then save as flow.svg.” The model uses editing tools and explicitly saves the artifact. API credentials stay in the host's configuration.
