const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // Add this

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

// Initialize BigQuery client
const bigquery = new BigQuery();

// Configuration
const datasetId = 'infra_audit';
const tableId = 'critical_dags';

// Test route to verify server is working correctly
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working correctly' });
});

// API Endpoints
app.get('/api/data', async (req, res) => {
  try {
    const query = `SELECT * FROM \`${datasetId}.${tableId}\` LIMIT 100`;
    
    const options = {
      query: query,
    };

    // Run the query
    const [rows] = await bigquery.query(options);
    
    // Add an 'id' property if not already present
    const rowsWithIds = rows.map((row, index) => {
      if (!row.id) {
        return { id: `row-${index}`, ...row };
      }
      return row;
    });
    
    res.json(rowsWithIds);
  } catch (error) {
    console.error('Error querying BigQuery:', error);
    res.status(500).json({ error: 'Failed to fetch data from BigQuery', details: error.message });
  }
});

app.put('/api/data/:id', async (req, res) => {
    try {
      const { bundle_name } = req.body;
      const oldName = req.params.id;
  
      // OPTION 1: Use Standard SQL with Parameters (Recommended)
      const query = `
        UPDATE \`${datasetId}.${tableId}\`
        SET bundle_name = @newName
        WHERE bundle_name = @oldName
      `;
  
      const [job] = await bigquery.createQueryJob({
        query,
        params: {
          newName: bundle_name,
          oldName: oldName
        },
      });
  
      // Wait for job to complete
      const [results] = await job.getQueryResults();
      console.log(`Rows updated: ${results.length}`);
  
      res.json({ 
        success: true,
        rowsUpdated: results.length
      });
      console.log("Params:", { 
        newName: bundle_name, 
        oldName: oldName 
      });
  
    } catch (error) {
      console.error("UPDATE Error:", error);
      res.status(500).json({ 
        error: "UPDATE failed",
        details: error.message,
        workingQuery: `Manual test (worked in Console): 
          UPDATE \`${datasetId}.${tableId}\`
          SET bundle_name = '${req.body.bundle_name}'
          WHERE bundle_name = '${req.params.id}'`
      });
    }
  });
  
  // DELETE /api/data/:id (Via Job)
  app.delete('/api/data/:id', async (req, res) => {
    try {
      const query = `
        DELETE FROM \`${datasetId}.${tableId}\`
        WHERE bundle_name = @id
      `;
  
      const [job] = await bigquery.createQueryJob({
        query,
        params: { id: req.params.id },
      });
  
      const [rows] = await job.getQueryResults();
      
      res.json({ 
        success: true,
        message: `Deleted ${rows.length} row(s)`
      });
    } catch (error) {
      console.error("Job delete error:", error);
      res.status(500).json({ 
        error: "Delete failed",
        details: error.message,
        manualFix: `Run manually in BigQuery: DELETE FROM \`${datasetId}.${tableId}\` WHERE bundle_name = '${req.params.id}'`
      });
    }
  });

// POST /api/data - Insert a new row into BigQuery
app.post('/api/data', async (req, res) => {
    try {
      const { bundle_name } = req.body;
      if (!bundle_name) {
        return res.status(400).json({ error: 'bundle_name is required' });
      }
      
      // Construct an INSERT query using parameterized SQL
      const query = `
        INSERT INTO \`${datasetId}.${tableId}\` (bundle_name)
        VALUES (@bundle_name)
      `;
    
      const [job] = await bigquery.createQueryJob({
        query,
        params: { bundle_name },
      });
    
      // Wait for job to complete
      await job.getQueryResults();
    
      console.log(`Row inserted with bundle_name: ${bundle_name}`);
      res.json({ success: true });
    } catch (error) {
      console.error("INSERT Error:", error);
      res.status(500).json({ 
        error: "INSERT failed",
        details: error.message 
      });
    }
  });
  

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});