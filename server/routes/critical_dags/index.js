// routes/critical_dags/index.js

const express = require('express');
const router = express.Router();
const { BigQuery } = require('@google-cloud/bigquery');

// Initialize BigQuery client
const bigquery = new BigQuery();

// Configuration for the critical_dags table
const datasetId = 'infra_audit';
const tableId = 'critical_dags';

// GET all rows from critical_dags
router.get('/', async (req, res) => {
  try {
    const query = `SELECT * FROM \`${datasetId}.${tableId}\` LIMIT 100`;
    const [rows] = await bigquery.query({ query });
    // Optionally add a fake id if missing (you might not need this if your table has a proper key)
    const rowsWithIds = rows.map((row, index) => (!row.id ? { id: `row-${index}`, ...row } : row));
    res.json(rowsWithIds);
  } catch (error) {
    console.error('Error querying BigQuery:', error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
});

// POST - Insert a new row into critical_dags
router.post('/', async (req, res) => {
  try {
    const { bundle_name } = req.body;
    if (!bundle_name) {
      return res.status(400).json({ error: 'bundle_name is required' });
    }
    
    const query = `
      INSERT INTO \`${datasetId}.${tableId}\` (bundle_name)
      VALUES (@bundle_name)
    `;
    
    const [job] = await bigquery.createQueryJob({ 
      query,
      params: { bundle_name }
    });
    await job.getQueryResults();
    console.log(`Row inserted with bundle_name: ${bundle_name}`);
    res.json({ success: true });
  } catch (error) {
    console.error("INSERT Error:", error);
    res.status(500).json({ error: 'INSERT failed', details: error.message });
  }
});

// PUT - Update a row in critical_dags
router.put('/:id', async (req, res) => {
  try {
    const { bundle_name } = req.body;
    const oldName = req.params.id;
    
    const query = `
      UPDATE \`${datasetId}.${tableId}\`
      SET bundle_name = @newName
      WHERE bundle_name = @oldName
    `;
    const [job] = await bigquery.createQueryJob({
      query,
      params: { newName: bundle_name, oldName }
    });
    const [results] = await job.getQueryResults();
    console.log(`Rows updated: ${results.length}`);
    res.json({ success: true, rowsUpdated: results.length });
  } catch (error) {
    console.error("UPDATE Error:", error);
    res.status(500).json({ error: 'UPDATE failed', details: error.message });
  }
});

// DELETE - Delete a row from critical_dags
router.delete('/:id', async (req, res) => {
  try {
    const query = `
      DELETE FROM \`${datasetId}.${tableId}\`
      WHERE bundle_name = @id
    `;
    const [job] = await bigquery.createQueryJob({
      query,
      params: { id: req.params.id }
    });
    const [rows] = await job.getQueryResults();
    res.json({ success: true, message: `Deleted ${rows.length} row(s)` });
  } catch (error) {
    console.error("DELETE Error:", error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

module.exports = router;
