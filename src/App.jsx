
import { BrowserRouter, Routes, Route } from "react-router-dom";

//import pages
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SubjectPage from "./pages/SubjectPage";
import SubjectList from "./components/SubjectList";
import TopicPage from "./pages/TopicPage";
import Matching from "./pages/Matching";
import { AppProvider } from "./context/AppContext";

//import css
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Navbar />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/subjects" element={<SubjectList />} />
            <Route path="/subjects/:title" element={<SubjectPage />} />
            <Route path="/subjects/:title/topics/:topicId" element={<TopicPage />} />
            <Route path="/matching" element={<Matching />} />
            <Route path="/matching/:title" element={<Matching />} />
          </Routes>
        </main>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
