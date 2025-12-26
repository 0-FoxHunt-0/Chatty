import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./reusables/MessageSkeleton";
import TypingIndicator from "./TypingIndicator";
import UserInfo from "./UserInfo";
import { useAuthStore } from "../store/useAuthStore";
import avatarImage from "../assets/avatar.jpg";
import { formatLocalTime } from "../lib/utils";
import { ChevronLeft } from "lucide-react";
import { useDeviceType } from "../lib/device";

const ChatContainer = () => {
  const {
    selectedUser,
    messages,
    areMessagesLoading,
    getMessages,
    isTyping,
    isUserInfoVisible,
    setUserInfoVisible,
  } = useChatStore();
  const { user } = useAuthStore();
  const deviceType = useDeviceType();
  const isDesktop = deviceType === "desktop";
  const isMobileOrTablet = deviceType === "mobile" || deviceType === "tablet";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const hasScrolledOnLoadRef = useRef<boolean>(false);
  const [isHoveringRightEdge, setIsHoveringRightEdge] = useState(false);
  const [swipeStart, setSwipeStart] = useState<number | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(
    () => window.innerWidth >= 1024
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Track window size for layout decisions (separate from device type)
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper function to get a valid profile picture URL
  const getProfilePicture = (profilePicture?: string | null): string => {
    return profilePicture && profilePicture.trim() !== ""
      ? profilePicture
      : avatarImage;
  };

  // Fetch messages when selected user changes
  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      // Reset message tracking when user changes
      prevMessagesLengthRef.current = 0;
      hasScrolledOnLoadRef.current = false;
    }
  }, [selectedUser?._id, getMessages]);

  // Auto-show UserInfo on desktop large screens when user is selected, but not on small screens
  useEffect(() => {
    if (!selectedUser) {
      // Close when no user is selected
      setUserInfoVisible(false);
    } else if (isDesktop && isLargeScreen) {
      // Auto-show on desktop large screens
      setUserInfoVisible(true);
    } else {
      // On small screens/mobile, start closed (user can open manually via swipe/button)
      setUserInfoVisible(false);
    }
  }, [selectedUser, isDesktop, isLargeScreen, setUserInfoVisible]);

  // Scroll to bottom when messages are initially loaded
  useEffect(() => {
    if (
      !areMessagesLoading &&
      messages.length > 0 &&
      !hasScrolledOnLoadRef.current
    ) {
      hasScrolledOnLoadRef.current = true;
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      }, 100);
    }
    // Reset scroll flag when loading starts (user changed)
    if (areMessagesLoading) {
      hasScrolledOnLoadRef.current = false;
    }
  }, [areMessagesLoading, messages.length]);

  // Auto-scroll to bottom when user sends a new message
  useEffect(() => {
    if (messages.length === 0 || !messagesContainerRef.current) return;

    const currentMessagesLength = messages.length;
    const lastMessage = messages[messages.length - 1];

    // Check if a new message was added and it's from the current user
    if (
      currentMessagesLength > prevMessagesLengthRef.current &&
      lastMessage &&
      lastMessage.senderId === user?._id
    ) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      }, 100);
    }

    // Update previous messages length
    prevMessagesLengthRef.current = currentMessagesLength;
  }, [messages, user?._id]);

  // Handle swipe gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDesktop) return; // Only on mobile/tablet
    setSwipeStart(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || swipeStart === null || isDesktop) return;

    const currentX = e.touches[0].clientX;
    const distance = swipeStart - currentX;

    // Only allow swiping from right edge when UserInfo is hidden
    // or swiping left when UserInfo is visible
    if (!isUserInfoVisible && distance < 0) {
      // Swiping left to open - limit to positive distance
      setSwipeDistance(Math.max(0, -distance));
    } else if (isUserInfoVisible && distance > 0) {
      // Swiping right to close - limit to panel width
      const maxDistance = 400; // Approximate panel width
      setSwipeDistance(Math.min(maxDistance, distance));
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping || isDesktop) return;

    const threshold = 100; // Minimum swipe distance to trigger

    if (!isUserInfoVisible && swipeDistance > threshold) {
      // Swiped left enough to open
      setUserInfoVisible(true);
    } else if (isUserInfoVisible && swipeDistance > threshold) {
      // Swiped right enough to close
      setUserInfoVisible(false);
    }

    // Reset swipe state
    setSwipeStart(null);
    setSwipeDistance(0);
    setIsSwiping(false);
  };

  // Handle right edge hover for desktop
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDesktop) return; // Only on desktop

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    // Use a larger hover area on small screens (5% from right) vs large screens (2% from right)
    const rightEdgeStart = isLargeScreen ? width * 0.98 : width * 0.95;

    if (!isUserInfoVisible && x >= rightEdgeStart) {
      setIsHoveringRightEdge(true);
    } else {
      setIsHoveringRightEdge(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHoveringRightEdge(false);
  };

  // Show skeleton messages while loading
  if (areMessagesLoading)
    return (
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-auto min-w-0">
          <ChatHeader />
          <MessageSkeleton />
          <MessageInput />
        </div>
        {/* UserInfo on desktop (large screens only) */}
        {isDesktop && isLargeScreen && (
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${
              isUserInfoVisible ? "w-[400px]" : "w-0"
            }`}
          >
            <UserInfo />
          </div>
        )}
      </div>
    );

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col lg:flex-row overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Desktop: Reveal button when hovering right edge - show on desktop regardless of screen size */}
      {!isUserInfoVisible && isDesktop && (
        <button
          onClick={() => setUserInfoVisible(true)}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-base-100 rounded-l-full p-2 shadow-lg border border-base-300 border-r-0 transition-all duration-300 ease-in-out hover:bg-base-200 ${
            isLargeScreen
              ? // On large screens: only show on hover
                isHoveringRightEdge
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full pointer-events-none"
              : // On small desktop screens: always visible but semi-transparent, fully visible on hover
              isHoveringRightEdge
              ? "opacity-100 translate-x-0"
              : "opacity-40 translate-x-0"
          }`}
          aria-label="Show user info"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Backdrop overlay when UserInfo is open (mobile/tablet always, or desktop on small screens) */}
      {isUserInfoVisible &&
        (isMobileOrTablet || (isDesktop && !isLargeScreen)) && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setUserInfoVisible(false)}
          />
        )}

      {/* Chat Container - shrinks on desktop when UserInfo is visible */}
      <div className="flex-1 flex flex-col overflow-auto transition-all duration-300 ease-in-out min-w-0">
        <ChatHeader />

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          style={{ scrollBehavior: "smooth" }}
        >
          {messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${
                message.senderId === user?._id ? "chat-end" : "chat-start"
              }`}
            >
              {/* Avatar - aligned with chat header */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === user?._id
                        ? getProfilePicture(user?.profilePicture)
                        : getProfilePicture(selectedUser?.profilePicture)
                    }
                    alt={
                      message.senderId === user?._id
                        ? user?.fullName
                        : selectedUser?.fullName
                    }
                  />
                </div>
              </div>
              {/* Chat Header - sender name and timestamp */}
              <div className="chat-header mb-1 flex items-center gap-2">
                <div className="text-sm text-base-content/70">
                  {message.senderId === user?._id
                    ? user?.fullName
                    : selectedUser?.fullName}
                </div>
                <time className="text-xs opacity-50">
                  {formatLocalTime(message.createdAt)}
                </time>
              </div>
              {/* Chat Bubble - contains text and/or image */}
              <div className="chat-bubble bg-base-300 p-2">
                {/* Text message */}
                {message.text && (
                  <div className={message.image ? "mb-2" : ""}>
                    {message.text}
                  </div>
                )}
                {/* Image message */}
                {message.image && (
                  <div>
                    <img
                      src={message.image}
                      alt="Message Image"
                      className="max-w-full sm:max-w-sm rounded-lg h-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}
          {/* Invisible element at the bottom for scrolling */}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput />
      </div>

      {/* UserInfo Component - Desktop sidebar (desktop on large screens only) */}
      {isDesktop && isLargeScreen && (
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${
            isUserInfoVisible ? "w-[400px]" : "w-0"
          }`}
        >
          <UserInfo />
        </div>
      )}

      {/* UserInfo as overlay (mobile/tablet always, or desktop on small screens) */}
      {(isMobileOrTablet || (isDesktop && !isLargeScreen)) && (
        <div
          className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm z-50 transition-transform duration-300 ease-in-out ${
            isUserInfoVisible ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            transform: isSwiping
              ? isUserInfoVisible
                ? `translateX(${swipeDistance}px)`
                : `translateX(calc(100% - ${swipeDistance}px))`
              : isUserInfoVisible
              ? "translateX(0)"
              : "translateX(100%)",
          }}
        >
          <UserInfo />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
