import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchProfile } from "../services/api";
import styles from "../styles/Profile.module.css";

export default function Profile() {
  const navigate = useNavigate();
  const { token, userId, logout } = useAuth();

  const [profile, setProfile] = useState({
    username: "Loading...",
    email: "Loading...",
    favorites: 0,
    searches: 0,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile(token, userId);
        setProfile(data);
      } catch (err) {
        console.log(err);
        alert("Unable to load profile.");
      }
    }
    loadProfile();
  }, [token, userId]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className={styles.page}>
      <div className={styles["profile-card"]}>
        <div className={styles.avatar}>👤</div>
        <h1>My Profile</h1>

        <div className={styles.info}>
          <div className={styles.row}>
            <span className={styles.label}>Username</span>
            <span className={styles.value}>{profile.username}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{profile.email}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Favorite Cities</span>
            <span className={styles.value}>{profile.favorites}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Total Searches</span>
            <span className={styles.value}>{profile.searches}</span>
          </div>
        </div>

        <div className={styles.buttons}>
          <button onClick={() => navigate("/")}>🏠 Dashboard</button>
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>
    </div>
  );
}
