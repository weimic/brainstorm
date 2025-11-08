"use client";

import { useParams } from "next/navigation";

import {
    SidebarProvider,
    SidebarTrigger,
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar";

function ProjectSidebar() {
    return (
        <Sidebar side="right">
            <SidebarContent>
                <SidebarGroup>{/* Sidebar items go here */}</SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

export default function ProjectPage() {
    const params = useParams();
    const projectId = (params?.projectId as string) ?? "";

    return (
        <SidebarProvider>
            <main>
                <SidebarTrigger />
                {/* Main project content goes here (canvas) */}
            </main>
            <Sidebar side="right">
                <SidebarContent>
                    <SidebarHeader>
                        <h1>Project: {projectId}</h1>
                    </SidebarHeader>
                    <SidebarGroup>{/* Sidebar items go here */}</SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </SidebarProvider>
    );
}
