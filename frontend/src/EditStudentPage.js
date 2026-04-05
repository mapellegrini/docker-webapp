import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const apiBase =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export default function EditStudentPage() {
  const { studentId } = useParams();
  const [form, setForm] = useState({
    name: '',
    age: '',
    grade: '',
    alive: true,
    gpa: '',
  });
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setForm({
        name: data.name ?? '',
        age: String(data.age ?? ''),
        grade: String(data.grade ?? ''),
        alive: Boolean(data.alive),
        gpa: data.gpa != null ? String(data.gpa) : '',
      });
    } catch (e) {
      setLoadError(e.message || 'Could not reach the server.');
    } finally {
      setLoadingStudent(false);
    }
  }, [idNum, idValid]);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const name = form.name.trim();
    if (!name || name.length > 40) {
      setError('Name is required and must be at most 40 characters.');
      return;
    }

    const ageStr = form.age.trim();
    if (!/^\d+$/.test(ageStr) || Number(ageStr) > 2147483647) {
      setError('Age must be a non-negative integer within database range.');
      return;
    }
    const age = Number(ageStr);

    const gradeStr = form.grade.trim();
    if (!/^\d+$/.test(gradeStr)) {
      setError('Grade must be an integer from 0 to 255.');
      return;
    }
    const grade = Number(gradeStr);
    if (grade > 255) {
      setError('Grade must be an integer from 0 to 255.');
      return;
    }

    let gpa = null;
    const gpaStr = form.gpa.trim();
    if (gpaStr !== '') {
      const g = Number(gpaStr);
      if (Number.isNaN(g)) {
        setError('GPA must be a number or left empty.');
        return;
      }
      gpa = g;
    }

    const body = {
      name,
      age,
      grade,
      alive: form.alive,
      gpa,
    };

    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/students/${idNum}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      setSuccess('Student was updated.');
      setForm({
        name: data.name ?? '',
        age: String(data.age ?? ''),
        grade: String(data.grade ?? ''),
        alive: Boolean(data.alive),
        gpa: data.gpa != null ? String(data.gpa) : '',
      });
    } catch (err) {
      setError(err.message || 'Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  if (!idValid) {
    return (
      <main className="student-page">
        <h1>Edit student</h1>
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
      <h1>Edit student</h1>
      <p className="hint">
        Student ID <strong>{idNum}</strong>. GPA can be left empty to clear it.
      </p>
      {loadingStudent && <p className="message">Loading…</p>}
      {loadError && (
        <p className="message error" role="alert">
          {loadError}
        </p>
      )}
      {!loadingStudent && !loadError && (
        <>
          <form className="create-form" onSubmit={onSubmit}>
            <label htmlFor="edit-name">Name (max 40 characters)</label>
            <input
              id="edit-name"
              type="text"
              maxLength={40}
              autoComplete="name"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
            />

            <label htmlFor="edit-age">Age</label>
            <input
              id="edit-age"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.age}
              onChange={(e) => onChange('age', e.target.value)}
            />

            <label htmlFor="edit-grade">Grade (0–255)</label>
            <input
              id="edit-grade"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.grade}
              onChange={(e) => onChange('grade', e.target.value)}
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.alive}
                onChange={(e) => onChange('alive', e.target.checked)}
              />
              <span>Alive</span>
            </label>

            <label htmlFor="edit-gpa">GPA (optional — clear to remove)</label>
            <input
              id="edit-gpa"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 3.5"
              value={form.gpa}
              onChange={(e) => onChange('gpa', e.target.value)}
            />

            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
          <p className="form-footer-links">
            <Link to={`/students/${idNum}/delete`} className="text-link danger">
              Delete this student
            </Link>
            {' · '}
            <Link to="/students" className="text-link">
              All students
            </Link>
          </p>
        </>
      )}
      {error && <p className="message error" role="alert">{error}</p>}
      {success && <p className="message success" role="status">{success}</p>}
    </main>
  );
}
