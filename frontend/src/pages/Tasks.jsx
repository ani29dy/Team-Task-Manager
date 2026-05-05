import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Filter, Search, ListFilter, CheckSquare, AlertTriangle } from 'lucide-react';

const Tasks = () => {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: '' });
  const [editTask, setEditTask] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.overdue) params.append('overdue', 'true');
      if (!isAdmin) params.append('assignedTo', user._id);
      const { data } = await api.get(`/tasks?${params.toString()}`);
      setTasks(data.tasks);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const handleStatusUpdate = async () => {
    if (!editTask || !editStatus) return;
    setSaving(true);
    try {
      await api.put(`/tasks/${editTask._id}`, { status: editStatus });
      toast.success('Status updated!');
      setEditTask(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.project?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const overdueCount = tasks.filter((t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date()).length;

  return (
    <div style={{ padding: '2rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.2rem' }}>
          {isAdmin ? 'All Tasks' : 'My Tasks'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          {overdueCount > 0 && (
            <span style={{ marginLeft: '0.75rem', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={13} />{overdueCount} overdue
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: '2.25rem', width: 240, padding: '0.55rem 1rem 0.55rem 2.25rem' }}
            placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ width: 150, padding: '0.55rem 1rem' }} value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="input-field" style={{ width: 150, padding: '0.55rem 1rem' }} value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className={`btn-secondary ${filters.overdue ? 'active' : ''}`}
          style={{ borderColor: filters.overdue ? 'var(--danger)' : undefined, color: filters.overdue ? 'var(--danger)' : undefined }}
          onClick={() => setFilters({ ...filters, overdue: filters.overdue ? '' : 'true' })}>
          <AlertTriangle size={14} /> Overdue only
        </button>
        {(filters.status || filters.priority || filters.overdue || search) && (
          <button className="btn-secondary" onClick={() => { setFilters({ status: '', priority: '', overdue: '' }); setSearch(''); }}>
            <Filter size={14} /> Clear
          </button>
        )}
      </div>

      {/* Task grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <CheckSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>No tasks found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.9rem' }}>
          {filtered.map((t) => (
            <div key={t._id} onClick={() => { setEditTask(t); setEditStatus(t.status); }} style={{ cursor: 'pointer' }}>
              <TaskCard task={t} onClick={() => { setEditTask(t); setEditStatus(t.status); }} />
            </div>
          ))}
        </div>
      )}

      {/* Update status modal */}
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Update Task Status">
        {editTask && (
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>{editTask.title}</h3>
            {editTask.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{editTask.description}</p>}
            <div className="divider" />
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Status</label>
              <select className="input-field" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setEditTask(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleStatusUpdate} disabled={saving}>{saving ? 'Saving...' : 'Update Status'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tasks;
