import React, { useEffect, useState } from "react";
import { CircleUserRound, SquarePen, X, Save, SaveAll } from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    const currentPath = window.location.pathname;
    const isAdminPath = currentPath === "/admin";
    const token = isAdminPath
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("memberToken");
    console.log("Profile fetch token:", token);
    if (!token) {
      setError("User not logged in");
      return;
    }

    fetch("http://localhost:3000/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log("Profile fetch response status:", res.status);
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.message || "Failed to fetch profile");
          });
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setEditForm({ name: data.name, email: data.email });
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setError(err.message);
      });
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateError(null);
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    setUpdateError(null);
    if (profile) {
      setEditForm({ name: profile.name, email: profile.email });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUpdateError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setUpdateError("User not logged in");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setProfile(data);
      setIsEditing(false);
      setUpdateError(null);
    } catch (err) {
      console.error("Profile update error:", err);
      setUpdateError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="text-white text-3xl">{error}</div>;
  }

  if (!profile) {
    return <div className="text-white text-3xl">Loading profile...</div>;
  }

  return (
    <div className="text-white p-5 max-w-sm bg-gray-900 rounded-lg shadow-md">
      <CircleUserRound
        size={50}
        className="mb-1 text-red-500 bg-black rounded-full mx-auto"
      />
      <h1 className="text-3xl font-bold mb-5 flex justify-center ml-4 text-lime-400">
        User Profile
      </h1>

      {!isEditing ? (
        <>
          <p className="py-1 text-lg">
            <strong className="text-yellow-400 text-lg">Name :</strong>{" "}
            {profile.name}
          </p>
          <p className="py-1 text-lg">
            <strong className="text-yellow-400 text-lg">Email :</strong>{" "}
            {profile.email}
          </p>
          <p className="py-1 text-lg">
            <strong className="text-yellow-400 text-lg">Role :</strong>{" "}
            {profile.role}
          </p>
          <button
            onClick={handleEditClick}
            className="font-semibold font-arial text-lg bg-red-600 px-3 py-1 w-full rounded hover:bg-red-700 active:scale-95 transition cursor-pointer mt-5 flex items-center justify-center gap-1"
          >
            <SquarePen /> Edit Profile
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-white flex items-center justify-start gap-1 mb-4">
            <SquarePen fill="red" size={25} className="mb-0.5" />
            Edit Profile
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-white text-md font-semibold mb-1">
                Name :
              </label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-white text-md font-semibold mb-1">
                Email :
              </label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {updateError && (
              <div className="mb-3 text-red-400 text-sm">{updateError}</div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-1 active:scale-90 text-md font-semibold"
              >
                <SaveAll size={20} />
                {loading ? "Updating..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-md hover:bg-purple-700 transition cursor-pointer active:scale-90 text-sm flex items-center justify-center font-semibold"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Profile;
