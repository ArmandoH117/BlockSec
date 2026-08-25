import {
  Box,
  BriefcaseBusiness,
  Globe2,
  ShieldCheck
} from "lucide-react";

import {
  NavLink
} from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="brand">

        <div className="brand-icon">
          <ShieldCheck size={30} />
        </div>

        <div>
          <strong>
            BlockSec
          </strong>

          <span>
            Cadena de Custodia
          </span>
        </div>

      </div>

      <nav className="sidebar-nav">

        <NavLink
          to="/cases"
          className={({ isActive }) =>
            isActive
              ? "nav-item active"
              : "nav-item"
          }
        >
          <BriefcaseBusiness
            size={21}
          />

          <span>
            Casos
          </span>
        </NavLink>

        <NavLink
          to="/blockchain"
          className={({ isActive }) =>
            isActive
              ? "nav-item active"
              : "nav-item"
          }
        >
          <Box size={21} />

          <span>
            Blockchain
          </span>
        </NavLink>

        <NavLink
          to="/network"
          className={({ isActive }) =>
            isActive
              ? "nav-item active"
              : "nav-item"
          }
        >
          <Globe2 size={21} />

          <span>
            Red
          </span>
        </NavLink>

      </nav>

    </aside>
  );
}