import { Outlet } from "react-router-dom";
import SideBarComponent from "./SideBarComponent";

export default function Layout() {
  return (
    <div className="flex">
      <SideBarComponent>
        <Outlet />
      </SideBarComponent>
    </div>
  );
}
