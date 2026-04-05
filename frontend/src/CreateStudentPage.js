import { useState } from 'react';

const apiBase =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

const initialForm = {
  id: '',
  name: '',
  age: '',
  grade: '',
  alive: true,
  gpa: '',
};

export default function CreateStudentPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const idStr = form.id.trim();
    if (!/^\d+$/.test(idStr) || Number(idStr) > 2147483647) {
      setError('ID must be a non-negative integer within database range.');
      return;
    }
    const id = Number(idStr);

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
      id,
      name,
      age,
      grade,
      alive: form.alive,
      gpa,
    };

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      setSuccess(`Student ${data.id} (${data.name}) was created.`);
      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="student-page">
      <h1>Create student</h1>
      <p className="hint">
        All fields except GPA are required. GPA can be left blank.
      </p>
      <form className="create-form" onSubmit={onSubmit}>
        <label htmlFor="create-id">ID</label>
        <input
          id="create-id"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={form.id}
          onChange={(e) => onChange('id', e.target.value)}
        />

        <label htmlFor="create-name">Name (max 40 characters)</label>
        <input
          id="create-name"
          type="text"
          maxLength={40}
          autoComplete="name"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
        />

        <label htmlFor="create-age">Age</label>
        <input
          id="create-age"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={form.age}
          onChange={(e) => onChange('age', e.target.value)}
        />

        <label htmlFor="create-grade">Grade (0–255)</label>
        <input
          id="create-grade"
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

        <label htmlFor="create-gpa">GPA (optional)</label>
        <input
          id="create-gpa"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="e.g. 3.5"
          value={form.gpa}
          onChange={(e) => onChange('gpa', e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create student'}
        </button>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      {success && <p className="message success" role="status">{success}</p>}
    </main>
  );
}
