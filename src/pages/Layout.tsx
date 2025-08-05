import { Outlet } from "react-router-dom";
import SideBarComponent from "./SideBarComponent";
import FloatingBot from "@/components/FloatingBot";

export default function Layout() {
  return (
    <div className="flex">
      <SideBarComponent>
        <Outlet />
      </SideBarComponent>
      <FloatingBot />
    </div>
  );
}
