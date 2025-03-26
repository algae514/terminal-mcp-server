# Terminal MCP Server

This repository contains a Model Context Protocol (MCP) server implementation for terminal commands.

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/algae514/terminal-mcp-server.git
cd terminal-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Make the start script executable:
```bash
chmod +x start-server.sh
```

### Configuration

To use this server with Claude, you need to update your Claude configuration to include the terminal MCP server.

Update your Claude configuration file (typically located at `~/.config/claude/config.json` or similar) to include the following:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/directory1",
        "/path/to/directory2",
        "/path/to/directory3"
      ]
    },
    "terminal": {
      "command": "/path/to/terminal-mcp-server/start-server.sh",
      "args": []
    }
  }
}
```

Replace `/path/to/directory1`, `/path/to/directory2`, etc. with the directories you want to make accessible to Claude.

Replace `/path/to/terminal-mcp-server` with the actual path where you cloned this repository.

## Usage

Once configured, Claude can execute terminal commands in the specified directories through the terminal MCP server.

## Security Considerations

- To allow terminal to run a command in a directory you need to provide it locations in maven-tool.json file. a sample url is provided.
- Be cautious about the directories you expose to Claude, as it will have access to execute commands in these locations.
- Consider using a dedicated user with limited permissions for running the server.
- Review the commands executed by Claude to ensure they are safe and appropriate.

## License

[MIT License](LICENSE)
