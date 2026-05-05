import { format, isValid, isPast } from 'date-fns';
import { Calendar, User, Flag, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusMap = {
  'todo':        { label: 'To Do',       cls: 'badge-todo' },
  'in-progress': { label: 'In Progress', cls: 'badge-inprogress' },
  'done':        { label: 'Done',        cls: 'badge-done' },
};
const priorityMap = {
  low:    { cls: 'badge-low' },
  medium: { cls: 'badge-medium' },
  high:   { cls: 'badge-high' },
};

const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const TaskCard = ({ task, onClick }) => {
  const navigate = useNavigate();
  const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
  const status = statusMap[task.status] || statusMap.todo;
  const priority = priorityMap[task.priority] || priorityMap.medium;

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', padding: '1.1rem' }}
      onClick={() => onClick ? onClick(task) : navigate(`/tasks/${task._id}`)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <h4 style={{
          fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.4, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {task.title}
        </h4>
        <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
      </div>

      {/* Project chip */}
      {task.project && (
        <div style={{ marginBottom: '0.6rem' }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20,
            display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: task.project.color || '#6366f1', display: 'inline-block' }} />
            {task.project.title}
          </span>
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <span className={`badge ${status.cls}`}>{status.label}</span>
        <span className={`badge ${priority.cls}`} style={{ textTransform: 'capitalize' }}>
          <Flag size={10} />{task.priority}
        </span>
        {isOverdue && <span className="badge badge-overdue">Overdue</span>}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {task.assignedTo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>
              {getInitials(task.assignedTo.name)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.assignedTo.name}</span>
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <User size={12} /> Unassigned
          </span>
        )}
        {task.dueDate && isValid(new Date(task.dueDate)) && (
          <span style={{ fontSize: '0.72rem', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
