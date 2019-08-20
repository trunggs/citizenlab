describe('when logged out', () => {
  beforeEach(() => {
    cy.visit('/initiatives/cleaning-the-sidewalks-party');
    cy.wait(1000);
    cy.get('#e2e-initiative-show');
    cy.acceptCookies();
  });

  it('shows the page', () => {
    cy.get('#e2e-initiative-show');
  });

  it('shows the home page link with correct href', () => {
    cy.get('#e2e-home-page-link').should('have.attr', 'href').and('include', '/en-GB/');
  });

  it('shows the link to the initiatives overview page with correct href', () => {
    cy.get('#e2e-initiative-other-link').should('have.attr', 'href').and('include', '/en-GB/initiatives');
  });

  it('shows the initiative title', () => {
    cy.get('#e2e-initiative-title');
  });

  it('shows the initiative image', () => {
    cy.get('#e2e-initiative-image');
  });

  it('shows the initiative body', () => {
    cy.get('#e2e-initiative-description');
  });

  it('shows a link to author profile', () => {
    cy.get('#e2e-initiative-posted-by .e2e-author-link').click();
    cy.location('pathname').should('eq', '/en-GB/profile/casey-luettgen');
  });

  it('shows the comments correctly', () => {
    // Get parent comment
    cy.get('#e2e-parent-and-childcomments')
      .find('.e2e-parentcomment');

    // Get child comment
    cy.get('#e2e-parent-and-childcomments')
      .find('.e2e-childcomment');
  });

  it('shows the initiative content footer', () => {
    cy.get('#e2e-initiative-content-footer');
  });

});

describe('when logged in as an admin', () => {
  it('has the More Options menu and opens it', () => {
    cy.login('admin@citizenlab.co', 'testtest');
    cy.visit('/initiatives/cleaning-the-sidewalks-party');
    cy.wait(1000);
    cy.get('#e2e-initiative-more-actions').click();
    cy.get('#e2e-initiative-more-actions-menu');
  });
});
