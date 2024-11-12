import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
export function useAutoResizingTextArea() {
  const adjustHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  return {
    ref: (textArea: HTMLTextAreaElement | null) => {
      if (textArea) adjustHeight(textArea);
    },
    onInput: (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight(e.target as HTMLTextAreaElement);
    },
  };
}
