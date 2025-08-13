import { Outlet } from "react-router-dom";
import SideBarComponent from "./SideBarComponent";
import FloatingBot from "@/components/FloatingBot";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";

export default function Layout() {
  return (
    <div className="flex">
      <SideBarComponent>
        <Outlet />
      </SideBarComponent>
      <FloatingBot />
      <GlobalCommandPalette />
    </div>
  );
}
