import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { showToast } from "../lib/toast";
import {
  Loader,
  Mail,
  LockIcon,
  MessageSquare,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";

interface FormData {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, user, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  // Navigate to home after successful login
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Show error toast when login fails
  useEffect(() => {
    if (error) {
      showToast.error(error);
    }
  }, [error]);

  const validateForm = (): string | null => {
    const trimmedEmail = formData.email.trim();
    if (trimmedEmail === "") {
      return "Email is required";
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return "Invalid email address";
    }
    const trimmedPassword = formData.password.trim();
    if (trimmedPassword === "") {
      return "Password is required";
    }
    if (trimmedPassword.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formError = validateForm();
    if (formError) {
      showToast.error(formError);
      return;
    }
    await login(formData);
  };

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
            <p className="text-base-content/60">
              Sign in to continue to your account
            </p>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Mail
                    className="w-5 h-5 text-base-content/60"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="email"
                  type="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  autoComplete="email"
                  required
                  aria-required="true"
                />
              </div>
            </div>
            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <LockIcon
                    className="w-5 h-5 text-base-content/60"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10"
                  placeholder="****************"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeIcon
                      className="w-5 h-5 text-base-content/60"
                      strokeWidth={2}
                    />
                  ) : (
                    <EyeOffIcon
                      className="w-5 h-5 text-base-content/60"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </div>
            </div>
            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-base-content/60">
              Don't have an account?{" "}
              <Link to="/register" className="link link-primary">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <AuthImagePattern
        title="Welcome back!"
        subtitle="Connect with friends, share moments, and stay connected with your loved ones."
      />
    </div>
  );
};

export default Login;
