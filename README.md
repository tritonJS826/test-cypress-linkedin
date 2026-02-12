# LinkedIn Bot with Ollama Analysis

A simple Cypress bot that scrolls through LinkedIn company posts and analyzes content using local Ollama.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure Ollama is running locally with qwen2.5-coder:3b model:
   ```bash
   ollama pull qwen2.5-coder:3b
   ollama serve
   ```

## Running the Bot

### Interactive Mode
```bash
npm run cypress:open
```
Select `linkedin-analyzer.cy.js` test and run it.

### Headless Mode
```bash
npm run cypress:run
```

## What it does

1. Visits the IT Career Hub LinkedIn company page
2. Scrolls down every 5 seconds (6 times total)
3. Captures page content at each scroll
4. Sends content to local Ollama for analysis
5. Logs insights about topics, themes, and patterns

## Configuration

- **Scroll interval**: 5 seconds (configurable in `cypress/e2e/linkedin-analyzer.cy.js`)
- **Number of scrolls**: 6 (configurable)
- **Ollama model**: qwen2.5-coder:3b (configurable in `cypress.config.js`)
- **Content limit**: 2000 characters per analysis to avoid overwhelming the model

## Notes

- LinkedIn may show login prompts - the bot handles these automatically
- Content is limited to 2000 characters per analysis request
- Make sure Ollama is running on localhost:11434 before starting