// src/components/TableComponent.js
import React, { useState } from 'react';
import styles from './TableComponent.module.css';

const TableComponent = ({ data, onDelete, onSave, idField = 'bundle_name' }) => {
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [originalId, setOriginalId] = useState(null);

  if (!data || data.length === 0) {
    return <div className="empty-table">No data available</div>;
  }

  const columns = Object.keys(data[0]).filter(col => col !== 'id');

  const handleEdit = (row) => {
    setEditingRow(row[idField]);
    setEditedData({ ...row });
    setOriginalId(row[idField]);
  };

  const handleInputChange = (column, value) => {
    setEditedData({ ...editedData, [column]: value });
  };

  const handleSave = async () => {
    await onSave(originalId, editedData);
    setEditingRow(null);
    setOriginalId(null);
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedData({});
    setOriginalId(null);
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {columns.map(col => <th key={col}>{col}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row[idField]}>
              {columns.map(col => (
                <td key={`${row[idField]}-${col}`}>
                  {editingRow === row[idField] ? (
                    <input
                      type="text"
                      value={editedData[col] || ''}
                      onChange={(e) => handleInputChange(col, e.target.value)}
                    />
                  ) : (
                    row[col]
                  )}
                </td>
              ))}
              <td className={styles.actionButtons}>
                {editingRow === row[idField] ? (
                  <>
                    <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                    <button className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className={styles.editBtn} onClick={() => handleEdit(row)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => onDelete(row[idField])}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableComponent;
