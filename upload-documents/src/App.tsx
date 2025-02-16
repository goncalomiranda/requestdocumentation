// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
//import './App.css'
import './uploadpage.css'
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadPage from './components/uploadpageComponent';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Router>
  );
 }

export default App
