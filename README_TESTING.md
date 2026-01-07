# Frontend Automation Testing

This project uses **Cypress** for End-to-End (E2E) automation testing.

## Prerequisites
1. **Backend Server** must be running on `http://localhost:5000` (run `npm run dev` in `backend/`).
2. **Frontend Server** must be running on `http://localhost:5173` (run `npm run dev` in `frontend/`).

## How to Run Tests

### 1. Interactive Mode (UI)
Opens the Cypress Test Runner.
```bash
npm run cy:open
```

### 2. Headless Mode (CI/CLI)
Runs tests in the terminal.
```bash
npm run cy:run
```

## Test Files
*   `cypress/e2e/main.cy.js`: Contains tests for Login, Order Creation, and Dashboard navigation.
