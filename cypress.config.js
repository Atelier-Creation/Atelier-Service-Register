const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        baseUrl: 'http://localhost:4173',
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        supportFile: false, // Disabling support file for simplicity if not needed, or create one
    },
});
