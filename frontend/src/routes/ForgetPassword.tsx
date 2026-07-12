import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { submitForgetPassword, submitVerifyandResetPassword } from '@/services/forgetPasswordServices';
import { notifyError, notifySuccess } from '@/components/toast';
import { useNavigate } from 'react-router-dom';

const ForgetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const res = await submitForgetPassword(email);
      console.log(res);
      notifySuccess("OTP sent successfully to your email");
      console.log("OTP sent to:", email);
      setStep('verify');
    } catch (error: any) {
      console.error(error);
      notifyError(error?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!enteredCode) {
      alert("Please enter the OTP");
      return;
    }

    if (!newPassword) {
      alert("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await submitVerifyandResetPassword(email, enteredCode, newPassword);
      console.log(res);
      setEmail('');
      setEnteredCode('');
      setNewPassword('');
      notifySuccess("Password reset successfully");
      console.log("Password reset for:", email, "OTP:", enteredCode);
      setStep('success');

    } catch (error: any) {
      console.error(error);
      notifyError(error?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
    console.log("Navigate to login");
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const res = await submitForgetPassword(email);
      console.log(res);
      notifySuccess("OTP resent successfully to your email");
    } catch (error: any) {
      console.error(error);
      notifyError(error?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setEnteredCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Success Screen
  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md border-none bg-white shadow-lg rounded-lg">
          <div className="space-y-2 pb-6 pt-8 px-6">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-800">
              Password Reset!
            </h1>
            <p className="text-center text-gray-600">
              Your password has been successfully reset
            </p>
          </div>

          <div className="px-6 space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">
                  You can now login with your new password
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-5 pt-6 pb-8 px-6">
            <button
              onClick={handleBackToLogin}
              className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-md"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification and Password Reset Screen
  if (step === 'verify') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md border-none bg-white shadow-lg rounded-lg">
          <div>
            <div className="space-y-2 pb-6 pt-8 px-6">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <img className="h-14 w-60 text-white" src="/eventsolution.png" alt="Event Solution" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-center text-gray-800">
                Verify & Reset
              </h1>
              <p className="text-center text-gray-600">
                Enter OTP and set your new password
              </p>
            </div>

            <div className="px-6 space-y-5">
              {/* Email Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    OTP sent to: <strong>{email}</strong>
                  </span>
                </div>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium block">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-11 px-4 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">OTP expires in 10 minutes</span>
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-xs text-blue-600 hover:text-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 px-4 pr-12 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-4 pr-12 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-xs text-gray-600 font-medium mb-1">Password requirements:</p>
                <ul className="text-xs text-gray-500 space-y-0.5">
                  <li>• At least 6 characters long</li>
                  <li>• Must match confirm password</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col space-y-3 pt-6 pb-8 px-6">
              <button
                className="w-full h-11 text-base text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleVerifyAndReset}
                disabled={isLoading}
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </button>

              <button
                onClick={handleBackToEmail}
                className="flex items-center justify-center space-x-2 w-full h-11 text-base font-medium text-gray-600 hover:text-gray-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial Email Entry Screen
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md border-none bg-white shadow-lg rounded-lg">
        <div>
          <div className="space-y-2 pb-6 pt-8 px-6">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
                <img className="h-14 w-60 text-white" src="/eventsolution.png" alt="Event Solution" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-800">
              Forgot Password?
            </h1>
            <p className="text-center text-gray-600">
              Enter your email to receive an OTP
            </p>
          </div>

          <div className="px-6 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium block">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start space-x-2">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What happens next:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• We'll send an OTP to your email</li>
                    <li>• Enter the OTP to verify your identity</li>
                    <li>• Set your new password</li>
                    <li>• Login with your new credentials</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-5 pt-6 pb-8 px-6">
            <button
              className="w-full h-11 text-base text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <button
                onClick={handleBackToLogin}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;