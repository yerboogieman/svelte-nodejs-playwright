const express = require('express'); // Get the tools to build the server
const app = express(); // Create the server
const port = 3000; // Decide the port number

// Middleware to parse JSON
app.use(express.json()); // Set up a rule for the messages

// Import routes
const routes = require('./routes');

// Use routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


