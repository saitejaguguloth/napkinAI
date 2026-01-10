"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import OAuthButton from "@/components/auth/OAuthButton";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import { motion } from "framer-motion";

function LoginForm() {
    const { signInWithGoogle, signInWithGithub, signInWithEmail } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
    const [error, setError] = useState("");

    const handleSuccess = () => {
        const redirect = searchParams.get("redirect") || "/home";
        router.push(redirect);
    };

    const handleGoogleLogin = async () => {
        try {
            setOauthLoading("google");
            setError("");
            await signInWithGoogle();
            handleSuccess();
        } catch (err: any) {
            // Don't show error if user just closed the popup
            if (err.code === "auth/popup-closed-by-user") {
                // User closed popup, no error needed
            } else if (err.code === "auth/cancelled-popup-request") {
                // Another popup was opened, ignore
            } else if (err.code === "auth/popup-blocked") {
                setError("Popup was blocked. Please allow popups for this site.");
            } else {
                setError(err.message || "Failed to sign in with Google");
            }
        } finally {
            setOauthLoading(null);
        }
    };

    const handleGithubLogin = async () => {
        try {
            setOauthLoading("github");
            setError("");
            await signInWithGithub();
            handleSuccess();
        } catch (err: any) {
            // Don't show error if user just closed the popup
            if (err.code === "auth/popup-closed-by-user") {
                // User closed popup, no error needed
            } else if (err.code === "auth/cancelled-popup-request") {
                // Another popup was opened, ignore
            } else if (err.code === "auth/popup-blocked") {
                setError("Popup was blocked. Please allow popups for this site.");
            } else {
                setError(err.message || "Failed to sign in with GitHub");
            }
        } finally {
            setOauthLoading(null);
        }
    };

    const handleEmailLogin = async (e: FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            setLoading(true);
            setError("");
            await signInWithEmail(email, password);
            handleSuccess();
        } catch (err: any) {
            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
                setError("Invalid email or password");
            } else if (err.code === "auth/wrong-password") {
                setError("Invalid password");
            } else if (err.code === "auth/invalid-email") {
                setError("Invalid email format");
            } else {
                setError(err.message || "Failed to sign in");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
                        Welcome back
                    </h2>
                    <p className="text-white/40">Sign in to continue to NAPKIN</p>
                </div>

                <div className="space-y-3">
                    <OAuthButton
                        provider="google"
                        onClick={handleGoogleLogin}
                        loading={oauthLoading === "google"}
                    />
                    <OAuthButton
                        provider="github"
                        onClick={handleGithubLogin}
                        loading={oauthLoading === "github"}
                    />
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-black text-white/40">or</span>
                    </div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <AuthInput
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />

                    <AuthInput
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                            <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                    )}

                    <AuthButton type="submit" loading={loading}>
                        Sign in
                    </AuthButton>
                </form>

                <div className="text-center">
                    <p className="text-white/40">
                        Don't have an account?{" "}
                        <Link
                            href={`/signup?${searchParams.toString()}`}
                            className="text-white hover:text-white/80 transition-colors font-medium"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
