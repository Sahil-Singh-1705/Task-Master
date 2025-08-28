import React, { useState, useEffect } from "react";
import { Frown } from "lucide-react";

const Assign = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

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

    fetch("http://localhost:3000/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
      });

    fetch("http://localhost:3000/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
  }, []);

  const handleAssign = () => {
    if (!selectedTaskId || !selectedUserId) {
      alert("Please select both a task and a member to assign.");
      return;
    }
    const task = tasks.find((t) => t._id === selectedTaskId);
    if (!task) {
      alert("Selected task not found.");
      return;
    }

    const currentPath = window.location.pathname;
    const isAdminPath = currentPath === "/admin";
    const token = isAdminPath
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("memberToken");

    if (!token) {
      alert("Authentication required. Please log in again.");
      return;
    }

    const updatedTask = { ...task, assignedTo: selectedUserId };
    fetch(`http://localhost:3000/api/tasks/${selectedTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...updatedTask,
        userId: currentUser?._id,
        userName: currentUser?.name,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to assign task");
        }
        return res.json();
      })
      .then(() => {
        alert("Task assigned successfully");
        setSelectedTaskId("");
        setSelectedUserId("");
      })
      .catch((err) => {
        console.error(err);
        alert("Error assigning task");
      });
  };

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="text-white mt-5 max-w-md mx-auto p-4 bg-gray-900 rounded-lg hover:shadow-lg hover:shadow-red-500/50">
        <h1 className="text-3xl mb-5 flex items-center gap-2">
          <Frown size={40} className="text-red-500" />
          Sorry, You Cannot access !
        </h1>
        <p className="text-gray-400">
          You do not have permission to assign tasks. Only admin can access this
          feature.
        </p>
      </div>
    );
  }

  return (
    <div className="text-white mt-5 max-w-md mx-auto p-4 bg-gray-900 rounded-lg">
      <h1 className="text-3xl mb-5">Assign Task to Member</h1>
      <div className="mb-4">
        <label className="block mb-1" htmlFor="taskSelect">
          Select Task:
        </label>
        <select
          id="taskSelect"
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full p-2 rounded bg-gray-200 text-black"
        >
          <option value="">-- Select a Task --</option>
          {tasks.map((task) => (
            <option key={task._id} value={task._id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1" htmlFor="userSelect">
          Select Member:
        </label>
        <select
          id="userSelect"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full p-2 rounded bg-gray-200 text-black"
        >
          <option value="">-- Select a Member --</option>
          {users
            .filter((user) => user.role !== "admin")
            .map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
        </select>
      </div>
      <button
        onClick={handleAssign}
        className="bg-red-600 hover:bg-red-700 mt-3 px-4 py-2 rounded font-semibold w-full cursor-pointer transition active:scale-90"
      >
        Assign Task
      </button>
    </div>
  );
};

export default Assign;
