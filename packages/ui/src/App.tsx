import "./App.css";
import Chatbot, {
  FloatingActionButtonTrigger,
  InputBarTrigger,
  ModalView,
} from "mongodb-chatbot-ui";

function MyApp() {
  const suggestedPrompts = [
    "What products do you sell?",
  ];
  return (
    <div>
      <Chatbot darkMode={false} serverBaseUrl="http://localhost:3000/api/v1">
        <>
          <InputBarTrigger suggestedPrompts={suggestedPrompts} />
          <FloatingActionButtonTrigger text="Apollo GraphChat" />
          <ModalView
            initialMessageText="Welcome to Apollo Shopify AI Assistant. What can I help you with?"
            initialMessageSuggestedPrompts={suggestedPrompts}
          />
        </>
      </Chatbot>
    </div>
  );
}

export default MyApp;
