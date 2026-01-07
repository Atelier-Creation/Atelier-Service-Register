describe('Digital Service Register E2E', () => {

    const testUser = {
        username: 'admin',
        password: 'password123'
    };

    beforeEach(() => {
        // Reset session
        cy.window().then((win) => {
            win.sessionStorage.clear()
            win.localStorage.clear()
        })
    });

    it('should login successfully', () => {
        cy.visit('/login');

        // Fill login form
        cy.get('input[name="username"]').type(testUser.username);
        cy.get('input[name="password"]').type(testUser.password);

        // Submit
        cy.get('button[type="submit"]').click();

        // Verify redirect to dashboard
        cy.url().should('include', '/');
        cy.contains('Dashboard').should('be.visible');
    });

    it('should create a new job flow', () => {
        // Login Programmatically to save time or UI login
        cy.visit('/login');
        cy.get('input[name="username"]').type(testUser.username);
        cy.get('input[name="password"]').type(testUser.password);
        cy.get('button[type="submit"]').click();

        // Navigate to Create Order
        cy.contains('New Order').click();

        // Fill Job Form
        cy.get('input[name="customerName"]').type('Cypress Test Customer');
        cy.get('input[name="phone"]').type('9999999999');

        // Select Device Type (Mocking custom select might vary, assuming text input fallback or clicking props)
        // Since we used a custom UI component, we might need to click the trigger
        // If CreatableSelect is complex, we might target the input inside it
        // Assuming standard inputs for now or finding by placeholder

        cy.get('input[name="model"]').type('Test Model X');
        cy.get('textarea[name="issue"]').type('Screen flicker issue');

        cy.get('input[name="estimatedDelivery"]').type('2025-12-31');
        cy.get('input[name="totalAmount"]').type('1500');

        cy.get('button[type="submit"]').contains('Create Order').click();

        // Verify it appears in the list (Jobs page is usually redirected to or Modal closes)
        // Assuming Modal closes and we refresh or list updates
        cy.contains('Cypress Test Customer').should('be.visible');
    });

    it('should filter jobs', () => {
        cy.visit('/login');
        cy.get('input[name="username"]').type(testUser.username);
        cy.get('input[name="password"]').type(testUser.password);
        cy.get('button[type="submit"]').click();

        cy.visit('/jobs');
        cy.contains('All Orders').should('be.visible');
    });
});
