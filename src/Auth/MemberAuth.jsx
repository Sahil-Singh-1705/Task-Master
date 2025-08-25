import { useState } from "react";

const MemberAuth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setMessage("");
    setIsLogin(!isLogin);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const baseUrl = "http://localhost:3000";
    const url = isLogin ? `${baseUrl}/api/login` : `${baseUrl}/api/signup`;
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setMessage(data.errors.map((err) => err.msg).join(", "));
        } else if (data.message) {
          setMessage(data.message);
        } else {
          setMessage("An unexpected error occurred.");
        }
      } else {
        if (isLogin) {
          if (data.role === 'admin') {
            setMessage("Please use the admin login page for admin access.");
            return;
          }
          
          localStorage.setItem("memberToken", data.token);
          setMessage("Login successful!");
          if (onLogin) {
            onLogin(data.role);
          }
        } else {
          setMessage("Signup successful! Please login.");
          setIsLogin(true);
          setFormData({ name: "", email: "", password: "" });
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
      <h2 className="text-2xl mb-4 text-center underline underline-offset-2 text-blue-400">
        {isLogin ? "Member Login" : "Member Sign Up"}
      </h2>
      {message && (
        <div className={`mb-4 ${message.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block mb-1" htmlFor="name">
              Name :
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 outline-blue-500 focus:outline-3"
              required={!isLogin}
              disabled={loading}
            />
          </div>
        )}
        <div>
          <label className="block mb-1" htmlFor="email">
            Email :
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 outline-blue-500 focus:outline-3"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1">
            Password : 
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 outline-blue-500 focus:outline-3"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className={`w-full py-2 rounded text-white font-semibold cursor-pointer mt-2 ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loading}
        >
          {loading
            ? isLogin
              ? "Logging in..."
              : "Signing up..."
            : isLogin
            ? "Member Login"
            : "Member Sign Up"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={toggleMode}
          className="text-blue-500 hover:underline hover:underline-offset-2 cursor-pointer"
          disabled={loading}
        >
          {isLogin ? "Create an account" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default MemberAuth;
