import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const removeUser = async (id) => {
    try {
      const currentPath = window.location.pathname;
      const isAdminPath = currentPath === "/admin";
      const token = isAdminPath
        ? localStorage.getItem("adminToken")
        : localStorage.getItem("memberToken");

      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setUsers(users.filter((user) => user._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    const isAdminPath = currentPath === "/admin";
    const token = isAdminPath
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("memberToken");

    if (token) {
      fetch("http://localhost:3000/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setCurrentUser(data);
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
        });
    }

    fetchUsers();
  }, []);

  if (loading) return <div className="text-white">Loading users...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-white text-4xl mb-5 -mt-3 font-semibold">
        Team Members
      </h1>
      {users.length === 0 ? (
        <p className="text-white">No users found.</p>
      ) : (
        <ul className="space-y-4">
          {users.map((user) => (
            <li
              key={user._id}
              className="bg-gray-900 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="text-white font-semibold">
                  <span className="text-red-400">Name:</span> {user.name}
                </p>
                <p className="text-white font-semibold">
                  <span className="text-red-400">Email:</span> {user.email}
                </p>
              </div>
              {currentUser &&
                currentUser.role &&
                currentUser.role.toLowerCase() === "admin" && (
                  <button
                    onClick={() => removeUser(user._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg cursor-pointer active:scale-90 flex items-center"
                  >
                    <X /> Remove
                  </button>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Team;
