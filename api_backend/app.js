const express = require('express'); // Get the tools to build your server
const cors = require('cors'); // Get cors
const path = require('path'); // Import path module
const app = express(); // Create your server
const port = 3000; // Decide the port number

// Enables CORS for all routes
app.use(cors());
// Middleware to parse JSON
app.use(express.json()); // Set up a rule for the messages

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const routes = require('./routes');

// Use routes
app.use('/', routes);

// Catch-all to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});


