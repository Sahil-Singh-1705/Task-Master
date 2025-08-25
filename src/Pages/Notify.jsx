import React, { useState, useEffect } from "react";
import { Bell, Clock, X } from 'lucide-react';
import io from 'socket.io-client';

const Notify = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);

        fetchNotifications();

        newSocket.on('notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const fetchNotifications = () => {
        const currentPath = window.location.pathname;
        const isAdminPath = currentPath === '/admin';
        const token = isAdminPath ? localStorage.getItem("adminToken") : localStorage.getItem("memberToken");
        if (!token) {
            setError("Please login to view notifications");
            setLoading(false);
            return;
        }

        fetch("http://localhost:3000/api/notifications", {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to fetch notifications");
                }
                return res.json();
            })
            .then(data => {
                setNotifications(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching notifications:", err);
                setError(err.message);
                setLoading(false);
            });
    };

    const markAsRead = (notificationId) => {
        const token = localStorage.getItem('token');
        fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
            method: "PUT",
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(() => {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif._id === notificationId ? { ...notif, read: true } : notif
                    )
                );
            })
            .catch(err => console.error("Error marking notification as read:", err));
    };

    const deleteNotification = (notificationId) => {
        const currentPath = window.location.pathname;
        const isAdminPath = currentPath === '/admin';
        const token = isAdminPath ? localStorage.getItem("adminToken") : localStorage.getItem("memberToken");
        fetch(`http://localhost:3000/api/notifications/${notificationId}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(() => {
                setNotifications(prev => 
                    prev.filter(notif => notif._id !== notificationId)
                );
            })
            .catch(err => console.error("Error deleting notification:", err));
    };


    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    if (loading) {
        return (
            <div className="text-white text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                <p className="mt-4">Loading notifications...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-400 text-center py-10">
                <Bell size={48} className="mx-auto mb-4" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="text-white max-w-4xl p-6">
            <div className="flex items-center mb-6">
                <Bell size={40} className="text-red-500 mr-2 mb-0.5"/>
                <h1 className="text-4xl font-bold mb-1">Notifications</h1>
                <span className="ml-3 bg-red-500 text-white px-2 rounded-full text-xl flex items-center mt-0.5">
                    {notifications.filter(n => !n.read).length}
                </span>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <Bell size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-xl">No notifications yet</p>
                    <p className="text-sm mt-2">Activity will appear here when tasks are moved or updated</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <div 
                            key={notification._id} 
                            className={`bg-gray-800 rounded-lg p-4 border-l-4 transition-all duration-200 ${
                                notification.read ? 'border-gray-600 opacity-75' : 'border-red-500'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-white text-lg">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center text-gray-400 text-sm mt-2">
                                        <Clock size={14} className="mr-1" />
                                        <span>{formatTime(notification.timestamp)}</span>
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification._id)}
                                                className="ml-4 text-blue-400 hover:text-blue-300 text-xs cursor-pointer"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {!notification.read && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    )}
                                    {notification.read && (
                                        <button
                                            onClick={() => deleteNotification(notification._id)}
                                            className="text-red-500 hover:bg-gray-200 text-md font-medium cursor-pointer mt-4 transition bg-white px-2 py-1 rounded-lg flex items-center gap-0.5 active:scale-90"
                                            title="Remove notification"
                                        >
                                           <X size={20}/> Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notify;
