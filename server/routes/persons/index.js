// routes/persons/index.js
const express = require('express');
const router = express.Router();
const { BigQuery } = require('@google-cloud/bigquery');

// Initialize BigQuery client
const bigquery = new BigQuery();

// Configuration for the persons table
const datasetId = 'infra_audit';
const tableId = 'persons';

// GET all persons
router.get('/', async (req, res) => {
  try {
    const query = `SELECT * FROM \`${datasetId}.${tableId}\` LIMIT 100`;
    const [rows] = await bigquery.query({ query });
    // Optionally assign an id property if needed (or assume name as key)
    const rowsWithIds = rows.map((row, index) => (!row.name ? { id: `row-${index}`, ...row } : row));
    res.json(rowsWithIds);
  } catch (error) {
    console.error('Error fetching persons:', error);
    res.status(500).json({ error: 'Failed to fetch persons', details: error.message });
  }
});

// POST - Add a new person
router.post('/', async (req, res) => {
  try {
    const { name, age, location } = req.body;
    if (!name || age === undefined || !location) {
      return res.status(400).json({ error: 'name, age, and location are required' });
    }
    
    const query = `
      INSERT INTO \`${datasetId}.${tableId}\` (name, age, location)
      VALUES (@name, @age, @location)
    `;
    
    const params = { name, age, location };
    const [job] = await bigquery.createQueryJob({ query, params });
    await job.getQueryResults();
    console.log(`Person inserted: ${name}`);
    res.json({ success: true });
  } catch (error) {
    console.error("INSERT Error:", error);
    res.status(500).json({ error: 'INSERT failed', details: error.message });
  }
});

// PUT - Update an existing person
// In this example, we'll use 'name' as the identifier.
// In a real-world scenario it may be better to have a unique id.
router.put('/:name', async (req, res) => {
  try {
    const { age, location } = req.body;
    const oldName = req.params.name;
    
    // In this update, we assume name is not updated.
    const query = `
      UPDATE \`${datasetId}.${tableId}\`
      SET age = @age, location = @location
      WHERE name = @oldName
    `;
    const params = { age, location, oldName };
    const [job] = await bigquery.createQueryJob({ query, params });
    const [results] = await job.getQueryResults();
    console.log(`Rows updated: ${results.length}`);
    res.json({ success: true, rowsUpdated: results.length });
  } catch (error) {
    console.error("UPDATE Error:", error);
    res.status(500).json({ error: 'UPDATE failed', details: error.message });
  }
});

// DELETE - Remove a person
router.delete('/:name', async (req, res) => {
  try {
    const query = `
      DELETE FROM \`${datasetId}.${tableId}\`
      WHERE name = @name
    `;
    const [job] = await bigquery.createQueryJob({
      query,
      params: { name: req.params.name },
    });
    const [rows] = await job.getQueryResults();
    res.json({ success: true, message: `Deleted ${rows.length} row(s)` });
  } catch (error) {
    console.error("DELETE Error:", error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

module.exports = router;
