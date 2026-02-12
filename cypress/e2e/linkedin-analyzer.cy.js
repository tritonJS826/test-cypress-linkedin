describe('LinkedIn Page Analyzer Bot', () => {
  it('Should scroll, extract and save IT Career Hub posts', () => {
    // Visit the LinkedIn company page
    cy.visit('/company/itcareerhub/posts/?feedView=all');
    
    // Wait for page to load
    cy.wait(5000);
    
    // Try to handle any login modal (optional)
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label*="Sign in"]').length > 0) {
        cy.log('Login modal present, continuing anyway...');
      }
    });
    
    // Wait a bit more for content to load
    cy.wait(3000);
    
    // Start scrolling, extracting and saving posts
    cy.scrollAndAnalyze(5, 5000); // 5 scrolls, 5 seconds apart
    
    // Final log
    cy.log('LinkedIn page analysis and post extraction complete');
  });
});