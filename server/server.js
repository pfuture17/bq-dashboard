// server.js

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, 'build')));

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working correctly' });
});


// CALL OF ROUTES!
const criticalDagsRoutes = require('./routes/critical_dags/index.js');
app.use('/api/critical_dags', criticalDagsRoutes);

const personsRoutes = require('./routes/persons/index.js');
app.use('/api/persons', personsRoutes);



// For listing tables (if needed)
app.get('/api/tables', async (req, res) => {
  try {
    const { BigQuery } = require('@google-cloud/bigquery');
    const bigquery = new BigQuery();
    const datasetId = 'infra_audit';
    const dataset = bigquery.dataset(datasetId);
    const [tables] = await dataset.getTables();
    const tableNames = tables.map(t => t.metadata.tableReference.tableId);
    res.json(tableNames);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables', details: error.message });
  }
});

// Fallback route to serve React app
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
