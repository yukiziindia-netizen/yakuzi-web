"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Save, UploadCloud, RefreshCw, Send, AlertCircle, X, Edit, Trash2, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { AdminLayout } from "@/components/layout/admin-layout";

export default function ChatbotAdminPage() {
  const [prompt, setPrompt] = useState("");
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState("");
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  
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
  
  const fetchJobStatus = async () => {
    try {
      const res = await apiClient.get("/chatbot/job-status");
      if (res.data?.jobId) setJobId(res.data.jobId);
      if (res.data?.status) setJobStatus(res.data.status);

      const historyRes = await apiClient.get("/chatbot/job-history");
      if (historyRes.data) {
        setJobHistory(historyRes.data);
      }
    } catch (err) {
      console.error("Failed to load job status and history", err);
    }
  };

  useEffect(() => {
    fetchJobStatus();
  }, []);

  const handleDeleteJob = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Job",
      message: "Are you sure you want to delete this job record? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/chatbot/job-history/${id}`);
          toast.success("Job deleted from history");
          fetchJobStatus();
        } catch (err) {
          toast.error("Failed to delete job");
        }
      }
    });
  };

  const handleEditJob = (job: any) => {
    if (job.history && Array.isArray(job.history)) {
      setMessages(job.history);
      toast.success("Conversation loaded into chat sandbox!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("No conversation history available for this job.");
    }
  };
  
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptModalName, setPromptModalName] = useState("yukizi-custom-bot");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleUpdatePrompt = async () => {
    if (!prompt.trim()) return;
    setIsUpdatingPrompt(true);
    const toastId = toast.loading("Updating persona...");
    try {
      const res = await fetch("/api/chatbot/train/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        toast.success("Persona updated successfully!", { id: toastId });
      } else {
        toast.error("Failed to update persona.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating persona.", { id: toastId });
    } finally {
      setIsUpdatingPrompt(false);
    }
  };

  const handleUploadDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading("Uploading dataset...");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (customName) formData.append("custom_name", customName);
      
      const res = await fetch("/api/chatbot/train/dataset", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok && data.job_id) {
        setJobId(data.job_id);
        setJobStatus(data.status);
        await apiClient.post("/chatbot/job-status", { jobId: data.job_id, status: data.status }).catch(() => {});
        toast.success(data.message || "Dataset uploaded and tuning started!", { id: toastId });
      } else {
        toast.error(data.error || data.detail || "Failed to start tuning.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading dataset.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/chatbot/train/status/${jobId}`);
      const data = await res.json();
      if (res.ok) {
        setJobStatus(data.status);
        await apiClient.post("/chatbot/job-status", { jobId, status: data.status }).catch(() => {});
        fetchJobStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrainConversation = () => {
    if (messages.length < 2) {
      toast.error("You need at least one user-assistant exchange to train the model.");
      return;
    }
    setPromptModalName("yukizi-custom-bot");
    setIsPromptModalOpen(true);
  };

  const executeTrainConversation = async () => {
    setIsPromptModalOpen(false);
    setIsUploading(true);
    const toastId = toast.loading("Learning from conversation...");
    try {
      const res = await fetch("/api/chatbot/train/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages,
          custom_name: promptModalName || "yukizi-custom-bot"
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.job_id) {
        setJobId(data.job_id);
        setJobStatus(data.status);
        await apiClient.post("/chatbot/job-status", { jobId: data.job_id, status: data.status, history: messages }).catch(() => {});
        fetchJobStatus();
        toast.success(data.message || "Conversation dataset uploaded and tuning started!", { id: toastId });
      } else {
        toast.error(data.error || data.detail || "Failed to start tuning.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading conversation dataset.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    
    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsTyping(true);
    
    try {
      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          history: messages.slice(-10) 
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not connect to chatbot." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Network failure." }]);
    } finally {
      setIsTyping(false);
    }
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
          <p className="text-muted-foreground text-sm">Configure persona, fine-tune models, and test your assistant.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {jobId && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">Last Job ID</span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", jobStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : jobStatus === 'SUCCEEDED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                  {jobStatus || "UNKNOWN"}
                </span>
              </div>
              <div className="text-sm font-mono truncate">{jobId}</div>
            </div>
            <button 
              onClick={handleCheckStatus}
              className="text-xs flex items-center gap-1 text-primary hover:underline px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        )}

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
                    onConfirm: () => setMessages([])
                  });
                }}
                disabled={messages.length === 0}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
                title="Clear chat history"
              >
                <Eraser className="h-3.5 w-3.5" /> Clear
              </button>
              <button 
                onClick={handleTrainConversation}
                disabled={isUploading || messages.length < 2}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
              >
                {isUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} 
                Train on Conversation
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
              <div key={i} className={cn("flex max-w-[80%]", msg.role === "user" ? "ml-auto" : "mr-auto")}>
                <div className={cn("p-3 rounded-2xl text-sm", 
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-accent rounded-bl-sm"
                )}>
                  {msg.content}
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

        {/* Training History */}
        <div className="glass p-6 rounded-2xl border border-white/20">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            Training History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Job ID / Model Name</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {jobHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      No training history found. Start training to see jobs here.
                    </td>
                  </tr>
                ) : (
                  jobHistory.map((job: any) => (
                    <tr key={job.id} className="hover:bg-accent/20">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {job.jobId}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", job.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : job.status === 'SUCCEEDED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditJob(job)}
                            disabled={!job.history || !Array.isArray(job.history) || job.history.length === 0}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:cursor-not-allowed"
                            title={job.history && Array.isArray(job.history) && job.history.length > 0 ? "Load conversation into Sandbox" : "No history available for this older job"}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete job from history"
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

      {/* Custom Prompt Modal */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-lg font-bold mb-2">Train on Conversation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter an optional custom name for this tuning job:
            </p>
            <input 
              type="text" 
              value={promptModalName}
              onChange={(e) => setPromptModalName(e.target.value)}
              className="w-full p-3 rounded-xl bg-accent border border-border text-sm outline-none focus:ring-2 focus:ring-primary mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") executeTrainConversation();
                if (e.key === "Escape") setIsPromptModalOpen(false);
              }}
            />
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsPromptModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeTrainConversation}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

        {/* Custom Confirmation Dialog */}
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
