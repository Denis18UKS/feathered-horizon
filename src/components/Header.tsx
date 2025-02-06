import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Header = () => {
  return (
    <header className="h-16 border-b border-gray-200 flex items-center px-4">
      <SidebarTrigger />
    </header>
  );
};

export default Header;