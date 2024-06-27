describe('App', () => {
    beforeEach(() => {
      cy.visit('/') // Assuming your app is served at root URL
    })
  
    it('should display "You have no tasks" initially', () => {
      cy.contains('You have no tasks').should('be.visible')
    })
  
    it('should allow creating a new task', () => {
      cy.contains('New Task').click()
      cy.get('[placeholder="Task Title"]').type('Sample Task')
      cy.get('[placeholder="Task Summary"]').type('This is a sample task')
      cy.contains('Create Task').click()
      cy.contains('Sample Task').should('be.visible')
      cy.contains('This is a sample task').should('be.visible')
    })
  
    it('should allow deleting a task', () => {
      cy.contains('New Task').click()
      cy.get('[placeholder="Task Title"]').type('Task to delete')
      cy.get('[placeholder="Task Summary"]').type('This task will be deleted')
      cy.contains('Create Task').click()
      cy.contains('Task to delete')
        .parent()
        .find('[data-testid^="delete-task-"]')
        .click()
      cy.contains('Task to delete').should('not.exist')
    })
  
    // Add more tests as needed
  })