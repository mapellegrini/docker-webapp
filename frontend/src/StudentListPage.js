import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const apiBase =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export default function StudentListPage() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/students`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && data.error
            ? data.error
            : `Request failed (${res.status})`;
        setError(msg);
        setStudents(null);
        return;
      }
      if (!Array.isArray(data)) {
        setError('Unexpected response from the server.');
        setStudents(null);
        return;
      }
      setStudents(data);
    } catch (e) {
      setError(e.message || 'Could not reach the server.');
      setStudents(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="student-page student-page--wide">
      <h1>All students</h1>
      <p className="hint">
        Records from the database, sorted by ID.
      </p>
      <div className="list-toolbar">
        <button type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && students && students.length === 0 && (
        <p className="message empty-hint">No students yet.</p>
      )}
      {!loading && students && students.length > 0 && (
        <div className="table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Age</th>
                <th scope="col">Grade</th>
                <th scope="col">Alive</th>
                <th scope="col">GPA</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.age}</td>
                  <td>{s.grade}</td>
                  <td>{s.alive ? 'Yes' : 'No'}</td>
                  <td>
                    {s.gpa != null ? Number(s.gpa).toFixed(2) : '—'}
                  </td>
                  <td className="table-actions">
                    <Link to={`/students/${s.id}/edit`} className="table-link">
                      Edit
                    </Link>
                    <Link to={`/students/${s.id}/delete`} className="table-link table-link--danger">
                      Delete
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
