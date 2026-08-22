"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Save, Send, Trash2, Eraser, Brain, Power, PowerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { sendChatMessageFull, type ChatMessage } from "@yukizi/api-client";
import {
  useChatbotRules, useCreateChatbotRule, useUpdateChatbotRule, useDeleteChatbotRule, useExtractChatbotRule,
} from "@/hooks/useChatbot";

export default function ChatbotAdminPage() {
  const { data: rules = [], isLoading: rulesLoading, isError: rulesError } = useChatbotRules();
  const createRule = useCreateChatbotRule();
  const updateRule = useUpdateChatbotRule();
  const deleteRule = useDeleteChatbotRule();
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

  const chatEndRef = useRef<HTMLDivElement>(null);

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
      toast.error("You need at least one user-assistant exchange to save a rule.");
      return;
    }
    try {
      const draft = await extractRule.mutateAsync(messages.map((m) => ({ role: m.role, content: m.content })));
      setDraftTrigger(draft.trigger);
      setDraftInstruction(draft.instruction);
    } catch (err) {
      // Extraction failing shouldn't block saving — admin can type it manually.
      setDraftTrigger("");
      setDraftInstruction("");
      toast.error("Couldn't auto-extract a rule — fill it in manually below.");
    }
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (createRule.isPending) return;
    if (!draftTrigger.trim() || !draftInstruction.trim()) {
      toast.error("Both fields are required.");
      return;
    }
    try {
      await createRule.mutateAsync({ trigger: draftTrigger.trim(), instruction: draftInstruction.trim() });
      toast.success("Rule saved.");
      setIsSaveModalOpen(false);
    } catch (err) {
      toast.error("Failed to save rule.");
    }
  };

  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      await updateRule.mutateAsync({ id, payload: { isActive: !isActive } });
    } catch {
      toast.error("Failed to update rule.");
    }
  };

  const handleDeleteRule = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Rule",
      message: "Are you sure you want to delete this rule? The live chatbot will stop following it immediately.",
      onConfirm: async () => {
        try {
          await deleteRule.mutateAsync(id);
          toast.success("Rule deleted.");
        } catch {
          toast.error("Failed to delete rule.");
        }
      },
    });
  };

  const handleClearAllRules = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Clear All Rules & Reset Memory",
      message: "Are you sure you want to delete every learned rule? The chatbot will be reset to its default persona.",
      onConfirm: async () => {
        try {
          await Promise.all(rules.map((rule) => deleteRule.mutateAsync(rule.id)));
          toast.success("All rules cleared — chatbot reset to default persona.");
        } catch {
          toast.error("Failed to clear all rules.");
        }
      },
    });
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
                      message: "Are you sure you want to clear the sandbox chat?",
                      onConfirm: () => setMessages([]),
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
                  Save conversation
                </button>
              </div>
            </div>

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

          {/* Rules */}
          <div className="glass p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Learned Rules</h2>
              {rules.length > 0 && (
                <button
                  onClick={handleClearAllRules}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                  title="Delete every rule and reset the chatbot to its default persona"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All & Reset Memory
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Trigger</th>
                    <th className="py-3 px-4 font-medium">Instruction</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rulesLoading ? (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : rulesError ? (
                    <tr><td colSpan={4} className="py-8 text-center text-red-500">Couldn't load rules — try refreshing.</td></tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No rules yet. Teach the bot something in the sandbox above, then "Save conversation."
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-accent/20">
                        <td className="py-3 px-4 font-medium">{rule.trigger}</td>
                        <td className="py-3 px-4 text-muted-foreground">{rule.instruction}</td>
                        <td className="py-3 px-4">
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                            {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleRule(rule.id, rule.isActive)}
                              disabled={updateRule.isPending}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30"
                              title={rule.isActive ? "Deactivate" : "Activate"}
                            >
                              {rule.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete rule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Save Conversation Modal */}
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-2">Save conversation as a rule</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review or edit before saving — this becomes live for every customer immediately.
              </p>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Trigger</label>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Instruction</label>
              <textarea
                value={draftInstruction}
                onChange={(e) => setDraftInstruction(e.target.value)}
                placeholder="e.g. must say kuji kari"
                rows={3}
                className="w-full p-3 rounded-xl bg-accent border border-border text-sm outline-none focus:ring-2 focus:ring-primary mb-6"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={createRule.isPending}
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
