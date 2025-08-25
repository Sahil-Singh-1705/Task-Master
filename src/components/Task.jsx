import React, { useState, useEffect } from "react";

const statuses = ["To Do", "In Progress", "Done"];
const priorities = ["Low", "Medium", "High"];

const Task = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "To Do",
    assignedTo: "",
    priority: "Medium",
  });
  const [editIndex, setEditIndex] = useState(-1);

  useEffect(() => {
    const getToken = () => {
      const currentPath = window.location.pathname;
      const isAdminPath = currentPath === '/admin';
      return isAdminPath ? localStorage.getItem('adminToken') : localStorage.getItem('token');
    };

    const token = getToken();
    
    if (token) {
      fetch("http://localhost:3000/api/profile", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log("User data:", data);
          setCurrentUser(data);
        })
        .catch(err => {
          console.error("Error fetching user profile:", err);
        });
    }

    fetch("http://localhost:3000/api/tasks", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const formattedTasks = data.map(task => ({
          ...task,
          dueDate: new Date(task.dueDate).toISOString().split("T")[0],
          assignedTo: task.assignedTo ? task.assignedTo._id : "",
          assignedToName: task.assignedTo ? task.assignedTo.name : "Unassigned",
        }));
        setTasks(formattedTasks);
      })
      .catch(err => {
        console.error("Error fetching tasks:", err);
      });

    fetch("http://localhost:3000/api/users", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setUsers(data);
      })
      .catch(err => {
        console.error("Error fetching users:", err);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const getToken = () => {
      const currentPath = window.location.pathname;
      const isAdminPath = currentPath === '/admin';
      return isAdminPath ? localStorage.getItem('adminToken') : localStorage.getItem('token');
    };
    const token = getToken();
    
    fetch("http://localhost:3000/api/profile", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(userData => {
        const taskData = {
          ...form,
          userId: userData._id,
          userName: userData.name
        };

        if (editIndex === -1) {
          return fetch("http://localhost:3000/api/tasks", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
          })
            .then(res => {
              if (!res.ok) {
                throw new Error("Failed to add task");
              }
              return res.json();
            })
            .then(newTask => {
              newTask.dueDate = new Date(newTask.dueDate).toISOString().split("T")[0];
              newTask.assignedTo = form.assignedTo;
              newTask.assignedToName = users.find(u => u._id === form.assignedTo)?.name || "Unassigned";
              setTasks(prev => [...prev, newTask]);
              setForm({
                title: "",
                description: "",
                dueDate: "",
                status: "To Do",
                assignedTo: "",
                priority: "Medium",
              });
            });
        } else {
          const taskToUpdate = tasks[editIndex];
          return fetch(`http://localhost:3000/api/tasks/${taskToUpdate._id}`, {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
          })
            .then(res => {
              if (!res.ok) {
                throw new Error("Failed to update task");
              }
              return res.json();
            })
            .then(updatedTask => {
              updatedTask.dueDate = new Date(updatedTask.dueDate).toISOString().split("T")[0];
              updatedTask.assignedTo = form.assignedTo;
              updatedTask.assignedToName = users.find(u => u._id === form.assignedTo)?.name || "Unassigned";
              setTasks(prev => prev.map((task, idx) => idx === editIndex ? updatedTask : task));
              setEditIndex(-1);
              setForm({
                title: "",
                description: "",
                dueDate: "",
                status: "To Do",
                assignedTo: "",
                priority: "Medium",
              });
            });
        }
      })
      .catch(err => {
        console.error(err);
        alert("Error processing task");
      });
  };

  const handleEdit = (index) => {
    setForm(tasks[index]);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    const taskToDelete = tasks[index];
    if (window.confirm("Are you sure you want to delete this task?")) {
      const getToken = () => {
        const currentPath = window.location.pathname;
        const isAdminPath = currentPath === '/admin';
        return isAdminPath ? localStorage.getItem('adminToken') : localStorage.getItem('token');
      };
      const token = getToken();
      
      fetch("http://localhost:3000/api/profile", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(userData => {
          const deleteData = {
            userId: userData._id,
            userName: userData.name
          };
          
          return fetch(`http://localhost:3000/api/tasks/${taskToDelete._id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deleteData)
          });
        })
        .then(res => {
          if (!res.ok) {
            throw new Error("Failed to delete task");
          }
          return res.json();
        })
        .then(() => {
          setTasks(prev => prev.filter((_, idx) => idx !== index));
          if (editIndex === index) {
            setForm({
              title: "",
              description: "",
              dueDate: "",
              status: "To Do",
              assignedTo: "",
              priority: "Medium",
            });
            setEditIndex(-1);
          }
        })
        .catch(err => {
          console.error(err);
          alert("Error deleting task");
        });
    }
  };

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const onDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t._id === taskId);
    
    if (task && task.status !== newStatus) {
      const currentPath = window.location.pathname;
      const isAdminPath = currentPath === '/admin';
      const token = isAdminPath ? localStorage.getItem("adminToken") : localStorage.getItem("memberToken");
      
      if (!token) {
        alert("Authentication required. Please log in again.");
        return;
      }
      
      fetch("http://localhost:3000/api/profile", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error("Failed to authenticate");
          }
          return res.json();
        })
        .then(userData => {
          const updatedTask = { 
            ...task, 
            status: newStatus,
            userId: userData._id,
            userName: userData.name
          };
          
          return fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedTask)
          });
        })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Server responded with status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? data : t))
          );
        })
        .catch((err) => {
          console.error("Error updating task status:", err);
          alert(`Error updating task status: ${err.message}`);
        });
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const tasksByStatus = {};
  statuses.forEach((status) => {
    tasksByStatus[status] = tasks.filter((task) => task.status === status);
  });

  return (
    <div className="text-white">
      <h1 className="text-4xl mb-5 font-semibold">Task Management</h1>
      
      {currentUser && currentUser.role && currentUser.role.toLowerCase() === 'admin' && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 max-w-md shadow-lg shadow-gray-400/50 bg-zinc-950 p-6 rounded-lg"
        >
          <div>
            <label className="block mb-1 text-lg font-medium" htmlFor="title">
              Title :
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Enter the task title"
              value={form.title}
              onChange={handleChange}
              className="w-full p-2 rounded text-black bg-gray-200 outline-red-500 focus:outline-3"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-lg font-medium" htmlFor="description">
              Description :
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter the task description..."
              value={form.description}
              onChange={handleChange}
              className="w-full p-2 rounded text-black bg-gray-200 outline-red-500 focus:outline-3"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-lg font-medium" htmlFor="dueDate">
              Due Date :
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full p-2 rounded text-black bg-gray-200 outline-red-500 focus:outline-3"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-lg font-medium" htmlFor="priority">
              Priority :
            </label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full p-2 rounded text-black bg-gray-200 outline-red-500 focus:outline-3"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-lg font-medium" htmlFor="assignedTo">
              Assign To :
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={form.assignedTo}
              onChange={handleChange}
              className="w-full p-2 rounded text-black bg-gray-200 outline-red-500 focus:outline-3"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-xl px-4 py-2 rounded font-semibold w-full mt-4 cursor-pointer transition active:scale-90"
          >
            {editIndex === -1 ? "Add Task" : "Update Task"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statuses.map((status) => (
          <div
            key={status}
            onDrop={(e) => onDrop(e, status)}
            onDragOver={onDragOver}
            className="bg-gray-800 p-4 rounded-lg min-h-[300px]"
          >
            <h2 className="text-2xl font-semibold mb-4">{status} :</h2>
            {tasksByStatus[status].length > 0 ? (
              tasksByStatus[status].map((task, idx) => (
                <div
                  key={task._id}
                  draggable
                  onDragStart={(e) => onDragStart(e, task._id)}
                  className="bg-gray-950 p-4 rounded-lg mb-3 transition hover:shadow-lg hover:shadow-red-500/50 space-y-2 cursor-move"
                >
                  <h3 className="text-xl font-semibold">{task.title}</h3>
                  <p className="text-gray-300">{task.description}</p>
                  <p className="text-gray-400 text-sm">Due: {task.dueDate}</p>
                  <p className="text-gray-400 text-sm">Priority: {task.priority}</p>
                  <p className="text-gray-400 text-sm">
                    Assigned To: {task.assignedToName || "Unassigned"}
                  </p>
                  {currentUser && currentUser.role && currentUser.role.toLowerCase() === 'admin' && (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEdit(tasks.findIndex(t => t._id === task._id))}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white cursor-pointer transition active:scale-90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tasks.findIndex(t => t._id === task._id))}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white cursor-pointer transition active:scale-90"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No tasks in this column.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Task;
