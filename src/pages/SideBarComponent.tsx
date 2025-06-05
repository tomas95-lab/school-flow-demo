import { AppSidebar } from "@/components/ui/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import React from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

const validRoutes = {
  dashboard: true,
  projects: {
    all: true,
    planner: true,
  },
  financials: {
    expenses: true,
    invoices: true,
  },
  suppliers: {
    all: true,
    orders: true,
  },
  settings: {
    general: true,
    users: true,
  },
};

export default function SideBarComponent({ children }: { children: React.ReactNode }) {
  const location = useLocation() 
  const url = location.pathname 
  const urlArray = url.split("/") 
  const urlParts = urlArray.slice(1) 
  const urlPartsArray = urlParts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)) 

  const navigate = useNavigate()

  const LogOut = () => {
    localStorage.setItem("isAuthenticated", "false")
    navigate("/")
  }

  const isValidRoute = (path: string[]) => {
    let current: any = validRoutes;
    for (const part of path) {
      if (!current[part.toLowerCase()]) return false;
      current = current[part.toLowerCase()];
    }
    return true;
  };

  const getBreadcrumbPath = (index: number) => {
    const pathParts = urlParts.slice(0, index + 1);
    if (isValidRoute(pathParts)) {
      return '/' + pathParts.join('/');
    }
    return null;
  }

  const safeNavigate = (path: string | null) => {
    if (path) {
      navigate(path);
    }
  };

  if (localStorage.getItem("isAuthenticated") == "false") {
    navigate("/")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex w-full h-16 shrink-0 items-center gap-2 border-b px-4 fixed top-0 bg-white z-50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center justify-between w-full">
            <Breadcrumb>
              <BreadcrumbList>
                {urlParts[0] !== 'dashboard' && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        onClick={() => safeNavigate('/dashboard')}
                        className="cursor-pointer"
                      >
                        Home
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}

                {urlPartsArray.map((path, index) => {
                  const breadcrumbPath = getBreadcrumbPath(index);
                  return (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        <BreadcrumbLink 
                          onClick={() => safeNavigate(breadcrumbPath)}
                          className={`${breadcrumbPath ? 'cursor-pointer hover:underline' : 'cursor-not-allowed opacity-50'}`}
                        >
                          {path === 'Dashboard' ? 'Home' : path}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {index !== urlPartsArray.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex">
              <DropdownMenu>
                <DropdownMenuTrigger>
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" className="cursor-pointer" alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={LogOut}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-20">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
