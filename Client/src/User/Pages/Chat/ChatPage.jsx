import UserChat from './UserChat';

const ChatPage = () => {
  return (
    <div className="mt-2">
      <h2 className="uppercase text-xl font-medium text-[#212B25] mb-4">
        Tin nhắn của bạn
      </h2>
      
      <UserChat inProfile={true} />
    </div>
  );
};

export default ChatPage; 