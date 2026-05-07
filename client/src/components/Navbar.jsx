import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mr-2 group-hover:scale-105 transition-transform duration-200 shadow-md">
                                T
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">TaskFlow</span>
                        </Link>
                    </div>
                    {user && (
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 text-xs font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium mr-1">{user.name}</span>
                                <span className="text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md capitalize">{user.role}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-sm font-medium text-slate-500 hover:text-red-600 transition-colors duration-200"
                            >
                                <LogOut className="h-4 w-4 mr-1.5" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
