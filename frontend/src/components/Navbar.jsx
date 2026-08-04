import { useNavigate } from "react-router-dom";
import styles from "../styles/Dashboard.module.css";

export default function Navbar({ profileName, darkMode, onThemeToggle, onLogout }) {
  const navigate = useNavigate();
  const initial = profileName && profileName !== "Loading..." ? profileName[0].toUpperCase() : "U";

  return (
    <header className={styles.navbar}>
      <div className={styles.logo}>🌍 Air Quality Dashboard</div>
      <div className={styles["nav-right"]}>
        <button id="themeBtn" onClick={onThemeToggle}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <div
          className={styles["profile-menu"]}
          id="profileBtn"
          onClick={() => navigate("/profile")}
        >
          <div className={styles["profile-avatar"]}>
            <span id="profileInitial">{initial}</span>
            <div className={styles["online-dot"]}></div>
          </div>
          <div className={styles["profile-details"]}>
            <span id="profileName">{profileName}</span>
            <small>View Profile ▾</small>
          </div>
        </div>
        <button id="logoutBtn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
