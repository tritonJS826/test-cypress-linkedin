module.exports = {
  linkedinUrl: 'https://www.linkedin.com/company/itcareerhub/posts/?feedView=all',
  ollamaPrompt: `Analyze this LinkedIn page content and provide insights:\n\n{content}\n\nPlease summarize the key topics, themes, and any notable patterns.`,
  ollamaEndpoint: 'http://localhost:11434/api/generate',
  model: 'qwen2.5-coder:3b',
  outputFile: 'output/linkedin_posts.txt',
  scrollCount: 5,
  scrollInterval: 5000
};
