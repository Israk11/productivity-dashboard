# SonarCloud MCP Setup Steps

## Prerequisites

* Angular project pushed to GitHub
* SonarCloud project configured and analyzing the repository
* Node.js and npm installed
* VS Code with GitHub Copilot enabled

---

## Step 1: Generate SonarCloud Token

1. Login to SonarCloud.
2. Navigate to:

   * My Account → Security
3. Generate a new token.
4. Copy and save the token securely.

---

## Step 2: Get Organization Key

1. Open SonarCloud.
2. Navigate to your Organization.
3. Copy the Organization Key.
4. Keep it available for MCP configuration.

---

## Step 3: Add MCP Server in VS Code

1. Open VS Code.
2. Press `Ctrl + Shift + P`.
3. Run:

```text
MCP: Add Server
```

4. When prompted for the command, enter:

```text
npx -y sonarqube-mcp-server@latest
```

5. Choose:

```text
Workspace
```

6. VS Code creates:

```text
.vscode/mcp.json
```

---

## Step 4: Configure MCP Server

Update `.vscode/mcp.json`:

```json
{
  "servers": {
    "sonarqube": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "sonarqube-mcp-server@latest"
      ],
      "env": {
        "SONARQUBE_URL": "https://sonarcloud.io",
        "SONARQUBE_TOKEN": "<YOUR_TOKEN>",
        "SONARQUBE_ORGANIZATION": "<YOUR_ORGANIZATION_KEY>"
      }
    }
  },
  "inputs": []
}
```

---

## Step 5: Reload VS Code

1. Press `Ctrl + Shift + P`.
2. Run:

```text
Developer: Reload Window
```

---

## Step 6: Verify MCP Server Startup

Open:

```text
View → Output
```

Verify messages similar to:

```text
Connection state: Running
Discovered 28 tools
```

This confirms the MCP server started successfully.

---

## Step 7: Verify SonarCloud Connectivity

Open GitHub Copilot Chat and run:

```text
List my SonarCloud projects for organization <organization-key>
```

Expected result:

* Project list is returned successfully.

---

## Step 8: Verify Issue Retrieval

Run prompts such as:

```text
Show all open SonarCloud issues for my project.
```

```text
Show quality gate status for my project.
```

```text
Analyze SonarCloud issues and prioritize them by severity.
```

Expected result:

* MCP retrieves live data directly from SonarCloud.

---

## Step 9: Create Agent Instructions

Create:

```text
.github/instructions/sonar-review-agent.md
```

Define:

* Issue categorization
* Priority rules
* Report generation
* Auto-fix candidate identification
* Remediation planning

---

## Step 10: Execute the Sonar Review Agent

Prompt:

```text
Read and follow .github/instructions/sonar-review-agent.md.

Retrieve all SonarCloud issues using MCP.

Generate:
- reports/sonar-issues.csv
- reports/remediation-plan.md
- reports/sonar-summary.json

Do not modify source code.
```

---

## Result

```text
SonarCloud
    ↓
SonarQube MCP Server
    ↓
GitHub Copilot Agent
    ↓
Issue Analysis
    ↓
Reports & Remediation Plan
```

The agent can now retrieve live SonarCloud data, generate reports, prioritize issues, and recommend fixes directly from VS Code.
