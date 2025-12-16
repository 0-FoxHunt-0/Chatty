import { useRef, useState, useEffect } from "react";
import { Pencil, Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useBlocker } from "react-router-dom";
import { generateAndUploadAvatar } from "../lib/avatar";

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
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    bio: user?.bio || "",
  });

  // Track original values to detect changes
  const [originalData, setOriginalData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    bio: user?.bio || "",
    profilePicture: user?.profilePicture || null,
  });

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    formData.fullName !== originalData.fullName ||
    formData.email !== originalData.email ||
    formData.bio !== originalData.bio;

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
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
  }, [user]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
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

      // Upload immediately
      await updateProfile({
        fullName: user.fullName,
        email: user.email,
        bio: user.bio,
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

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  const handleSaveChanges = async (): Promise<void> => {
    if (!user) return;

    try {
      await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        bio: formData.bio,
      });

      // Reset original data to current form data after successful save
      setOriginalData({
        fullName: formData.fullName,
        email: formData.email,
        bio: formData.bio,
        profilePicture: user.profilePicture || originalData.profilePicture,
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const handleDiscardChanges = () => {
    // Reset form data to original values
    setFormData({
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

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Profile</h1>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center mb-6">
              <div className="avatar placeholder mb-4 relative group">
                {displayImage ? (
                  <div className="w-24 rounded-full overflow-hidden relative">
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
                  </div>
                ) : (
                  <div className="bg-neutral text-neutral-content rounded-full w-24 relative">
                    <span className="text-3xl">
                      {user?.fullName?.[0]?.toUpperCase() || "U"}
                    </span>
                    {isUploadingProfilePicture && (
                      <div className="absolute inset-0 bg-base-200/80 rounded-full flex items-center justify-center animate-pulse">
                        <div className="loading loading-spinner loading-md"></div>
                      </div>
                    )}
                  </div>
                )}
                {/* Desktop: Hover overlay - clickable */}
                <div
                  className="absolute inset-0 bg-black/50 rounded-full flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer hidden md:flex"
                  onClick={handleAvatarClick}
                >
                  <Pencil className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-sm font-medium">Edit</span>
                </div>
                {/* Mobile: Camera button */}
                <label
                  htmlFor="avatar-upload"
                  className={`absolute bottom-0 right-0 bg-base-content hover:scale-105 p-2 rounded-full cursor-pointer transition-all duration-200 md:hidden ${
                    isUploadingProfilePicture
                      ? "animate-pulse pointer-events-none"
                      : ""
                  }`}
                >
                  <Camera className="w-5 h-5 text-base-200" />
                </label>
                {/* Desktop: Clickable area for avatar */}
                <div
                  className="absolute inset-0 rounded-full cursor-pointer hidden md:block"
                  onClick={handleAvatarClick}
                ></div>
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
              <div className="w-full max-w-md space-y-4">
                <div className="group relative">
                  <label className="label">
                    <span className="label-text font-semibold">Full Name</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange("fullName")}
                      className="input input-bordered w-full pr-10"
                      placeholder="Full Name"
                    />
                    <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" />
                  </div>
                </div>
                <div className="group relative">
                  <label className="label">
                    <span className="label-text font-semibold">Email</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange("email")}
                      className="input input-bordered w-full pr-10"
                      placeholder="Email"
                    />
                    <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="divider"></div>
            <div className="space-y-4">
              <div className="group relative">
                <label className="label">
                  <span className="label-text font-semibold">Bio</span>
                </label>
                <div className="relative">
                  <textarea
                    value={formData.bio}
                    onChange={handleInputChange("bio")}
                    className="textarea textarea-bordered w-full pr-10 min-h-24"
                    placeholder="This is a placeholder bio. Update your profile to add a personal bio."
                  />
                  <Pencil className="absolute right-3 top-3 w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Member Since</h3>
                <p className="text-base-content/70">January 2024</p>
              </div>
            </div>
            {hasUnsavedChanges && (
              <div className="card-actions justify-end mt-6">
                <button onClick={handleSaveChanges} className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            )}
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
