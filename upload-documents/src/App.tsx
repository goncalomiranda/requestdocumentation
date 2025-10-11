import './uploadpage.css'
import "bootstrap/dist/css/bootstrap.min.css";
import '../material-kit-master/assets/css/material-kit.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadPage from './components/uploadpageComponent';
import MortageApplication from './components/MortageApplication';

function App() {
  
  return (
    <Router>

      <Routes>
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/mortage-application" element={<MortageApplication />} />
      </Routes>
    </Router>
  );
 }

export default App
