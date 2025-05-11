import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import UploadPDF from "./components/UploadPDF";

function App() {
  const [started, setStarted] = useState(false);

  return started ? (
    <UploadPDF onReturn={() => setStarted(false)} />
  ) : (
    <LandingPage onStart={() => setStarted(true)} />
  );
}

export default App;
