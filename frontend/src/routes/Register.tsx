import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import google from "@/assets/google.png";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyError, notifySuccess } from "@/components/toast";
import { register, googleLogin, orgLogin, storeAuthTokens } from "@/services/authServices";
import { signInWithPopup } from "firebase/auth";
import { auth, googleAuthProvider, isFirebaseConfigured } from "@/config/firebase";
import useAuthStore from "@/store/authStore";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { stateLogin } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName || !email || !phone || !password || !confirmPassword) {
            notifyError("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            notifyError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const response = await register(fullName, email, password, phone);

            if (response?.success) {
                notifySuccess("Registration successful");
                navigate("/login");
            } else {
                notifyError(response?.message || "Registration failed. Please try again.");
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            notifyError(error?.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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
                console.error("Google login error:", googleError);
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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-none bg-white shadow-lg">
                <form onSubmit={handleSubmit}>
                    <CardHeader className="space-y-2 pb-6">
                        <CardTitle className="text-3xl font-bold text-center text-gray-800">
                            Create Account
                        </CardTitle>
                        <CardDescription className="text-center text-gray-600">
                            Sign up to start using our Event Solution App
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-medium">
                                Full Name
                            </Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="h-11 px-4 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 px-4 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="9800000000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="h-11 px-4 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 px-4 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-11 px-4 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-5 pt-2">
                        <Button
                            className="w-full h-11 text-base text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                        <Button
                            className="w-full h-11 text-base text-white font-medium bg-green-600 hover:bg-green-700 transition-colors"
                            onClick={() => navigate('/register-organization')}
                            disabled={isLoading}
                        >
                            Register as Organization
                        </Button>
                        {isFirebaseConfigured && (
                        <div className="h-10 w-full rounded-md border-2 flex justify-center items-center gap-3 border-gray-200 cursor-pointer" onClick={handleGoogleSignIn}>
                            <img className="h-5" src={google} alt="Google logo" />
                            <span className="font-medium">Sign in with Google</span>
                        </div>
                        )}
                        <div className="flex items-center my-2">
                            <div className="flex-grow h-px bg-gray-200" />
                            <span className="mx-3 text-gray-400 text-sm">or</span>
                            <div className="flex-grow h-px bg-gray-200" />
                        </div>
                        <div className="text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                Sign in
                            </a>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
