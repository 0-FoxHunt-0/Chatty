import { useThemeStore, DAISYUI_THEMES } from "../store/useThemeStore";
import { Send } from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hello! How are you?", isSent: false },
  { id: 2, content: "I'm doing great, thanks for asking!", isSent: true },
  { id: 3, content: "That's wonderful to hear!", isSent: false },
];

const Settings = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
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

        {/* Chat Messages */}
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

        {/* Chat Input */}
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
    </div>
  );
};

export default Settings;
