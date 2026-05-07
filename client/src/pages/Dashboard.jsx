import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject } from '../services/projectService';
import { getTasks, updateTask } from '../services/taskService';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Folder, CheckCircle, Clock, Circle, Calendar, AlertCircle, Search, Filter, ArrowUpDown } from 'lucide-react';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const { user } = useContext(AuthContext);

    // Advanced Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setError(null);
            const [projectsData, tasksData] = await Promise.all([
                getProjects(),
                getTasks()
            ]);
            setProjects(projectsData.data);
            setMyTasks(tasksData.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
            setError('Failed to fetch dashboard data. Please try again.');
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            setError(null);
            await createProject(newProject);
            setNewProject({ name: '', description: '' });
            setShowForm(false);
            fetchProjects();
        } catch (error) {
            console.error('Failed to create project', error);
            setError(error.response?.data?.message || 'Failed to create project.');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            setError(null);
            await updateTask(taskId, { status: newStatus });
            // Refresh tasks after updating
            fetchProjects();
        } catch (error) {
            console.error('Failed to update task status', error);
            setError('Failed to update task status.');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    const totalProjects = projects.length;
    const totalTasks = myTasks.length;
    const completedTasks = myTasks.filter(t => t.status === 'done').length;
    const pendingTasks = myTasks.filter(t => t.status !== 'done').length;

    const filteredAndSortedTasks = myTasks.filter(task => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            {/* Stats Section */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white/80 backdrop-blur border border-slate-200/60 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                        <dt className="text-sm font-medium text-slate-500 truncate">Total Projects</dt>
                        <dd className="mt-2 text-3xl font-semibold text-slate-900">{totalProjects}</dd>
                    </div>
                    <div className="bg-white/80 backdrop-blur border border-slate-200/60 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                        <dt className="text-sm font-medium text-slate-500 truncate">Assigned Tasks</dt>
                        <dd className="mt-2 text-3xl font-semibold text-slate-900">{totalTasks}</dd>
                    </div>
                    <div className="bg-white/80 backdrop-blur border border-slate-200/60 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                        <dt className="text-sm font-medium text-slate-500 truncate">Completed Tasks</dt>
                        <dd className="mt-2 text-3xl font-semibold text-emerald-600">{completedTasks}</dd>
                    </div>
                    <div className="bg-white/80 backdrop-blur border border-slate-200/60 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                        <dt className="text-sm font-medium text-slate-500 truncate">Pending Tasks</dt>
                        <dd className="mt-2 text-3xl font-semibold text-amber-600">{pendingTasks}</dd>
                    </div>
                </div>
            </div>

            {/* Projects Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
                    {user.role === 'admin' && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            New Project
                        </button>
                    )}
                </div>
            
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {showForm && user.role === 'admin' && (
                <form onSubmit={handleCreateProject} className="bg-white/80 backdrop-blur border border-slate-200/60 p-6 rounded-2xl shadow-lg mb-8">
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                        <input
                            type="text"
                            required
                            className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            required
                            className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                            rows="3"
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors">
                        Create Project
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Link
                        key={project._id}
                        to={`/projects/${project._id}`}
                        className="group bg-white/80 backdrop-blur border border-slate-200/60 overflow-hidden shadow-sm rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                    <Folder className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="ml-3 text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                            </div>
                            <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1">{project.description}</p>
                            
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold mr-2">
                                        {project.owner?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">{project.owner?.name}</span>
                                </div>
                                {project.owner?._id === user._id && (
                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wide rounded-full">Owner</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 px-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                        <Folder className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No projects</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by creating a new project or waiting for an invite.</p>
                    </div>
                )}
            </div>
            </div>

            {/* Tasks Section */}
            <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-slate-900">My Tasks</h2>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-colors"
                            />
                        </div>
                        <div className="relative">
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
                </div>
                
                {/* Filter Tabs */}
                <div className="flex overflow-x-auto pb-4 mb-2 gap-2 hide-scrollbar">
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
                
                <div className="bg-white shadow-sm border border-slate-200/60 rounded-2xl overflow-hidden">
                    <ul className="divide-y divide-slate-100">
                        {filteredAndSortedTasks.map((task) => (
                            <li key={task._id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between sm:flex-row flex-col gap-4">
                                <div className="flex items-start flex-1 w-full">
                                    <div className="mt-1 mr-4 flex-shrink-0">
                                        {task.status === 'done' && <CheckCircle className="text-emerald-500 w-5 h-5" />}
                                        {task.status === 'in-progress' && <Clock className="text-amber-500 w-5 h-5" />}
                                        {task.status === 'todo' && <Circle className="text-slate-300 w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-900">{task.title}</h4>
                                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                                            <span className="font-medium text-indigo-600">{task.project?.name}</span> &bull; {task.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                            {task.dueDate && (
                                                <div className={`flex items-center px-2 py-1 rounded-md border text-xs font-medium ${
                                                    task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) 
                                                    ? 'bg-red-50 text-red-700 border-red-200' 
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) ? (
                                                        <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
                                                    ) : (
                                                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                                    )}
                                                    {task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) ? 'Overdue: ' : 'Due: '}
                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                </div>
                                            )}
                                            {task.completedAt && (
                                                <div className={`flex items-center px-2 py-1 rounded-md border text-xs font-medium ${
                                                    task.dueDate && new Date(task.completedAt) > new Date(new Date(task.dueDate).setHours(23,59,59,999))
                                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Submitted: {new Date(task.completedAt).toLocaleDateString()}
                                                    {task.dueDate && new Date(task.completedAt) > new Date(new Date(task.dueDate).setHours(23,59,59,999)) && ' (Late)'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center sm:w-auto w-full justify-end sm:ml-4">
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                        className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                                    >
                                        <option value="todo">Todo</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            </li>
                        ))}
                        {filteredAndSortedTasks.length === 0 && (
                            <li className="p-12 text-center">
                                <CheckCircle className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                                <p className="text-slate-500 font-medium text-sm">No tasks found</p>
                                <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or search query.</p>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
