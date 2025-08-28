import { useState } from "react";

const AdminAuth = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const baseUrl = "http://localhost:3000";
    const url = `${baseUrl}/api/login`;
    const payload = { email: formData.email, password: formData.password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid credentials");
      } else {
        if (data.role !== "admin") {
          setMessage("Access denied. Admin privileges required.");
          return;
        }

        localStorage.setItem("adminToken", data.token);
        setMessage("Admin login successful!");
        if (onLogin) {
          onLogin(data.role);
        }
      }
    } catch (error) {
      setMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 bg-gray-800 text-white rounded-lg">
      <h2 className="text-2xl mb-4 text-center underline underline-offset-2 text-yellow-400">
        Admin Login
      </h2>
      {message && (
        <div
          className={`mb-4 ${
            message.includes("successful") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1" htmlFor="email">
            Email :
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter admin email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 outline-yellow-500 focus:outline-3"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1">Password :</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter admin password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 outline-yellow-500 focus:outline-3"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className={`w-full py-2 rounded text-white font-semibold cursor-pointer mt-2 ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Admin Login"}
        </button>
      </form>
    </div>
  );
};

export default AdminAuth;
