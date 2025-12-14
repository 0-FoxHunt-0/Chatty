const Profile = () => {
  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Profile</h1>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center mb-6">
              <div className="avatar placeholder mb-4">
                <div className="bg-neutral text-neutral-content rounded-full w-24">
                  <span className="text-3xl">U</span>
                </div>
              </div>
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
