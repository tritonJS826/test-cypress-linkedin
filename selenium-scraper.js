const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('./config');

async function analyzeWithOllama(content) {
  const prompt = config.ollamaPrompt.replace('{content}', content);
  
  try {
    const response = await axios.post(config.ollamaEndpoint, {
      model: config.model,
      prompt: prompt,
      stream: false
    });
    return response.data.response;
  } catch (error) {
    console.error('Ollama API error:', error.message);
    return 'Analysis failed: Unable to connect to Ollama';
  }
}

async function scrollAndExtract(driver) {
  let allPosts = [];
  
  const postSelectors = [
    '.feed-shared-text',
    '[data-test="feed-shared-text"]',
    '[data-test="feed-shared-update-v2"]',
    '.feed-shared-update-v2',
    '.occludable-update',
    '.feed-shared-text__text'
  ];
  
  for (const selector of postSelectors) {
    try {
      const elements = await driver.findElements(By.css(selector));
      for (const el of elements) {
        const text = await el.getText();
        if (text && text.length > 100 && !allPosts.includes(text)) {
          allPosts.push(text.trim());
        }
      }
    } catch (e) {
      // Selector might not exist, continue
    }
  }
  
  return allPosts;
}

async function savePosts(posts, scrollNum) {
  const header = `=== Scroll ${scrollNum} ===\n`;
  const content = posts.length > 0 
    ? posts.map((p, i) => `Post ${i + 1}:\n${p.substring(0, 1500)}${p.length > 1500 ? '...' : ''}\n`).join('\n')
    : 'No posts found on this scroll\n';
  
  fs.appendFileSync(config.outputFile, header + content + '\n\n', 'utf8');
  console.log(`Scroll ${scrollNum}: Found ${posts.length} posts`);
}

async function saveVisibleContent(driver, scrollNum) {
  try {
    const body = await driver.findElement(By.tagName('body'));
    const text = await body.getText();
    const cleaned = text.replace(/\s+/g, ' ').trim().substring(0, 3000);
    
    fs.appendFileSync(config.outputFile, `=== Scroll ${scrollNum} ===\nPage content:\n${cleaned}\n\n\n`, 'utf8');
    console.log(`Scroll ${scrollNum}: Saved visible content (${cleaned.length} chars)`);
  } catch (e) {
    console.error(`Error saving content for scroll ${scrollNum}:`, e.message);
  }
}

function getChromeOptions() {
  const options = new chrome.Options();
  
  options.addArguments(
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--window-size=1920,1080',
    '--start-maximized',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-popup-blocking',
    '--ignore-certificate-errors',
    '--disable-infobars'
  );
  
  // Set stealth user agent
  options.setUserPreferences({
    'profile.default_content_setting_values.notifications': 2,
    'profile.managed_default_content_settings.images': 2,
    'profile.default_content_settings.cookies': 1,
    'profile.block_third_party_cookies': false
  });
  
  return options;
}

async function run() {
  console.log('Starting LinkedIn scraper with Selenium...');
  console.log('Target URL:', config.linkedinUrl);
  
  const options = getChromeOptions();
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  // Override webdriver property to appear more human
  await driver.executeScript('Object.defineProperty(navigator, "webdriver", {get: () => undefined});');
  await driver.executeScript('Object.defineProperty(navigator, "plugins", {get: () => [1, 2, 3, 4, 5]});');
  await driver.executeScript('Object.defineProperty(navigator, "languages", {get: () => ["en-US", "en"]});');
  
  try {
    await driver.get(config.linkedinUrl);
    console.log('Page loaded, waiting for content...');
    await driver.sleep(5000);
    
    // Check if we hit a bot detection page
    const pageTitle = await driver.getTitle();
    console.log('Page title:', pageTitle);
    
    if (pageTitle.includes('Sorry') || pageTitle.includes('Verify') || pageTitle.includes('captcha')) {
      console.log('⚠️  Bot detection triggered! Please solve the CAPTCHA manually.');
      console.log('You have 10 minutes to solve it. Press Enter when done, or wait for timeout...');
      
      const timeoutMs = 10 * 60 * 1000;
      const startTime = Date.now();
      
      const waitForInput = () => new Promise(resolve => {
        const onData = () => {
          process.stdin.off('data', onData);
          resolve(true);
        };
        process.stdin.on('data', onData);
      });
      
      const checkTimeout = () => new Promise(resolve => {
        setTimeout(() => resolve(false), timeoutMs);
      });
      
      const userPressedEnter = await Promise.race([waitForInput(), checkTimeout()]);
      
      if (!userPressedEnter) {
        console.log('⏰ Timeout reached (10 minutes). Continuing anyway...');
      } else {
        console.log('Continuing...');
      }
    }
    
    fs.writeFileSync(config.outputFile, 'LinkedIn Posts from IT Career Hub\n==============================\n\n', 'utf8');
    
    for (let i = 0; i < config.scrollCount; i++) {
      console.log(`\n--- Scroll ${i + 1}/${config.scrollCount} ---`);
      
      const posts = await scrollAndExtract(driver);
      
      if (posts.length > 0) {
        await savePosts(posts, i + 1);
        
        const contentForAnalysis = posts.join('\n\n').substring(0, 2000);
        const analysis = await analyzeWithOllama(contentForAnalysis);
        console.log(`Analysis: ${analysis}`);
        
        fs.appendFileSync(config.outputFile, `Analysis: ${analysis}\n\n`, 'utf8');
      } else {
        await saveVisibleContent(driver, i + 1);
      }
      
      await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
      await driver.sleep(config.scrollInterval);
    }
    
    console.log('\n=== Scraper completed ===');
    console.log(`Posts saved to: ${path.resolve(config.outputFile)}`);
    
  } catch (error) {
    console.error('Error during scraping:', error.message);
  } finally {
    await driver.quit();
  }
}

run();
