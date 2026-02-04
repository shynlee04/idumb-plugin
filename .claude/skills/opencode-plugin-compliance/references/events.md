# OpenCode Plugin Events Reference

Complete reference for all OpenCode events that plugins can subscribe to.

## Event Categories

### Command Events
- `command.executed` - Fired after a command is executed

### File Events
- `file.edited` - Fired when a file is edited
- `file.watcher.updated` - Fired when file system changes are detected

### Installation Events
- `installation.updated` - Fired when installation status changes

### LSP Events
- `lsp.client.diagnostics` - Fired when LSP diagnostics are available
- `lsp.updated` - Fired when LSP state changes

### Message Events
- `message.part.removed` - Fired when a message part is removed
- `message.part.updated` - Fired when a message part is updated
- `message.removed` - Fired when a message is removed
- `message.updated` - Fired when a message is updated

### Permission Events
- `permission.asked` - Fired when a permission is requested
- `permission.replied` - Fired when a permission response is received

### Server Events
- `server.connected` - Fired when server connection is established

### Session Events
- `session.created` - Fired when a new session is created
- `session.compacted` - Fired when a session is compacted
- `session.deleted` - Fired when a session is deleted
- `session.diff` - Fired when session diff is available
- `session.error` - Fired when a session error occurs
- `session.idle` - Fired when a session becomes idle (deprecated)
- `session.status` - Fired when session status changes
- `session.updated` - Fired when session is updated

### Todo Events
- `todo.updated` - Fired when todos are updated

### Tool Events
- `tool.execute.after` - Fired after a tool is executed
- `tool.execute.before` - Fired before a tool is executed

### TUI Events
- `tui.prompt.append` - Fired to append text to the prompt
- `tui.command.execute` - Fired to execute a TUI command
- `tui.toast.show` - Fired to show a toast notification

## Event Properties

Each event has different properties. Check the event type to access relevant data:

```typescript
event: async (input) => {
  const { event } = input
  switch (event.type) {
    case "session.created":
      console.log(event.properties.info) // Session info
      break
    case "tool.execute.before":
      console.log(event.properties.tool) // Tool name
      console.log(event.properties.sessionID) // Session ID
      break
    // ... etc
  }
}
```
