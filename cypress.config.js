const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.linkedin.com',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      on('task', {
        analyzeWithOllama(content) {
          const axios = require('axios');
          
          return axios.post('http://localhost:11434/api/generate', {
            model: 'qwen2.5-coder:3b',
            prompt: `Analyze this LinkedIn page content and provide insights:\n\n${content}\n\nPlease summarize the key topics, themes, and any notable patterns.`,
            stream: false
          })
          .then(response => response.data.response)
          .catch(error => {
            console.error('Ollama API error:', error);
            return 'Analysis failed: Unable to connect to Ollama';
          });
        },
        savePostsToFile({ posts, filename }) {
          const filePath = path.join(process.cwd(), filename);
          const content = posts.join('\n\n---\n\n');
          fs.writeFileSync(filePath, content, 'utf8');
          cy.log(`Saved ${posts.length} posts to ${filePath}`);
          return null;
        },
        appendPostToFile({ post, filename }) {
          const filePath = path.join(process.cwd(), filename);
          fs.appendFileSync(filePath, post + '\n\n---\n\n', 'utf8');
          return null;
        }
      });
    },
  },
});
