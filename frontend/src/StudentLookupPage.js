import { useCallback, useState } from 'react';

const apiBase =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export default function StudentLookupPage() {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async () => {
    const id = studentId.trim();
    if (!id) {
      setError('Enter a student ID.');
      setStudent(null);
      return;
    }
    if (!/^\d+$/.test(id) || Number(id) > 2147483647) {
      setError('Student ID must be a non-negative integer in range for this database.');
      setStudent(null);
      return;
    }
    setLoading(true);
    setError(null);
    setStudent(null);
    try {
      const res = await fetch(`${apiBase}/students/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      setStudent(data);
    } catch (e) {
      setError(e.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const onSubmit = (e) => {
    e.preventDefault();
    lookup();
  };

  return (
    <main className="student-page">
      <h1>Student lookup</h1>
      <p className="hint">
        Enter a numeric ID and load the record from the database.
      </p>
      <form className="lookup-form" onSubmit={onSubmit}>
        <label htmlFor="student-id">Student ID</label>
        <input
          id="student-id"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="e.g. 1"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'Look up'}
        </button>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      {student && (
        <dl className="student-record">
          <dt>ID</dt>
          <dd>{student.id}</dd>
          <dt>Name</dt>
          <dd>{student.name}</dd>
          <dt>Age</dt>
          <dd>{student.age}</dd>
          <dt>Grade</dt>
          <dd>{student.grade}</dd>
          <dt>Alive</dt>
          <dd>{student.alive ? 'Yes' : 'No'}</dd>
          <dt>GPA</dt>
          <dd>{student.gpa != null ? Number(student.gpa).toFixed(2) : '—'}</dd>
        </dl>
      )}
    </main>
  );
}
