// Custom commands for LinkedIn analysis

Cypress.Commands.add('scrollAndAnalyze', (scrollCount = 5, interval = 5000) => {
  let scrollIteration = 0;

  cy.writeFile('linkedin_posts.txt', 'LinkedIn Posts from IT Career Hub\n==============================\n\n');

  const scrollAndCapture = () => {
    if (scrollIteration < scrollCount) {
      cy.document().then((doc) => {
        // Check if logged in - look for post content
        const isLoggedIn = doc.querySelector('.feed-shared-text, [data-test="feed-shared-update-v2"]');

        let allText = [];

        if (isLoggedIn) {
          // Extract actual posts when logged in
          const postSelectors = [
            '.feed-shared-text',
            '[data-test="feed-shared-text"]',
            '[data-test="feed-shared-update-v2"]',
            '.feed-shared-update-v2',
            '.occludable-update',
            '.feed-shared-text__text'
          ];

          postSelectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent?.trim() || '';
              if (text.length > 100 && !allText.includes(text)) {
                allText.push(text);
              }
            });
          });
        }

        // Always capture visible text content (even if just headers/metadata)
        const bodyText = doc.body.textContent || '';
        const cleanedText = bodyText
          .replace(/\s+/g, ' ')
          .replace(/Sign in/g, '=== SIGN IN ===')
          .trim();

        if (allText.length === 0) {
          // Save what we can see on the page
          cy.writeFile('linkedin_posts.txt', `=== Scroll ${scrollIteration + 1} ===\nPage visible content:\n${cleanedText.substring(0, 3000)}\n\n`, { flag: 'a' });
        } else {
          allText.forEach((text, index) => {
            const truncated = text.length > 1500 ? text.substring(0, 1500) + '...' : text;
            cy.writeFile('linkedin_posts.txt', `=== Scroll ${scrollIteration + 1}, Post ${index + 1} ===\n${truncated}\n\n`, { flag: 'a' });
          });
        }

        cy.log(`Scroll ${scrollIteration + 1}: Found ${allText.length} posts`);

        cy.task('analyzeWithOllama', doc.body.textContent.substring(0, 2000)).then((analysis) => {
          cy.log(`Analysis ${scrollIteration + 1}: ${analysis}`);
        });
      });

      cy.scrollTo('bottom', { duration: 1000 });
      cy.wait(interval);

      scrollIteration++;
      scrollAndCapture();
    } else {
      cy.log('LinkedIn page analysis and post extraction complete');
    }
  };

  scrollAndCapture();
});
