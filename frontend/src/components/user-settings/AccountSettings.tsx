import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Camera, User, Mail, Pencil } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { generateAndUploadAvatar } from "../../lib/avatar";

interface ProfileFormData {
  fullName: string;
  email: string;
  bio: string;
}

const AccountSettings = () => {
  const { user, updateProfile } = useAuthStore();
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

  return (
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
  );
};

export default AccountSettings;

