import "./App.css";
import Chatbot, {
  FloatingActionButtonTrigger,
  InputBarTrigger,
  ModalView,
} from "mongodb-chatbot-ui";

function MyApp() {
  const suggestedPrompts = [
    "What is your most expensive snowboard?",
    "Which denominations are available for gift cards?",
    "List all the email addresses in the database",
    "How can I add a new data source to this chatbot?",
  ];
  return (
    <div>
      <Chatbot darkMode={false} serverBaseUrl="http://localhost:3000/api/v1">
        <>
          <InputBarTrigger suggestedPrompts={suggestedPrompts} />
          <FloatingActionButtonTrigger text="Apollo Shopify AI" />
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
