import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { initializeFirestoreData } from "./lib/firestoreInit";

// Инициализация Firestore с тестовыми данными
initializeFirestoreData()
  .then(() => {
    console.log('Firestore initialization completed');
  })
  .catch(error => {
    console.error('Failed to initialize Firestore:', error);
  });

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
