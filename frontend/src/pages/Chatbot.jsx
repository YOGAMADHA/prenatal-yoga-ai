import ChatUI from "../components/ChatUI";
import { useApp } from "../context/AppContext";

export default function Chatbot() {
  const { trimester } = useApp();
  return (
    <div className="mx-auto h-[calc(100vh-96px)] max-w-4xl px-6 py-8">
      <h1 className="mb-4 text-2xl font-bold text-sage">Prenatal assistant</h1>
      <div className="h-[75vh]">
        <ChatUI trimester={trimester} />
      </div>
    </div>
  );
}
