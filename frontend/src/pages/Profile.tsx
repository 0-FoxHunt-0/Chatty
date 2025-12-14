import { useRef } from "react";
import { Pencil } from "lucide-react";

const Profile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (): void => {
    // Boilerplate function - does nothing for now
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Profile</h1>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center mb-6">
              <div className="avatar placeholder mb-4 relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className="bg-neutral text-neutral-content rounded-full w-24">
                  <span className="text-3xl">U</span>
                </div>
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
              <h2 className="text-2xl font-semibold">fullName</h2>
              <p className="text-base-content/70">user@example.com</p>
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
