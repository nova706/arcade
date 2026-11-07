import "./style.css";
import { Dashboard } from "./dashboard/Dashboard";
import { games } from "./dashboard/registry";
import { InputManager } from "./engine";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Arcade page is missing its application root.");

const dashboard = new Dashboard(root, games, new InputManager());
dashboard.show();
