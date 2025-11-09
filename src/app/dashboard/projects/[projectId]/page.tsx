"use client";

import { useParams } from "next/navigation";
import { useProjectData } from "@/hooks/useProjectData";

import {
    SidebarProvider,
    SidebarTrigger,
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Canvas from "@/components/canvas/Canvas";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectPage() {
    const projectId = useParams()?.projectId as string | null;
    const { user } = useAuth();
  const info = useProjectData(projectId);
  const data = info.project?.data;

    return (
        <div className="min-h-screen w-full overflow-x-hidden">
            <SidebarProvider>
                <main className="flex-1">
                    {/* Main project content goes here (canvas) */}
                    {user && projectId && (
                        <Canvas userId={user.uid} projectId={projectId} />
                    )}
                </main>
                <div className="fixed right-4 top-4 z-50">
                    <SidebarTrigger />
                </div>
                <Sidebar side="right">
                    <SidebarContent>
                        <SidebarHeader>
                            <h1 className="font-bold">{data?.name || projectId}</h1>
                            <p>{data?.mainContext}</p>
                        </SidebarHeader>
                        <SidebarGroup>{/* Addtl text from activeIdea goes here */}</SidebarGroup>
                        <SidebarGroup>{/* Liked ideas list goes here */}</SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter>
                        <Button className="flex items-center gap-2">
                            <Link className="w-full" href="/dashboard">Return</Link>
                        </Button>
                    </SidebarFooter>
                </Sidebar>
            </SidebarProvider>
        </div>
    );
}
