import './uploadpage.css'
// Removed bootstrap import to avoid conflicts with Material Kit
import '../material-kit-master/assets/css/material-kit.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadPage from './components/uploadpageComponent';
import MortageApplication from './components/MortageApplication';

function App() {
  
  return (
    <Router>

      <Routes>
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/mortgage-application" element={<MortageApplication />} />
      </Routes>
    </Router>
  );
 }

export default App
