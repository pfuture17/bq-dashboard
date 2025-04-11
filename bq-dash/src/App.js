// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import TableComponent from './components/TableComponent';

function App() {
  const [tableData, setTableData] = useState([]);
  const [newBundle, setNewBundle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/data`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${errorText}`);
      }
      const data = await response.json();
      console.log('Data fetched:', data);
      setTableData(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Error fetching data: ' + error.message);
      setLoading(false);
    }
  };

  const handleDelete = async (bundleName) => {
    try {
      const response = await fetch(`${API_URL}/api/data/${bundleName}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete the record');
      }
      setTableData(tableData.filter(item => item.bundle_name !== bundleName));
    } catch (error) {
      setError('Error deleting data: ' + error.message);
    }
  };

  const handleSave = async (originalBundleName, updatedData) => {
    try {
      const response = await fetch(`${API_URL}/api/data/${originalBundleName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error('Failed to update the record');
      }
      setTableData(tableData.map(item => 
        item.bundle_name === originalBundleName ? { ...item, ...updatedData } : item
      ));
    } catch (error) {
      setError('Error updating data: ' + error.message);
    }
  };

  // New function to add a row
  const handleAddRow = async () => {
    try {
      if (!newBundle.trim()) {
        setError('Please enter a valid bundle name.');
        return;
      }
      const response = await fetch(`${API_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bundle_name: newBundle.trim() }),
      });
      if (!response.ok) {
        throw new Error('Failed to add new row');
      }
      fetchTableData();
      setNewBundle('');
    } catch (error) {
      setError('Error adding data: ' + error.message);
    }
  };

  // Filter table data based on the search term
  const filteredData = tableData.filter(item =>
    item.bundle_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>BigQuery Data Viewer</h1>
      </header>
      <main>
        {/* Add New Row Form */}
        <div className="add-row-container">
          <h3>Add New Row</h3>
          <input
            type="text"
            placeholder="Enter bundle name"
            value={newBundle}
            onChange={(e) => setNewBundle(e.target.value)}
          />
          <button onClick={handleAddRow}>Add Row</button>
        </div>

        {/* Search Bar */}
        <div className="search-bar-container">
          <input 
            type="text"
            placeholder="Search by bundle name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredData.length > 0 ? (
          <TableComponent 
            data={filteredData} 
            onDelete={handleDelete} 
            onSave={handleSave} 
          />
        ) : (
          <div className="no-data">
            No data available. Make sure your BigQuery connection is working.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
