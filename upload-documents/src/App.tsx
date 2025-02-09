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

//   return (
//     <>

// <main>
//       <div
//         className="bg-dark text-secondary px-4 py-5 text-center"
//         id="mainDivDocumentation"
//       >
//         <div className="py-5">
//           <h1 className="display-5 fw-bold text-white">Page Title</h1>
//           <div className="col-lg-6 mx-auto">
//             <p className="fs-5 mb-4">
//               Upload required documents securely and efficiently. Select files,
//               provide optional details, and submit them for processing—all in a
//               user-friendly interface.
//             </p>
//             <div
//               className="d-grid gap-2 d-sm-flex justify-content-sm-center"
//               id="listOfDocuments"
//             >
//               <UploadPage />
//             </div>
//           </div>
//         </div>
//       </div>
//     </main>

//     </>
//   )
 }

export default App
