import { Outlet } from "react-router-dom";
import SideBarComponent from "./SideBarComponent";

export default function Layout() {
  return (
    <div className="flex">
      <SideBarComponent><></></SideBarComponent>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
