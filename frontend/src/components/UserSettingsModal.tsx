import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Palette,
  UserRound,
  LogOut,
  Send,
  Camera,
  User,
  Mail,
  Pencil,
  Search,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore, DAISYUI_THEMES } from "../store/useThemeStore";
import { generateAndUploadAvatar } from "../lib/avatar";
import { useNavigate } from "react-router-dom";

interface ProfileFormData {
  fullName: string;
  email: string;
  bio: string;
}

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hello! How are you?", isSent: false },
  { id: 2, content: "I'm doing great, thanks for asking!", isSent: true },
  { id: 3, content: "That's wonderful to hear!", isSent: false },
];

type MenuItem = "appearance" | "account";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
  const [activeMenu, setActiveMenu] = useState<MenuItem>("appearance");
  const { user, updateProfile, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarGenerationAttempted = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] =
    useState(false);

  const [originalData, setOriginalData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    bio: user?.bio || "",
    profilePicture: user?.profilePicture || null,
  });

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      bio: user?.bio || "",
    },
  });

  watch();

  const hasUnsavedChanges =
    isDirty || isUploadingProfilePicture || previewUrl !== null;

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        email: user.email || "",
        bio: user.bio || "",
      });
      setOriginalData({
        fullName: user.fullName || "",
        email: user.email || "",
        bio: user.bio || "",
        profilePicture: user.profilePicture || null,
      });
    }
  }, [user, reset]);

  useEffect(() => {
    const generateAvatarIfNeeded = async () => {
      if (!user || !user._id || !user.fullName) return;

      const hasProfilePicture =
        user.profilePicture &&
        user.profilePicture !== "" &&
        user.profilePicture !== null;

      const hasAttempted = avatarGenerationAttempted.current === user._id;

      if (!hasProfilePicture && !hasAttempted && !isGeneratingAvatar) {
        avatarGenerationAttempted.current = user._id;
        setIsGeneratingAvatar(true);
        try {
          await generateAndUploadAvatar(
            user.fullName,
            user.email,
            updateProfile,
            user.bio
          );
        } catch (error) {
          console.error("Failed to generate avatar:", error);
          avatarGenerationAttempted.current = null;
        } finally {
          setIsGeneratingAvatar(false);
        }
      }
    };

    generateAvatarIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.profilePicture, user?.fullName]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploadingProfilePicture(true);

    try {
      const base64Image = await fileToBase64(file);
      const currentValues = getValues();
      await updateProfile({
        fullName: currentValues.fullName,
        email: currentValues.email,
        bio: currentValues.bio,
        profilePicture: base64Image,
      });

      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
    } finally {
      setIsUploadingProfilePicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onSaveChanges = async (data: ProfileFormData): Promise<void> => {
    if (!user) return;

    try {
      await updateProfile({
        fullName: data.fullName,
        email: data.email,
        bio: data.bio,
      });

      reset({
        fullName: data.fullName,
        email: data.email,
        bio: data.bio,
      });

      setOriginalData({
        fullName: data.fullName,
        email: data.email,
        bio: data.bio,
        profilePicture: user.profilePicture || originalData.profilePicture,
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onClose();
    navigate("/login");
  };

  const displayImage = previewUrl || user?.profilePicture || null;

  const getUserInitials = (): string => {
    if (!user?.fullName) return "U";
    const names = user.fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.fullName[0].toUpperCase();
  };

  const formatMemberSince = (): string => {
    return new Date().toISOString().split("T")[0];
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open" onClick={onClose}>
      <div
        className="modal-box max-w-6xl w-full h-[90vh] p-0 flex rounded-xl bg-base-200"
        onClick={(e) => e.stopPropagation()}
      >
        <form method="dialog" className="hidden">
          <button>close</button>
        </form>

        {/* Vertical Menu */}
        <div className="w-56 border-r border-base-300 flex flex-col">
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center border border-base-300 rounded-lg overflow-hidden">
              <div className="w-[20%] flex items-center justify-center bg-base-200 border-r border-base-300 h-10">
                <Search className="w-4 h-4 text-base-content/50" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="input input-bordered w-[80%] border-0 rounded-none focus:outline-none h-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="menu w-[95%] p-2">
              <li className="w-full">
                <button
                  onClick={() => setActiveMenu("appearance")}
                  className={`w-full mx-auto rounded-lg transition-colors ${
                    activeMenu === "appearance"
                      ? "bg-base-300 text-base-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <Palette className="w-5 h-5" />
                  Appearance
                </button>
              </li>
              <li className="w-full">
                <button
                  onClick={() => setActiveMenu("account")}
                  className={`w-full mx-auto rounded-lg transition-colors ${
                    activeMenu === "account"
                      ? "bg-base-300 text-base-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <UserRound className="w-5 h-5" />
                  Your Account
                </button>
              </li>
            </ul>
          </div>
          <div className="p-2 border-t border-base-300 flex justify-center">
            <button
              onClick={handleSignOut}
              className="btn w-[85%] hover:btn-error rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeMenu === "appearance" && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Theme</h2>
                <p className="text-sm text-base-content/70">
                  Choose a theme for your chat interface
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {DAISYUI_THEMES.map((t) => (
                  <button
                    key={t}
                    className={`group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors cursor-pointer ${
                      theme === t ? "bg-base-200" : "hover:bg-base-200/50"
                    }`}
                    onClick={() => setTheme(t)}
                  >
                    <div
                      className="relative h-8 w-full rounded-md overflow-hidden"
                      data-theme={t}
                    >
                      <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                        <div className="rounded bg-primary"></div>
                        <div className="rounded bg-secondary"></div>
                        <div className="rounded bg-accent"></div>
                        <div className="rounded bg-neutral"></div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium truncate w-full text-center">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Preview</h2>
                <p className="text-sm text-base-content/70">
                  See how your theme looks in a chat interface
                </p>
              </div>

              <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                {PREVIEW_MESSAGES.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isSent ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-3 shadow-sm ${
                        message.isSent
                          ? "bg-primary text-primary-content"
                          : "bg-base-200"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-[10px] mt-1.5 ${
                          message.isSent
                            ? "text-primary-content/70"
                            : "text-base-content/70"
                        }`}
                      >
                        12:00 PM
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-base-300 bg-base-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1 text-sm h-10"
                    placeholder="Type a message..."
                    value="This is a preview"
                    readOnly
                  />
                  <button className="btn btn-primary h-10 min-h-0">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "account" && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <div className="mb-8 text-center">
                      <h1 className="text-2xl font-bold mb-2 text-base-content">
                        Profile
                      </h1>
                      <p className="text-base-content/70 text-sm">
                        Your profile information
                      </p>
                    </div>

                    <div className="flex flex-col items-center mb-8">
                      <div className="relative mb-4 group">
                        {displayImage ? (
                          <div
                            className="w-32 h-32 rounded-full overflow-hidden relative cursor-pointer"
                            onClick={handleAvatarClick}
                          >
                            <img
                              src={displayImage}
                              alt="Profile"
                              className={`w-full h-full object-cover transition-opacity duration-300 ${
                                isUploadingProfilePicture
                                  ? "opacity-50"
                                  : "opacity-100"
                              }`}
                            />
                            {isUploadingProfilePicture && (
                              <div className="absolute inset-0 bg-base-200/80 rounded-full flex items-center justify-center animate-pulse">
                                <div className="loading loading-spinner loading-md"></div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Pencil className="w-6 h-6 text-white mb-1" />
                              <span className="text-white text-sm font-medium">
                                Edit
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="bg-red-500 text-white rounded-full w-32 h-32 flex items-center justify-center relative cursor-pointer"
                            onClick={handleAvatarClick}
                          >
                            <span className="text-4xl font-semibold">
                              {getUserInitials()}
                            </span>
                            {isUploadingProfilePicture && (
                              <div className="absolute inset-0 bg-base-200/80 rounded-full flex items-center justify-center animate-pulse">
                                <div className="loading loading-spinner loading-md"></div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Pencil className="w-6 h-6 text-white mb-1" />
                              <span className="text-white text-sm font-medium">
                                Edit
                              </span>
                            </div>
                          </div>
                        )}
                        <label
                          htmlFor="avatar-upload"
                          className={`absolute bottom-0 right-0 bg-base-300 p-2.5 rounded-full cursor-pointer transition-all duration-200 shadow-lg md:hidden ${
                            isUploadingProfilePicture
                              ? "animate-pulse pointer-events-none opacity-50"
                              : "hover:scale-110"
                          }`}
                        >
                          <Camera className="w-5 h-5 text-base-content" />
                        </label>
                      </div>
                      <input
                        type="file"
                        id="avatar-upload"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploadingProfilePicture}
                      />
                      <p className="text-sm text-base-content/70 text-center">
                        <span className="md:hidden">
                          Click the camera icon to update your photo
                        </span>
                        <span className="hidden md:inline">
                          Click your photo to update
                        </span>
                      </p>
                    </div>

                    <form onSubmit={handleSubmit(onSaveChanges)}>
                      <div className="w-full max-w-2xl mx-auto space-y-6 mb-8">
                        <div className="relative">
                          <label className="label">
                            <span className="label-text font-semibold flex items-center gap-2 text-base-content">
                              <User className="w-4 h-4" />
                              Full Name
                            </span>
                          </label>
                          <input
                            type="text"
                            {...register("fullName", {
                              required: "Full name is required",
                            })}
                            className={`input input-bordered w-full bg-base-100 text-base-content ${
                              errors.fullName ? "input-error" : ""
                            }`}
                            placeholder="Full Name"
                          />
                          {errors.fullName && (
                            <label className="label">
                              <span className="label-text-alt text-error">
                                {errors.fullName.message}
                              </span>
                            </label>
                          )}
                        </div>

                        <div className="relative">
                          <label className="label">
                            <span className="label-text font-semibold flex items-center gap-2 text-base-content">
                              <Mail className="w-4 h-4" />
                              Email Address
                            </span>
                          </label>
                          <input
                            type="email"
                            {...register("email", {
                              required: "Email is required",
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                                message: "Invalid email address",
                              },
                            })}
                            className={`input input-bordered w-full bg-base-100 text-base-content ${
                              errors.email ? "input-error" : ""
                            }`}
                            placeholder="Email Address"
                          />
                          {errors.email && (
                            <label className="label">
                              <span className="label-text-alt text-error">
                                {errors.email.message}
                              </span>
                            </label>
                          )}
                        </div>

                        <div className="relative">
                          <label className="label">
                            <span className="label-text font-semibold text-base-content">
                              Bio
                            </span>
                          </label>
                          <textarea
                            {...register("bio")}
                            className="textarea textarea-bordered w-full bg-base-100 text-base-content min-h-24"
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                      </div>

                      <div className="border-t border-base-300 pt-6 mt-6">
                        <h3 className="font-semibold text-lg mb-4 text-base-content">
                          Account Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-base-content/70 block mb-1">
                              Member Since:
                            </span>
                            <p className="text-base-content font-medium">
                              {formatMemberSince()}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-base-content/70 block mb-1">
                              Account Status:
                            </span>
                            <p className="text-success font-medium">Active</p>
                          </div>
                        </div>
                      </div>

                      {hasUnsavedChanges && (
                        <div className="card-actions justify-end mt-6">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isUploadingProfilePicture}
                          >
                            {isUploadingProfilePicture ? (
                              <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Uploading...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};

export default UserSettingsModal;
