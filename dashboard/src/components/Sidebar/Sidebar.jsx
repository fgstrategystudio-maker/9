import { useState } from "react";
import Icon from "../Icon";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "commesse", label: "Commesse", icon: "folder" },
  { id: "fiscale", label: "Fiscale", icon: "receipt" },
  { id: "storico", label: "Storico", icon: "trend" },
  { id: "network", label: "Network", icon: "network" },
  { id: "setup", label: "Setup", icon: "sliders" },
];

export default function Sidebar({ view, onNavigate }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={styles.mobileBar}>
        <button className={styles.menuBtn} onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <Icon name={open ? "x" : "menu"} size={20} />
        </button>
        <div className={styles.mobileMark}>
          <Icon name="layers" size={15} />
        </div>
        <span className={styles.mobileBrand}>Freelance Dashboard</span>
      </div>
      {open && <div className={styles.scrim} onClick={() => setOpen(false)} />}
      <nav className={`${styles.rail} ${open ? styles.open : ""}`}>
        <div className={styles.brand}>
          <div className={styles.mark}>
            <Icon name="layers" size={18} />
          </div>
          <h1 className={styles.brandName}>
            Freelance<br />
            <span>Dashboard</span>
          </h1>
        </div>
        <div className={styles.nav}>
          <div className={styles.navSec}>Workspace</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${view === item.id ? styles.active : ""}`}
              onClick={() => { onNavigate(item.id); setOpen(false); }}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.foot}>
          <div className={styles.user}>
            <div className={styles.ava}>FG</div>
            <div>
              <div className={styles.userName}>Francesco</div>
              <div className={styles.userRole}>Freelance · SEO &amp; Ads</div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
