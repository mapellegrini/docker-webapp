import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const apiBase =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export default function DeleteStudentPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const idNum = /^\d+$/.test(studentId || '') ? Number(studentId) : NaN;
  const idValid =
    !Number.isNaN(idNum) && idNum >= 0 && idNum <= 2147483647;

  const load = useCallback(async () => {
    if (!idValid) {
      setLoadError('Invalid student ID in the URL.');
      setLoadingStudent(false);
      return;
    }
    setLoadingStudent(true);
    setLoadError(null);
    try {
      const res = await fetch(`${apiBase}/students/${idNum}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || `Request failed (${res.status})`);
        return;
      }
      setStudent(data);
    } catch (e) {
      setLoadError(e.message || 'Could not reach the server.');
    } finally {
      setLoadingStudent(false);
    }
  }, [idNum, idValid]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async () => {
    if (!idValid || !window.confirm(`Delete student ${idNum} permanently?`)) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}/students/${idNum}`, {
        method: 'DELETE',
      });
      if (res.status === 204) {
        navigate('/students', { replace: true });
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || `Request failed (${res.status})`);
    } catch (e) {
      setError(e.message || 'Could not reach the server.');
    } finally {
      setDeleting(false);
    }
  };

  if (!idValid) {
    return (
      <main className="student-page">
        <h1>Delete student</h1>
        <p className="message error" role="alert">
          Invalid student ID in the URL.
        </p>
        <Link to="/students" className="text-link">
          Back to all students
        </Link>
      </main>
    );
  }

  return (
    <main className="student-page">
      <h1>Delete student</h1>
      <p className="hint">
        This removes the record from the database. This cannot be undone.
      </p>
      {loadingStudent && <p className="message">Loading…</p>}
      {loadError && (
        <p className="message error" role="alert">
          {loadError}
        </p>
      )}
      {!loadingStudent && !loadError && student && (
        <>
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
            <dd>
              {student.gpa != null ? Number(student.gpa).toFixed(2) : '—'}
            </dd>
          </dl>
          <div className="delete-actions">
            <button
              type="button"
              className="btn-danger"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete student'}
            </button>
            <Link to={`/students/${idNum}/edit`} className="text-link">
              Edit instead
            </Link>
            <Link to="/students" className="text-link">
              Cancel — back to list
            </Link>
          </div>
        </>
      )}
      {error && <p className="message error" role="alert">{error}</p>}
    </main>
  );
}
