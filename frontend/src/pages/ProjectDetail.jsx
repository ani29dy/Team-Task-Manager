import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, ArrowLeft, UserPlus, Trash2, Users, CheckSquare, Calendar, UserMinus } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLS = [
  { key: 'todo',        label: 'To Do',       color: '#64748b' },
  { key: 'in-progress', label: 'In Progress',  color: '#3b82f6' },
  { key: 'done',        label: 'Done',         color: '#10b981' },
];

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
  const [memberUserId, setMemberUserId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [projRes, taskRes, usersRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        api.get('/users/all'),
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
      setAllUsers(usersRes.data.users);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/tasks', { ...taskForm, project: id });
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUserId) return toast.error('Select a user');
    try {
      await api.post(`/projects/${id}/members`, { userId: memberUserId });
      toast.success('Member added!');
      setShowMemberModal(false);
      setMemberUserId('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      setTasks((t) => t.filter((x) => x._id !== taskId));
    } catch { toast.error('Failed to delete task'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  );

  if (!project) return null;

  const nonMembers = allUsers.filter((u) => !project.members.some((m) => m._id === u._id));

  return (
    <div style={{ padding: '2rem' }} className="animate-fade-in">
      {/* Back */}
      <button className="btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/projects')}>
        <ArrowLeft size={15} /> Back to Projects
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color || '#6366f1' }} />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{project.title}</h1>
          </div>
          {project.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '1.75rem' }}>{project.description}</p>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', marginLeft: '1.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <CheckSquare size={13} />{tasks.length} tasks
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Users size={13} />{project.members?.length} members
            </span>
            {project.deadline && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Calendar size={13} />Due {format(new Date(project.deadline), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setShowMemberModal(true)}><UserPlus size={15} /> Add Member</button>
            <button className="btn-primary" onClick={() => setShowTaskModal(true)}><Plus size={15} /> New Task</button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={15} style={{ color: 'var(--accent-light)' }} /> Team Members
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {project.members?.map((m) => (
            <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 30, padding: '4px 10px 4px 6px' }}>
              <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>{m.name?.[0]?.toUpperCase()}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{m.name}</span>
              <span className={`badge badge-${m.role}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>{m.role}</span>
              {isAdmin && m._id !== project.owner._id && (
                <button onClick={() => handleRemoveMember(m._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }} title="Remove">
                  <UserMinus size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {STATUS_COLS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '1px 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{colTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {colTasks.map((t) => (
                  <div key={t._id} style={{ position: 'relative' }}>
                    <TaskCard task={t} />
                    {isAdmin && (
                      <button className="btn-danger" style={{ position: 'absolute', top: 8, right: 8, padding: '3px 6px', fontSize: '0.7rem', zIndex: 2 }}
                        onClick={() => handleDeleteTask(t._id)}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create New Task">
        <form onSubmit={handleCreateTask}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Task Title *</label>
            <input className="input-field" placeholder="e.g. Design homepage mockup" value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required minLength={3} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea className="input-field" style={{ resize: 'vertical', minHeight: 70 }} placeholder="Task details..."
              value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Priority</label>
              <select className="input-field" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="input-field" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Assign To</label>
              <select className="input-field" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input type="date" className="input-field" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Add Team Member">
        <form onSubmit={handleAddMember}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Select User</label>
            <select className="input-field" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)}>
              <option value="">— Choose a user —</option>
              {nonMembers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </select>
            {nonMembers.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>All users are already members</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!memberUserId}>Add Member</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
