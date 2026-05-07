import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { getProject, updateProject } from '../services/projectService';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { getUsers } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, Clock, Circle, Plus, Trash2, UserPlus, Users, UserMinus, Calendar, AlertCircle, Search, Filter, ArrowUpDown } from 'lucide-react';

const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // for members
    
    // Advanced Filtering & Sorting State for Tasks
    const [taskSearchQuery, setTaskSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', assignee: '', dueDate: '' });

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            setError(null);
            const [projectData, tasksData, usersData] = await Promise.all([
                getProject(id),
                getTasks(id),
                getUsers()
            ]);
            setProject(projectData.data);
            setTasks(tasksData.data);
            setAllUsers(usersData.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch project details', error);
            setError('Failed to fetch project details. Please try again.');
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            setError(null);
            await createTask(id, newTask);
            setNewTask({ title: '', description: '', status: 'todo', assignee: '', dueDate: '' });
            setShowTaskForm(false);
            fetchProjectData(); // Refresh
        } catch (error) {
            console.error('Failed to create task', error);
            setError(error.response?.data?.message || 'Failed to create task.');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            setError(null);
            await updateTask(taskId, { status: newStatus });
            fetchProjectData();
        } catch (error) {
            console.error('Failed to update task status', error);
            setError('Failed to update task status.');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            setError(null);
            await deleteTask(taskId);
            fetchProjectData();
        } catch (error) {
            console.error('Failed to delete task', error);
            setError('Failed to delete task.');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );
    if (!project) return (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Project not found</h2>
        </div>
    );

    const StatusIcon = ({ status }) => {
        if (status === 'done') return <CheckCircle className="text-green-500 w-5 h-5" />;
        if (status === 'in-progress') return <Clock className="text-yellow-500 w-5 h-5" />;
        return <Circle className="text-gray-400 w-5 h-5" />;
    };

    const isOwnerOrAdmin = project && user && (project.owner?._id === user.id || project.owner?._id === user._id || user.role === 'admin');

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUserId) return;
        try {
            setError(null);
            const updatedMembers = [...(project.members || []).map(m => m._id), selectedUserId];
            await updateProject(id, { members: updatedMembers });
            setSelectedUserId('');
            setSearchQuery('');
            fetchProjectData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to add member.');
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            setError(null);
            const updatedMembers = (project.members || []).filter(m => m._id !== memberId).map(m => m._id);
            await updateProject(id, { members: updatedMembers });
            fetchProjectData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to remove member.');
        }
    };

    const availableUsersToAdd = allUsers.filter(u => 
        u._id !== project.owner?._id && !(project.members || []).some(m => m._id === u._id)
    ).filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const projectMembersAndOwner = [project.owner, ...(project.members || [])].filter(Boolean);

    const canUpdateTaskStatus = (task) => isOwnerOrAdmin || (task.assignee?._id === user?.id || task.assignee?._id === user?._id);

    const filteredAndSortedTasks = tasks.filter(task => {
        if (taskSearchQuery) {
            const query = taskSearchQuery.toLowerCase();
            const matchTitle = task.title?.toLowerCase().includes(query);
            const matchDesc = task.description?.toLowerCase().includes(query);
            if (!matchTitle && !matchDesc) return false;
        }
        if (filterStatus === 'todo' && task.status !== 'todo') return false;
        if (filterStatus === 'in-progress' && task.status !== 'in-progress') return false;
        if (filterStatus === 'done' && task.status !== 'done') return false;
        if (filterStatus === 'assigned-to-me' && task.assignee?._id !== user.id && task.assignee !== user.id && task.assignee?._id !== user._id && task.assignee !== user._id) return false;
        if (filterStatus === 'overdue') {
            if (task.status === 'done') return false;
            if (!task.dueDate || new Date(task.dueDate) >= new Date(new Date().setHours(0,0,0,0))) return false;
        }
        return true;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortBy === 'due-nearest') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (sortBy === 'due-latest') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(b.dueDate) - new Date(a.dueDate);
        }
        return 0;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            {/* Project Header */}
            <div className="bg-white/80 backdrop-blur border border-slate-200/60 shadow-sm rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">Project</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{project.name}</h1>
                    <p className="text-lg text-slate-600 mb-6 max-w-3xl leading-relaxed">{project.description}</p>
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold mr-3 shadow-sm border border-white">
                            {project.owner?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{project.owner?.name}</p>
                            <p className="text-xs text-slate-500">Project Owner</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                {/* Left Column: Tasks (occupies 2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/50 p-2 rounded-2xl gap-4">
                        <h2 className="text-2xl font-bold text-slate-900 px-2">Tasks <span className="text-slate-400 text-lg ml-2 font-normal">({tasks.length})</span></h2>
                        <div className="flex items-center gap-3 w-full sm:w-auto px-2 sm:px-0">
                            {isOwnerOrAdmin && (
                                <button
                                    onClick={() => setShowTaskForm(!showTaskForm)}
                                    className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl shadow-sm hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add Task
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter and Sort Controls */}
                    <div className="flex flex-col gap-4 bg-white/50 p-4 rounded-2xl border border-slate-200/60">
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={taskSearchQuery}
                                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-colors"
                                />
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none block w-full pl-9 pr-8 py-2 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-colors cursor-pointer bg-white"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="due-nearest">Due: Nearest</option>
                                    <option value="due-latest">Due: Latest</option>
                                </select>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ArrowUpDown className="h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>
                        <div className="flex overflow-x-auto gap-2 hide-scrollbar pb-1">
                            {['all', 'todo', 'in-progress', 'done', 'overdue', 'assigned-to-me'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        filterStatus === status 
                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {status === 'all' ? 'All Tasks' : 
                                     status === 'assigned-to-me' ? 'Assigned To Me' :
                                     status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {showTaskForm && isOwnerOrAdmin && (
                        <form onSubmit={handleCreateTask} className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                            <h3 className="text-lg font-bold text-slate-900 mb-5">Create New Task</h3>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="What needs to be done?"
                                    />
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        required
                                        rows="3"
                                        className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Provide more details..."
                                    />
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                                    <select
                                        className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors bg-white cursor-pointer"
                                        value={newTask.assignee}
                                        onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        {projectMembersAndOwner.map(member => (
                                            <option key={member._id} value={member._id}>{member.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                                    <input
                                        type="date"
                                        className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors text-slate-700"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors">
                                    Save Task
                                </button>
                                <button type="button" onClick={() => setShowTaskForm(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-4">
                        {filteredAndSortedTasks.map((task) => (
                            <div key={task._id} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-start flex-1 w-full">
                                        <div className="mt-1 mr-4 flex-shrink-0">
                                            <StatusIcon status={task.status} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-slate-900 leading-tight">{task.title}</h4>
                                            <p className="text-sm text-slate-500 mt-1 mb-3">{task.description}</p>
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                {task.dueDate && (
                                                    <div className={`flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium ${
                                                        task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) 
                                                        ? 'bg-red-50 text-red-700 border-red-200' 
                                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) ? (
                                                            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-red-500" />
                                                        ) : (
                                                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                        )}
                                                        {task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) ? 'Overdue: ' : 'Due: '}
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {task.completedAt && (
                                                    <div className={`flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium ${
                                                        task.dueDate && new Date(task.completedAt) > new Date(new Date(task.dueDate).setHours(23,59,59,999))
                                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}>
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                        Submitted: {new Date(task.completedAt).toLocaleDateString()}
                                                        {task.dueDate && new Date(task.completedAt) > new Date(new Date(task.dueDate).setHours(23,59,59,999)) && ' (Late)'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {task.assignee ? (
                                                    <div className="flex items-center px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                                                        <div className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold mr-1.5">
                                                            {task.assignee.name.charAt(0)}
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-700">{task.assignee.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-slate-50 text-slate-400 text-xs font-medium rounded-lg border border-slate-200 border-dashed">Unassigned</span>
                                                )}
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                                    task.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                                    task.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {task.status.replace('-', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                            disabled={!canUpdateTaskStatus(task)}
                                            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors"
                                        >
                                            <option value="todo">Todo</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                        {isOwnerOrAdmin && (
                                            <button
                                                onClick={() => handleDeleteTask(task._id)}
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Delete task"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredAndSortedTasks.length === 0 && (
                            <div className="text-center py-16 px-4 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/50">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Circle className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">No tasks found</h3>
                                <p className="text-slate-500">Try adjusting your filters or search query.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Members (occupies 1 column) */}
                <div className="lg:col-span-1 mt-8 lg:mt-0">
                    <div className="bg-white/80 backdrop-blur border border-slate-200/60 shadow-sm rounded-3xl p-6 sticky top-24">
                        <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-indigo-50 rounded-xl mr-3">
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Team Members</h2>
                        </div>
                        
                        {project.members && project.members.length > 0 ? (
                            <ul className="space-y-4 mb-6">
                                {project.members.map(member => (
                                    <li key={member._id} className="flex justify-between items-center group">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-3 border border-indigo-50">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-tight">{member.name}</p>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>
                                        {isOwnerOrAdmin && (
                                            <button 
                                                onClick={() => handleRemoveMember(member._id)}
                                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                                                title="Remove member"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-6 mb-6 bg-slate-50 rounded-2xl">
                                <p className="text-sm text-slate-500">No members added yet.</p>
                            </div>
                        )}

                        {isOwnerOrAdmin && (
                            <form onSubmit={handleAddMember} className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                <label className="text-sm font-medium text-slate-700">Add new member</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setSelectedUserId(''); // reset selection on new search
                                        }}
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors mb-2"
                                    />
                                </div>
                                {searchQuery && (
                                    <select
                                        size={Math.min(availableUsersToAdd.length + 1, 5)}
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        className="block w-full px-3 py-2 text-sm border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                                    >
                                        <option value="" disabled>Select a user...</option>
                                        {availableUsersToAdd.length > 0 ? (
                                            availableUsersToAdd.map(u => (
                                                <option key={u._id} value={u._id} className="py-1">{u.name} ({u.email})</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No users found</option>
                                        )}
                                    </select>
                                )}
                                <button
                                    type="submit"
                                    disabled={!selectedUserId}
                                    className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add to Project
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
