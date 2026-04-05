import { NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import CreateStudentPage from './CreateStudentPage';
import StudentLookupPage from './StudentLookupPage';

function App() {
  return (
    <div className="App">
      <nav className="app-nav" aria-label="Main">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Look up
        </NavLink>
        <NavLink
          to="/students/new"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Create student
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<StudentLookupPage />} />
        <Route path="/students/new" element={<CreateStudentPage />} />
      </Routes>
    </div>
  );
}

export default App;
