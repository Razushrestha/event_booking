import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyError, notifySuccess } from "@/components/toast";
import { login, orgLogin, googleLogin, storeAuthTokens } from "@/services/authServices";
import useAuthStore from "@/store/authStore";
import { signInWithPopup } from "firebase/auth";
import { auth, googleAuthProvider, isFirebaseConfigured } from "@/config/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const { stateLogin, user } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (user) {
        const role = user.role?.toLowerCase();
        if (role === 'admin') {
            window.location.href = "/admin/dashboard";
        } else {
            window.location.href = "/";
        }
        return null;
    }

    const handleGoogleSignIn = async () => {
        if (!isFirebaseConfigured || !auth || !googleAuthProvider) {
            notifyError("Google sign-in is not configured. Use email and password instead.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleAuthProvider);
            const user = result.user;
            const { displayName, email, uid } = user;
            const idToken = await user.getIdToken();

            try {
                const data = await googleLogin({
                    displayName: displayName ?? "",
                    email: email ?? "",
                    uid,
                    idToken,
                });
                storeAuthTokens(data.accessToken, data.refreshToken);
                const role = data.data.role?.toLowerCase();
                stateLogin(data.data, data.accessToken, data.refreshToken);
                notifySuccess("Google sign-in successful");
                setTimeout(() => {
                    window.location.href = role === 'admin' ? "/admin/dashboard" : "/";
                }, 200);
            } catch (googleError) {
                try {
                    const data = await orgLogin({
                        displayName: displayName ?? "",
                        email: email ?? "",
                        uid,
                        idToken,
                    });
                    storeAuthTokens(data.accessToken, data.refreshToken);
                    const role = data.data.role?.toLowerCase();
                    stateLogin(data.data, data.accessToken, data.refreshToken);
                    notifySuccess("Organization login successful");
                    setTimeout(() => {
                        window.location.href = role === 'admin' ? "/admin/dashboard" : "/";
                    }, 200);
                } catch (orgError) {
                    notifyError("Google sign-in and organization login failed");
                }
            }
        } catch (error) {
            notifyError("Google sign-in failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !password) {
            notifyError("Please fill in all fields");
            return;
        }

        setIsLoading(true);

        try {
            const data = await login(email, password);
            storeAuthTokens(data.accessToken, data.refreshToken);
            const role = data.data.role?.toLowerCase();
            notifySuccess("Login successful");
            stateLogin(data.data, data.accessToken, data.refreshToken);
            setTimeout(() => {
                window.location.href = role === 'admin' ? "/admin/dashboard" : "/";
            }, 200);
        } catch (error) {
            let message = "Login failed. Please check your credentials.";
            if (typeof error === "object" && error !== null && "response" in error) {
                const err = error as { response?: { data?: { message?: string } } };
                message = err.response?.data?.message || message;
            }
            notifyError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="flex items-center space-x-4">
                    {/* <img src="/path-to-your-logo.png" alt="eventSolution Logo" className="h-12" /> */}
                    <h1 className="text-3xl font-bold text-gray-900">Welcome to Event Solution</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</Label>
                            <button
                                type="button"
                                onClick={() => navigate('/forget-password')}
                                className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>
                {isFirebaseConfigured && (
                <div className="m-6 h-10 rounded-md border-2 flex justify-center items-center gap-3 border-gray-200 cursor-pointer" onClick={handleGoogleSignIn}>
                    <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google logo" className="h-5" />
                    <span className="font-medium">Sign in with Google</span>
                </div>
                )}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <a href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
                            Register
                        </a>
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}