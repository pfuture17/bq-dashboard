// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TableListView from './components/TableListView';
import CrudView from './components/CrudView';
import './App.module.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<TableListView />} />
      <Route path="/:tableName" element={<CrudView />} />
    </Routes>
  );
}

export default App;
