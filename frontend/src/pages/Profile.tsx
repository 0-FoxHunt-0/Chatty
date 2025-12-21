import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Camera, User, Mail, Pencil } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useBlocker } from "react-router-dom";
import { generateAndUploadAvatar } from "../lib/avatar";

interface ProfileFormData {
  fullName: string;
  email: string;
  bio: string;
}

const Profile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarGenerationAttempted = useRef<string | null>(null);
  const { user, updateProfile } = useAuthStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] =
    useState(false);

  // Track original values to detect changes
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

  // Watch form values to detect changes
  watch();

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    isDirty || isUploadingProfilePicture || previewUrl !== null;

  // Initialize form data when user loads
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

  // Auto-generate avatar if profile picture is missing
  useEffect(() => {
    const generateAvatarIfNeeded = async () => {
      if (!user || !user._id || !user.fullName) return;

      // Check if user has a profile picture
      const hasProfilePicture =
        user.profilePicture &&
        user.profilePicture !== "" &&
        user.profilePicture !== null;

      // Check if we've already attempted generation for this user
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
          // Reset the attempt flag on error so it can be retried
          avatarGenerationAttempted.current = null;
          // Don't show error toast as this is automatic and non-critical
        } finally {
          setIsGeneratingAvatar(false);
        }
      }
    };

    generateAvatarIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.profilePicture, user?.fullName]);

  // Navigation blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowConfirmDialog(true);
      setPendingNavigation(() => () => {
        blocker.proceed();
        setShowConfirmDialog(false);
        setPendingNavigation(null);
      });
    }
  }, [blocker.state, blocker]);

  // Convert file to base64
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

    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL for immediate display
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploadingProfilePicture(true);

    try {
      // Convert file to base64
      const base64Image = await fileToBase64(file);

      // Upload immediately with current form data (not stale user data)
      const currentValues = getValues();
      await updateProfile({
        fullName: currentValues.fullName,
        email: currentValues.email,
        bio: currentValues.bio,
        profilePicture: base64Image,
      });

      // Clean up preview URL since we now have the uploaded image
      // The user state will be updated by the store, and the useEffect will sync originalData
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      // Keep preview URL on error so user can see what they selected
    } finally {
      setIsUploadingProfilePicture(false);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Clean up object URL when component unmounts or preview changes
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

      // Reset form to mark as not dirty after successful save
      // This sets the saved values as the new default values, making isDirty false
      reset({
        fullName: data.fullName,
        email: data.email,
        bio: data.bio,
      });

      // Reset original data to current form data after successful save
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

  const handleDiscardChanges = () => {
    // Reset form data to original values
    reset({
      fullName: originalData.fullName,
      email: originalData.email,
      bio: originalData.bio,
    });
    // Reset preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    // Proceed with navigation
    if (pendingNavigation) {
      pendingNavigation();
    }
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  };

  // Determine which image to display: preview > existing profile picture > placeholder
  const displayImage = previewUrl || user?.profilePicture || null;

  // Get user initials (first letter of first name and first letter of last name)
  const getUserInitials = (): string => {
    if (!user?.fullName) return "U";
    const names = user.fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.fullName[0].toUpperCase();
  };

  // Format date for Member Since
  const formatMemberSince = (): string => {
    // For now, return a placeholder. You can add createdAt to user object later
    return new Date().toISOString().split("T")[0];
  };

  return (
    <div className="h-full bg-base-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            {/* Title and Subtitle */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold mb-2 text-base-content">
                Profile
              </h1>
              <p className="text-base-content/70 text-sm">
                Your profile information
              </p>
            </div>

            {/* Profile Picture Section */}
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
                        isUploadingProfilePicture ? "opacity-50" : "opacity-100"
                      }`}
                    />
                    {isUploadingProfilePicture && (
                      <div className="absolute inset-0 bg-base-200/80 rounded-full flex items-center justify-center animate-pulse">
                        <div className="loading loading-spinner loading-md"></div>
                      </div>
                    )}
                    {/* Hover overlay with Pencil icon and Edit text */}
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
                    {/* Hover overlay with Pencil icon and Edit text */}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Pencil className="w-6 h-6 text-white mb-1" />
                      <span className="text-white text-sm font-medium">
                        Edit
                      </span>
                    </div>
                  </div>
                )}
                {/* Camera icon button on bottom right - for mobile/accessibility */}
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

            {/* Form Fields */}
            <form onSubmit={handleSubmit(onSaveChanges)}>
              <div className="w-full max-w-2xl mx-auto space-y-6 mb-8">
                {/* Full Name */}
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

                {/* Email Address */}
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

                {/* Bio */}
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

              {/* Account Information Section */}
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

              {/* Save Changes Button */}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Unsaved Changes</h3>
              <p className="py-4">
                You have unsaved changes. Are you sure you want to leave? Your
                changes will be discarded.
              </p>
              <div className="modal-action">
                <button
                  onClick={handleCancelNavigation}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDiscardChanges}
                  className="btn btn-primary"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
