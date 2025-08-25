import { useState, useEffect, useRef } from "react";
import Assign from "./components/Assign";
import Profile from "./Pages/Profile";
import Task from "./components/Task";
import Team from "./components/Team";
import MemberAuth from "./Auth/MemberAuth";
import AdminAuth from "./Auth/AdminAuth";
import { LogOut, User, ChevronDown, Users, ClipboardList, ListTodo, CircleUserRound, Bell, } from 'lucide-react';
import Notify from "./Pages/Notify";

const App = () => {
  const [activeMenu, setActiveMenu] = useState('task');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const isAdminPath = currentPath === '/admin';
    
    const token = isAdminPath ? localStorage.getItem("adminToken") : localStorage.getItem("memberToken");
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        setIsAuthenticated(true);
        if (activeMenu === 'auth') {
          setActiveMenu('task');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        if (isAdminPath) {
          localStorage.removeItem("adminToken");
        } else {
          localStorage.removeItem("memberToken");
        }
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationCount();
    }
  }, [isAuthenticated]);

  const fetchNotificationCount = () => {
    const currentPath = window.location.pathname;
    const isAdminPath = currentPath === '/admin';
    const token = isAdminPath ? localStorage.getItem("adminToken") : localStorage.getItem("memberToken");
    
    if (!token) return;

    fetch("http://localhost:3000/api/notifications", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const unreadCount = data.filter(notification => !notification.read).length;
        setNotificationCount(unreadCount);
      })
      .catch(err => console.error("Error fetching notification count:", err));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    const currentPath = window.location.pathname;
    const isAdminPath = currentPath === '/admin';

    if (isAdminPath) {
      localStorage.removeItem("adminToken");
    } else {
      localStorage.removeItem("memberToken");
    }

    setIsAuthenticated(false);
    setUserRole(null);
    setActiveMenu('task');
    setIsDropdownOpen(false);
    window.history.pushState({}, '', '/');
  };

  const handleProfileClick = () => {
    setActiveMenu('profile');
    setIsDropdownOpen(false);
  };

  const handleNotifyClick = () => {
    setActiveMenu('notify');
    setIsDropdownOpen(false);
  }

  const renderContent = () => {
    const isAdminPath = currentPath === '/admin';
    
    if (!isAuthenticated) {
      if (isAdminPath) {
        return <AdminAuth onLogin={(role) => {
          setIsAuthenticated(true);
          setUserRole(role);
          setActiveMenu('task');
        }} />;
      } else {
        return <MemberAuth onLogin={(role) => {
          setIsAuthenticated(true);
          setUserRole(role);
          setActiveMenu('task');
        }} />;
      }
    }
    
    if (userRole === 'admin' && !isAdminPath) {
      window.history.pushState({}, '', '/admin');
      setCurrentPath('/admin');
      return null;
    }
    
    if (userRole === 'member' && isAdminPath) {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
      return null;
    }
    
     switch (activeMenu) {
       case 'task':
         return <Task/>;
       case 'assign':
         return <Assign/>
       case 'team':
         return <Team/>
       case 'profile':
         return <Profile/>
       case 'notify':
         return <Notify/>  
       default:
         return null;
     }
   };

   return (
     <div>
       <div className="flex min-h-screen">
         {isAuthenticated && (
           <aside className="w-60 bg-gray-900 text-white p-4 space-y-4 sticky top-0 h-screen overflow-auto">
             <div className="text-3xl font-bold mb-6 de text-red-500 hover:scale-105 flex justify-center mr-4 cursor-pointer" onClick={() => setActiveMenu('task')}>
               Task Board {userRole === 'admin'}
             </div>
    
             <hr className="-mx-4 border-t border-gray-500" />
             <button
               onClick={() => setActiveMenu('task')}
               className="flex items-center text-lg gap-2 p-2 hover:bg-gray-800 cursor-pointer hover:text-red-500 rounded"
             >
               <ClipboardList/> Task Management
             </button>
             <hr className="-mx-4 border-t border-gray-500" />
             <button
               onClick={() => setActiveMenu('assign')}
               className="flex items-center text-lg gap-2 p-2 hover:bg-gray-800 cursor-pointer hover:text-red-500 rounded"
             >
              <ListTodo/> Assign Task
             </button>
             <hr className="-mx-4 border-t border-gray-500" />
             <button
               onClick={() => setActiveMenu('team')}
               className="flex items-center text-lg gap-2 p-2 hover:bg-gray-800 cursor-pointer hover:text-red-500 rounded"
             >
               <Users className="mb-0.5"/> Teams
             </button>
             <hr className="-mx-4 border-t border-gray-500" />
           </aside>
         )}

         <main className="flex-1 p-6 bg-gray-700 relative flex flex-col">
           {isAuthenticated && (
             <div className="flex justify-end mb-3 relative" ref={dropdownRef}>
               <button
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 className="bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xl py-2 px-3 rounded-lg cursor-pointer flex items-center gap-1 transition active:scale-90"
                 aria-haspopup="true"
                 aria-expanded={isDropdownOpen}
               >
                 <User size={24} strokeWidth={2.5} />
                 {notificationCount > 0 && (
                       <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm flex items-center">
                         {notificationCount}
                       </span>
                     )}
                 <ChevronDown size={22} strokeWidth={2.5} />

               </button>
               {isDropdownOpen && (
                 <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-600 rounded shadow-lg z-10">
                   <button
                     onClick={handleProfileClick}
                     className="w-full text-left text-xl px-4 py-2 hover:bg-gray-800 hover:text-green-400 cursor-pointer text-white font-medium flex items-center gap-1"
                   >
                     <CircleUserRound className="mb-0.5" size={25}/> Profile
                   </button>
                   <hr className="-mx-0 border-t border-gray-500" />
                   <button
                     onClick={handleNotifyClick}
                     className="w-full text-left text-xl px-4 py-2 hover:bg-gray-800 hover:text-yellow-300 cursor-pointer text-white font-medium flex items-center gap-1.5 relative"
                   >
                     <Bell/> Notify 
                     {notificationCount > 0 && (
                       <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-sm flex items-center">
                         {notificationCount}
                       </span>
                     )}
                   </button>
                   <hr className="-mx-0 border-t border-gray-500" />
                   <button
                     onClick={handleLogout}
                     className="w-full text-left px-4 py-2 hover:bg-red-900 cursor-pointer text-red-500 text-xl font-medium flex items-center gap-1.5"
                   >
                     <LogOut strokeWidth={2.5} className="ml-0.5" size={22}/> LogOut 
                   </button>
                  </div>
               )}   
             </div>
           )}
           <hr className="-mx-6 border-t border-gray-500 mb-5"/>
           {renderContent()}
         </main>  
       </div>   
     </div>
   )
 }

 export default App;
