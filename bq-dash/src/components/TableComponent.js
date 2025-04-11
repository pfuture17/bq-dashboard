import React, { useState } from 'react';
import './TableComponent.css';

const TableComponent = ({ data, onDelete, onSave }) => {
  // We'll store the original bundle name alongside our editing info.
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [originalBundle, setOriginalBundle] = useState(null);

  if (!data || data.length === 0) {
    return <div className="empty-table">No data available</div>;
  }

  // Use the real column names (excluding the artificial id property)
  const columns = Object.keys(data[0]).filter(col => col !== 'id');

  const handleEdit = (row) => {
    // Use the real identifier: bundle_name
    setEditingRow(row.bundle_name);
    setEditedData({ ...row });
    setOriginalBundle(row.bundle_name); // Store original value for later use
  };

  const handleInputChange = (column, value) => {
    setEditedData({
      ...editedData,
      [column]: value,
    });
  };

  const handleSave = async () => {
    // Pass the original bundle name as the first parameter
    await onSave(originalBundle, editedData);
    setEditingRow(null);
    setOriginalBundle(null);
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedData({});
    setOriginalBundle(null);
  };

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column}>{column}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            // Use bundle_name as the unique key
            <tr key={row.bundle_name}>
              {columns.map(column => (
                <td key={`${row.bundle_name}-${column}`}>
                  {editingRow === row.bundle_name ? (
                    <input
                      type="text"
                      value={editedData[column] || ''}
                      onChange={(e) =>
                        handleInputChange(column, e.target.value)
                      }
                    />
                  ) : (
                    row[column]
                  )}
                </td>
              ))}
              <td className="action-buttons">
                {editingRow === row.bundle_name ? (
                  <>
                    <button className="save-btn" onClick={handleSave}>
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      // Use the real bundle_name for deletion
                      onClick={() => onDelete(row.bundle_name)}
                    >
                      Delete
                    </button>
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
