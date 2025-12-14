import { useRef, useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const Profile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous preview URL if it exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Create new preview URL (file will be uploaded when user saves)
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      // TODO: Store file for upload when user clicks save
      // const selectedFile = file;
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

  // Determine which image to display: preview > existing profile picture > placeholder
  const displayImage = previewUrl || user?.profilePicture || null;

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Profile</h1>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center mb-6">
              <div
                className="avatar placeholder mb-4 relative group cursor-pointer"
                onClick={handleAvatarClick}
              >
                {displayImage ? (
                  <div className="w-24 rounded-full overflow-hidden">
                    <img
                      src={displayImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-neutral text-neutral-content rounded-full w-24">
                    <span className="text-3xl">
                      {user?.fullName?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Pencil className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-sm font-medium">Edit</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <h2 className="text-2xl font-semibold">
                {user?.fullName || "Full Name"}
              </h2>
              <p className="text-base-content/70">
                {user?.email || "user@example.com"}
              </p>
            </div>
            <div className="divider"></div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-base-content/70">
                  This is a placeholder bio. Update your profile to add a
                  personal bio.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Member Since</h3>
                <p className="text-base-content/70">January 2024</p>
              </div>
            </div>
            <div className="card-actions justify-end mt-6">
              <button className="btn btn-primary">Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
