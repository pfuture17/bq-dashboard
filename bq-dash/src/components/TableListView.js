// src/components/TableListView.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import  styles from './TableListView.module.css'; // You can customize this CSS

function TableListView() {
  const [tableList, setTableList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/tables`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text);
        }
        const tables = await response.json();
        setTableList(tables);
        setLoading(false);
      } catch (err) {
        setError('Error fetching tables: ' + err.message);
        setLoading(false);
      }
    };

    fetchTables();
  }, [API_URL]);

  const filteredTables = tableList.filter(table =>
    table.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className={styles.tableListView}>
      <header className={styles.header}>
        <h1>Select a Table</h1>
      </header>
      <div className={styles.searchBar}>
        <input 
          type="text"
          placeholder="Search tables..."
          className={styles.input}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className={`${styles.tableGrid}`}>
        {filteredTables.map((table) => (
          <Link key={table} to={`/${table}`} className={styles.tableItem}>
            {table}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TableListView;
