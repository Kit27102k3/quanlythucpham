// api/index.js
const express = require('express');
const app = express();

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel Express' });
});

module.exports = app;
