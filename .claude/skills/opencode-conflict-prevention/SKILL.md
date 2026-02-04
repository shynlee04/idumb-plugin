---
name: opencode-conflict-prevention
description: OpenCode plugin conflict prevention - loading order, deduplication rules, naming conventions, and troubleshooting. Use when publishing plugins or diagnosing plugin conflicts.
license: MIT
compatibility: opencode
metadata:
  audience: ai-agents
  workflow: plugin-development
---

# OpenCode Conflict Prevention

Guidelines for avoiding plugin conflicts when developing and publishing OpenCode plugins.

## Plugin Loading Priority

### Load Order (Lowest to Highest Priority)

OpenCode loads plugins in this order. **Later sources override earlier ones**:

| Priority | Source | Location |
|----------|--------|----------|
| 1 (lowest) | Internal plugins | Built-in to OpenCode |
| 2 | Built-in npm plugins | `opencode-anthropic-auth`, `@gitlab/opencode-gitlab-auth` |
| 3 | Global config | `~/.config/opencode/opencode.json` |
| 4 | Project config | `<project>/opencode.json` |
| 5 | Global plugin directory | `~/.config/opencode/plugins/` |
| 6 (highest) | Project plugin directory | `<project>/.opencode/plugins/` |

### Key Implications

```typescript
// If you have the same plugin in multiple locations:
// ~/.config/opencode/plugins/my-plugin.ts
// .opencode/plugins/my-plugin.ts

// The .opencode/plugins/ version WINS (higher priority)
```

```
Priority Rule: Local > Project > Global > npm > Internal
```

---

## Deduplication Mechanism

### How Deduplication Works

OpenCode implements a deduplication system where plugins with the **same name** from different sources are deduplicated. **Higher priority sources win**.

```typescript
// Deduplication algorithm (for reference)
export function deduplicatePlugins(plugins: string[]): string[] {
  const seenNames = new Set<string>()
  const uniqueSpecifiers = new Set<string>()

  // Process in reverse (high to low priority)
  for (const plugin of plugins.toReversed()) {
    const name = extractPluginName(plugin)

    if (!seenNames.has(name)) {
      seenNames.add(name)
      uniqueSpecifiers.add(plugin)
    }
    // Skip if already seen (lower priority duplicate)
  }

  return Array.from(uniqueSpecifiers).toReversed()
}
```

### What Gets Deduplicated

Plugins are considered the same if they have the **same package name**:

```typescript
// These are treated as duplicates - SAME NAME
"my-plugin"                    // npm package
"@scope/my-plugin"             // scoped npm package
"file:///path/to/my-plugin"    // local file

// The one with HIGHEST PRIORITY wins
```

### Priority Hierarchy

```
.opencode/plugins/       (highest - overrides everything)
  ↓
opencode.json (project)  (overrides global)
  ↓
~/.config/opencode/opencode.json (global)
  ↓
~/.config/opencode/plugins/ (global directory)
  ↓
npm packages             (lowest - gets overridden)
```

---

## Naming Conventions

### Avoiding Name Conflicts

When publishing a plugin to npm, use a **scoped package name** to minimize conflicts:

```bash
# GOOD - Scoped, unique
@yourcompany/opencode-plugin-name
@yourusername/opencode-feature

# RISKY - Common names, likely to conflict
opencode-utils
opencode-helper
opencode-enhancer

# GOOD - Specific, descriptive
opencode-typecheck-integration
opencode-docker-command-runner
```

### Plugin Naming Best Practices

1. **Use a scope** - `@username/plugin-name` or `@company/plugin-name`
2. **Be descriptive** - `opencode-my-feature` not `my-plugin`
3. **Avoid common prefixes** - Don't use `utils`, `helpers`, `core`
4. **Include "opencode"** - Helps users identify the plugin

### Tool Naming

Custom tools within plugins should also follow naming conventions:

```typescript
// GOOD - plugin-prefixed tools
myplugin: tool({
  myplugin_analyze: tool({ /* ... */ }),
  myplugin_transform: tool({ /* ... */ }),
})

// BAD - generic tool names (may conflict)
analyze: tool({ /* ... */ }),
helper: tool({ /* ... */ }),
```

---

## Common Conflict Scenarios

### Scenario 1: Local vs npm Plugin

**Problem**: User installs your npm plugin, but also has a local version.

```typescript
// npm package: @company/opencode-feature
// Local file: .opencode/plugins/opencode-feature.ts

// Result: Local file WINS, npm package is ignored
```

**Solution**: Document this behavior and advise users to uninstall the local version.

### Scenario 2: Duplicate Plugin Names

**Problem**: Two plugins have the same name.

```json
// ~/.config/opencode/opencode.json
{
  "plugin": ["opencode-enhancer", "my-plugin"]
}

// opencode.json (project)
{
  "plugin": ["opencode-enhancer-v2", "my-plugin"]
}
```

**Result**: The project config's `opencode-enhancer-v2` loads, but if there's a naming conflict, only one wins.

**Solution**: Use unique, descriptive names with scopes.

### Scenario 3: Hook Conflicts

**Problem**: Multiple plugins implement the same hook with conflicting behavior.

```typescript
// Plugin A
"tool.execute.before": async (input, output) => {
  // Allows operation
}

// Plugin B
"tool.execute.before": async (input, output) => {
  // Blocks operation
}
```

**Result**: Both hooks run. Order is undefined. If one throws, execution stops.

**Solution**: Document hook behavior and use graceful degradation.

---

## Troubleshooting Conflicts

### Checklist for Diagnosing Issues

```bash
# 1. Check which plugins are loaded
opencode status

# 2. View plugin status in TUI
/status_view

# 3. Check for duplicate plugin names
ls -la ~/.config/opencode/plugins/
ls -la .opencode/plugins/

# 4. Review config files
cat ~/.config/opencode/opencode.json
cat opencode.json
```

### Disable Plugins Temporarily

To isolate conflicts, disable plugins in your config:

```json
// ~/.config/opencode/opencode.json
{
  "plugin": []  // Empty array = no plugins
}
```

Then add plugins back one by one to identify the culprit.

### Clear Cache

If plugins cause crashes or strange behavior:

```bash
# Clear OpenCode cache
rm -rf ~/.cache/opencode

# Restart OpenCode
opencode
```

### Check Plugin Load Order

```typescript
// Add temporary logging to see load order
export const MyPlugin: Plugin = async (ctx) => {
  await ctx.client.app.log({
    service: "my-plugin",
    level: "info",
    message: "Plugin loaded",
    extra: { priority: "should be high" },
  })
  // ...
}
```

---

## Publishing Guidelines

### Before Publishing

1. **Check for name conflicts**
   ```bash
   npm search opencode-your-name
   ```

2. **Test in clean environment**
   ```bash
   # Test without other plugins
   opencode --plugin ./your-plugin.ts
   ```

3. **Document compatibility**
   ```markdown
   ## Compatibility
   - Conflicts with: (list known conflicts)
   - Tested with: (list tested plugins)
   ```

### Package.json Recommendations

```json
{
  "name": "@yourcompany/opencode-your-feature",
  "version": "1.0.0",
  "description": "OpenCode plugin for...",
  "keywords": ["opencode", "opencode-plugin", "your-feature"],
  "peerDependencies": {
    "opencode": ">=1.0.0"
  },
  "opencode": {
    "type": "plugin",
    "hooks": ["event", "tool.execute.after"],
    "tools": ["yourtool_*"]
  }
}
```

---

## Best Practices

### ✅ Do

```typescript
// Use scoped package names
@company/opencode-feature

// Prefix custom tools
myfeature_analyze
myfeature_transform

// Document hook behavior
"tool.execute.before": async (input, output) => {
  try {
    // Your logic
  } catch (error) {
    // Log but don't throw - let other plugins run
  }
}

// Handle conflicts gracefully
if (input.tool === "read" && alreadyProcessed(input)) {
  return  // Skip if another plugin handled it
}
```

### ❌ Don't

```typescript
// Don't use common names
utils
helpers
core

// Don't throw in shared hooks
"tool.execute.before": async (input, output) => {
  throw new Error("I don't like this tool")  // Blocks ALL plugins
}

// Don't assume load order
// Don't assume your plugin is the only one running

// Don't override built-in tools (you can't anyway)
```

---

## Resources

See [opencode-plugin-compliance](../opencode-plugin-compliance/) for hook system details.

See [opencode-tui-safety](../opencode-tui-safety/) for TUI-related guidelines.

See [opencode-tool-compliance](../opencode-tool-compliance/) for tool development patterns.
