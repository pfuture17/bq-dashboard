// src/components/CrudView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TableComponent from './TableComponent';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './CrudView.module.css'; // Customize this CSS if desired

// Configuration for tables
const tableConfigs = {
  persons: {
    idField: 'name',
    fields: [
      { name: 'name', type: 'string', label: 'Name' },
      { name: 'age', type: 'number', label: 'Age' },
      { name: 'location', type: 'string', label: 'Location' },
    ],
  },
  critical_dags: {
    idField: 'bundle_name',
    fields: [
      { name: 'bundle_name', type: 'string', label: 'Bundle Name' },
      // Add more fields as needed
    ],
  },
};

function CrudView() {
  const { tableName } = useParams();
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);
  const [dataSearchTerm, setDataSearchTerm] = useState('');
  const [newRowData, setNewRowData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = 'http://localhost:5000';

  const config = tableConfigs[tableName] || {};
  const idField = config.idField || 'bundle_name';

  // Fetch data for the selected table and initialize new row form
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/${tableName}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text);
        }
        const data = await response.json();
        setTableData(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching table data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();

    // Reset new row form based on configuration.
    if (config.fields) {
      const initialData = {};
      config.fields.forEach(field => {
        initialData[field.name] = '';
      });
      setNewRowData(initialData);
    } else {
      setNewRowData({});
    }
    // Clear search when loading new table.
    setDataSearchTerm('');
  }, [tableName, config.fields, API_URL]);

  const handleDelete = async (identifier) => {
    try {
      const response = await fetch(`${API_URL}/api/${tableName}/${identifier}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
      setTableData(tableData.filter(item => item[idField] !== identifier));
    } catch (err) {
      toast.error('Error deleting data: ' + err.message);
    }
  };

  const handleSave = async (originalId, updatedData) => {
    try {
      let payload = { ...updatedData };
      if (config.fields) {
        config.fields.forEach(field => {
          if (field.type === 'number') {
            payload[field.name] = parseInt(payload[field.name], 10);
          }
        });
      }
      const response = await fetch(`${API_URL}/api/${tableName}/${originalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to update record');
      }
      setTableData(tableData.map(item =>
        item[idField] === originalId ? { ...item, ...payload } : item
      ));
    } catch (err) {
      toast.error('Error updating data: ' + err.message);
    }
  };

  const handleAddRow = async () => {
    try {
      for (let field of (config.fields || [])) {
        if (!newRowData[field.name] || newRowData[field.name].toString().trim() === '') {
          toast.warn(`Please enter a valid ${field.label}`);
          return;
        }
      }
      const payload = { ...newRowData };
      config.fields.forEach(field => {
        if (field.type === 'number') {
          payload[field.name] = parseInt(payload[field.name], 10);
        }
      });
      const response = await fetch(`${API_URL}/api/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to add new row');
      }
      // Refresh data
      const dataResponse = await fetch(`${API_URL}/api/${tableName}`);
      const updatedData = await dataResponse.json();
      setTableData(updatedData);
      // Reset form:
      const resetData = {};
      config.fields.forEach(field => {
        resetData[field.name] = '';
      });
      setNewRowData(resetData);
    } catch (err) {
      toast.error('Error adding data: ' + err.message);
    }
  };

  const filteredData = tableData.filter(item =>
    item[idField] &&
    item[idField].toString().toLowerCase().includes(dataSearchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className={styles.crudView}>
      <header className={styles.header}>
        <h1>Table: {tableName}</h1>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          Back to Table List
        </button>
      </header>
      <main>
        <div className={styles.addRowContainer}>
          <h3>Add New Row</h3>
          {config.fields && config.fields.map(field => (
            <div key={field.name}>
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                placeholder={`Enter ${field.label}`}
                className={styles.inputField}
                value={newRowData[field.name] || ''}
                onChange={(e) =>
                  setNewRowData({ ...newRowData, [field.name]: e.target.value })
                }
              />
            </div>
          ))}
          <button className={styles.addButton} onClick={handleAddRow}>
            Add Row
          </button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder={`Search by ${idField}...`}
            className={styles.searchInput}
            value={dataSearchTerm}
            onChange={(e) => setDataSearchTerm(e.target.value)}
          />
        </div>

        {filteredData.length > 0 ? (
          <TableComponent
            data={filteredData}
            onDelete={handleDelete}
            onSave={handleSave}
            idField={idField}
          />
        ) : (
          <div className={styles.noData}>
            No data available for this table.
          </div>
        )}
        <ToastContainer />
      </main>
    </div>
  );
}

export default CrudView;
