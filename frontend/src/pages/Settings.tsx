const Settings = () => {
  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Settings</h1>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">
                  Account Settings
                </span>
              </label>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Display Name</span>
              </label>
              <input
                type="text"
                placeholder="Your display name"
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Your email"
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Theme</span>
              </label>
              <select className="select select-bordered w-full">
                <option>Light</option>
                <option>Dark</option>
                <option>Auto</option>
              </select>
            </div>
            <div className="form-control mt-6">
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

