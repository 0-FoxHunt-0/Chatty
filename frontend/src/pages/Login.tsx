import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/useAuthStore";
import { showToast } from "../lib/toast";
import { axiosInstance } from "../lib/axios";
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
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    },
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

  // Load OAuth provider availability (so we don't show a Google button that leads to a 503 page)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await axiosInstance.get("/auth/oauth/status");
        const enabled = !!res?.data?.providers?.google?.enabled;
        if (mounted) setGoogleEnabled(enabled);
      } catch {
        if (mounted) setGoogleEnabled(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    await login(data);
  };

  return (
    <div className="h-full overflow-y-auto grid lg:grid-cols-2">
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
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
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
                  className={`input input-bordered w-full pl-10 ${
                    errors.email ? "input-error" : ""
                  }`}
                  placeholder="john.doe@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                      message: "Invalid email address",
                    },
                  })}
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.email.message}
                  </span>
                </label>
              )}
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
                  className={`input input-bordered w-full pl-10 pr-10 ${
                    errors.password ? "input-error" : ""
                  }`}
                  placeholder="****************"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters long",
                    },
                  })}
                  autoComplete="current-password"
                  aria-required="true"
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
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.password.message}
                  </span>
                </label>
              )}
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

          <div className="divider">OR</div>

          <div className="form-control">
            <button
              type="button"
              className="btn btn-outline w-full"
              disabled={isLoading || !googleEnabled}
              title={
                googleEnabled
                  ? "Continue with Google"
                  : "Google sign-in is not configured on the server"
              }
              onClick={() => window.location.assign("/api/auth/google")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {!googleEnabled && (
              <p className="mt-2 text-xs text-base-content/60">
                Google sign-in isn’t configured. Set{" "}
                <span className="font-mono">GOOGLE_CLIENT_ID</span> and{" "}
                <span className="font-mono">GOOGLE_CLIENT_SECRET</span> in{" "}
                <span className="font-mono">backend/.env</span> and restart the
                backend.
              </p>
            )}
          </div>

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
