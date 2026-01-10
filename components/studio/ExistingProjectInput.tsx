"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Project {
    id: string;
    name: string;
    thumbnailDataUrl?: string;
    updatedAt: string;
    techStack: string;
}

interface ExistingProjectInputProps {
    onProjectSelect: (project: Project) => void;
    disabled?: boolean;
}

export default function ExistingProjectInput({
    onProjectSelect,
    disabled = false,
}: ExistingProjectInputProps) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [importUrl, setImportUrl] = useState("");

    // Fetch user's projects
    useEffect(() => {
        if (!user) return;

        const fetchProjects = async () => {
            try {
                const response = await fetch("/api/projects", {
                    headers: { "x-user-id": user.uid },
                });
                const data = await response.json();
                if (data.projects) {
                    setProjects(data.projects);
                }
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [user]);

    const handleSelect = (project: Project) => {
        setSelectedId(project.id);
        onProjectSelect(project);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-sm font-medium text-white/80 mb-1">Import Existing</h3>
                <p className="text-xs text-white/40">
                    Select a previous project to modify or import from URL.
                </p>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                        <p className="text-sm text-white/40 mb-2">No previous projects</p>
                        <p className="text-xs text-white/30">
                            Create a project first, or import from URL below.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {projects.map((project) => (
                            <motion.button
                                key={project.id}
                                onClick={() => handleSelect(project)}
                                disabled={disabled}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedId === project.id
                                        ? "bg-white/10 border-white/20"
                                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                                    } disabled:opacity-50`}
                            >
                                {/* Thumbnail */}
                                <div className="w-12 h-12 rounded bg-white/[0.05] flex-shrink-0 overflow-hidden">
                                    {project.thumbnailDataUrl ? (
                                        <img
                                            src={project.thumbnailDataUrl}
                                            alt={project.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                                            No preview
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white/90 truncate">
                                        {project.name}
                                    </p>
                                    <p className="text-xs text-white/40">
                                        {project.techStack} · {new Date(project.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Selected Indicator */}
                                {selectedId === project.id && (
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* Import from URL */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <label className="block text-xs text-white/40 mb-2">
                    Or import from URL
                </label>
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        disabled={disabled}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/20 disabled:opacity-50"
                    />
                    <button
                        disabled={disabled || !importUrl}
                        className="px-3 py-2 rounded-lg bg-white/10 text-sm text-white/80 hover:bg-white/20 disabled:opacity-30 transition-all"
                    >
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
}
