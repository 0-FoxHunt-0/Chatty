import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const Home = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-full bg-base-200 flex flex-col pt-4 px-[5%] pb-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full mx-auto flex-1 flex flex-col min-h-0">
        <div className="flex flex-1 rounded-lg overflow-hidden min-h-0">
          <Sidebar />
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>
      </div>
    </div>
  );
};

export default Home;
