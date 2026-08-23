"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Save, Send, Eraser, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { sendChatMessageFull, type ChatMessage } from "@yukizi/api-client";
import { useCreateChatbotRule, useExtractChatbotRule, useUpdateChatbotRule } from "@/hooks/useChatbot";
import { SavedTrainingsPanel } from "@/components/chatbot/saved-trainings-panel";
import type { ChatbotRule, ChatbotRuleTier } from "@/api/chatbot.api";

export default function ChatbotAdminPage() {
  const createRule = useCreateChatbotRule();
  const updateRule = useUpdateChatbotRule();
  const extractRule = useExtractChatbotRule();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string; thoughts?: string; thinkingTimeMs?: number }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [draftTrigger, setDraftTrigger] = useState("");
  const [draftInstruction, setDraftInstruction] = useState("");
  const [draftTier, setDraftTier] = useState<ChatbotRuleTier>("SURFACE");
  // Set while re-teaching an existing training — Save then UPDATES that rule
  // instead of creating a new one.
  const [resaveRule, setResaveRule] = useState<ChatbotRule | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const sandboxTopRef = useRef<HTMLDivElement>(null);

  const handleContinueTraining = (rule: ChatbotRule) => {
    const stored = Array.isArray(rule.history) ? rule.history : [];
    if (stored.length > 0) {
      setMessages(stored.map((m) => ({ role: m.role, content: m.content ?? "" })));
    } else {
      // Rules saved before conversations were stored: seed the sandbox with a
      // recap of the rule so the bot has the context to build on.
      setMessages([
        {
          role: "user",
          content: `Earlier training — when someone asks about "${rule.trigger}", you should: ${rule.instruction}`,
        },
        {
          role: "assistant",
          content: "Understood — that's my current training on this. Tell me how you'd like to refine it. 😊",
        },
      ]);
    }
    setResaveRule(rule);
    sandboxTopRef.current?.scrollIntoView({ behavior: "smooth" });
    toast.success("Training loaded — keep teaching, then hit Resave training.");
  };

  const cancelResave = () => {
    setResaveRule(null);
    setMessages([]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const history = messages.slice(-10) as ChatMessage[];
      const result = await sendChatMessageFull(userMsg, history);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: result.response,
        thoughts: result.thoughts,
        thinkingTimeMs: result.thinkingTimeMs,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Could not connect to chatbot." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOpenSaveModal = async () => {
    if (messages.length < 2) {
      toast.error("You need at least one user-assistant exchange to save a training.");
      return;
    }
    setDraftTier(resaveRule?.tier ?? "SURFACE");
    try {
      // Gemini distills the conversation into an editable trigger→instruction
      // draft. Failing extraction shouldn't block saving — fill in manually.
      const draft = await extractRule.mutateAsync(messages.map((m) => ({ role: m.role, content: m.content })));
      setDraftTrigger(draft.trigger);
      setDraftInstruction(draft.instruction);
    } catch {
      // On a resave, the rule's current values are a better fallback than blanks.
      setDraftTrigger(resaveRule?.trigger ?? "");
      setDraftInstruction(resaveRule?.instruction ?? "");
      toast.error("Couldn't auto-extract a rule — fill it in manually below.");
    }
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (createRule.isPending || updateRule.isPending) return;
    if (!draftTrigger.trim() || !draftInstruction.trim()) {
      toast.error("Both fields are required.");
      return;
    }
    const payload = {
      trigger: draftTrigger.trim(),
      instruction: draftInstruction.trim(),
      tier: draftTier,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    try {
      if (resaveRule) {
        await updateRule.mutateAsync({ id: resaveRule.id, payload });
        toast.success("Training resaved — the live chatbot updates immediately.");
        setResaveRule(null);
      } else {
        await createRule.mutateAsync(payload);
        toast.success("Training saved — the live chatbot updates immediately.");
      }
      setIsSaveModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save training.");
    }
  };

  const formatFormattedMessage = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const lineElements = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const rest = line.substring(line.indexOf(trimmed.startsWith('* ') ? '*' : '-') + 1);
        const bulletParts = rest.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return (
          <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-primary font-bold">•</span>
            <div className="flex-1">{bulletParts}</div>
          </div>
        );
      }

      return (
        <div key={lineIdx} className={trimmed === '' ? 'h-2' : ''}>
          {lineElements}
        </div>
      );
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Chatbot Management</h1>
            <p className="text-muted-foreground text-sm">Configure persona, teach store-specific behavior, and test your assistant.</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div ref={sandboxTopRef} />
          {/* Sandbox Chat */}
          <div className="glass flex flex-col rounded-2xl border border-white/20 h-[700px] overflow-hidden shadow-2xl mb-8">
            <div className="p-4 border-b border-white/20 bg-accent/20 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Live Sandbox Testing
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: "Clear Chat",
                      message: resaveRule
                        ? "Clear the sandbox chat? This also stops re-teaching the loaded training (the training itself is untouched)."
                        : "Are you sure you want to clear the sandbox chat?",
                      onConfirm: cancelResave,
                    });
                  }}
                  disabled={messages.length === 0}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
                  title="Clear chat history"
                >
                  <Eraser className="h-3.5 w-3.5" /> Clear
                </button>
                <button
                  onClick={handleOpenSaveModal}
                  disabled={extractRule.isPending || messages.length < 2}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
                >
                  <Save className="h-3.5 w-3.5" />
                  {extractRule.isPending ? "Extracting…" : resaveRule ? "Resave training" : "Save conversation"}
                </button>
              </div>
            </div>

            {resaveRule && (
              <div className="px-4 py-2 bg-primary/5 border-b border-primary/20 flex items-center justify-between gap-2 text-xs">
                <span className="text-primary font-medium truncate">
                  Re-teaching: {resaveRule.trigger}
                </span>
                <button
                  type="button"
                  onClick={cancelResave}
                  className="text-muted-foreground hover:text-foreground font-medium flex-shrink-0"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Bot className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">Send a message to test the chatbot</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={cn("flex max-w-[85%]", msg.role === "user" ? "ml-auto" : "mr-auto")}>
                  <div className={cn("p-3 rounded-2xl text-sm",
                    msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-accent rounded-bl-sm"
                  )}>
                    {msg.role === "assistant" && msg.thoughts && (
                      <details className="mb-2 text-xs bg-background/50 rounded-xl p-2 border border-border">
                        <summary className="cursor-pointer font-semibold flex items-center gap-1.5 select-none hover:text-primary transition-colors">
                          <Brain className="w-3.5 h-3.5 text-primary" />
                          Thinking Process {msg.thinkingTimeMs ? `(${(msg.thinkingTimeMs / 1000).toFixed(1)}s)` : ''}
                        </summary>
                        <div className="mt-2 text-2xs leading-relaxed whitespace-pre-wrap font-mono opacity-80 border-t border-border/50 pt-2">
                          {msg.thoughts}
                        </div>
                      </details>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">{formatFormattedMessage(msg.content)}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex max-w-[80%] mr-auto">
                  <div className="p-3 rounded-2xl bg-accent rounded-bl-sm text-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-background border-t border-border flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask the chatbot something..."
                className="flex-1 bg-transparent border-none outline-none text-sm px-2"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !chatInput.trim()}
                className="bg-primary text-primary-foreground p-3 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-all flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>

          <SavedTrainingsPanel onContinueTraining={handleContinueTraining} />
        </div>

        {/* Save Conversation Modal */}
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-2">{resaveRule ? "Resave this training" : "Save this conversation as training"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review or edit the extracted rule — it becomes live for every customer immediately.
              </p>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Trigger (when a customer asks about…)</label>
              <input
                type="text"
                value={draftTrigger}
                onChange={(e) => setDraftTrigger(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsSaveModalOpen(false);
                  if (e.key === "Enter") handleConfirmSave();
                }}
                placeholder="e.g. best comic recommendation"
                className="w-full p-3 rounded-xl bg-accent border border-border text-sm outline-none focus:ring-2 focus:ring-primary mb-3"
                autoFocus
              />
              <label className="block text-xs font-medium text-muted-foreground mb-1">Instruction (the bot should…)</label>
              <textarea
                value={draftInstruction}
                onChange={(e) => setDraftInstruction(e.target.value)}
                placeholder="e.g. recommend Maayan and mention it ships free"
                rows={3}
                className="w-full p-3 rounded-xl bg-accent border border-border text-sm outline-none focus:ring-2 focus:ring-primary mb-3"
              />
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tier</label>
              <div className="flex gap-2 mb-6">
                {(["SURFACE", "CORE"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setDraftTier(tier)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors",
                      draftTier === tier ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent",
                    )}
                  >
                    {tier === "CORE" ? "Core" : "Surface"}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={createRule.isPending || updateRule.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background border border-border p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4"
            >
              <h3 className="text-lg font-bold mb-2">{confirmDialog.title}</h3>
              <p className="text-muted-foreground text-sm mb-6">{confirmDialog.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
