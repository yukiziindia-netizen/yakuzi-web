"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Save, UploadCloud, RefreshCw, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatbotAdminPage() {
  const [prompt, setPrompt] = useState("");
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState("");
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleUpdatePrompt = async () => {
    if (!prompt.trim()) return;
    setIsUpdatingPrompt(true);
    try {
      const res = await fetch("/api/chatbot/train/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        alert("Persona updated successfully!");
      } else {
        alert("Failed to update persona.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating persona.");
    } finally {
      setIsUpdatingPrompt(false);
    }
  };

  const handleUploadDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    
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
        alert("Dataset uploaded and tuning started!");
      } else {
        alert(data.error || data.detail || "Failed to start tuning.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading dataset.");
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
      }
    } catch (err) {
      console.error(err);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Settings */}
        <div className="space-y-8">
          
          {/* Persona Panel */}
          <div className="glass p-6 rounded-2xl border border-white/20">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-primary" />
              Dynamic Persona Training
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Instantly update the chatbot&apos;s system instructions. Changes apply immediately.
            </p>
            <textarea 
              className="w-full h-32 p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
              placeholder="You are a helpful e-commerce assistant..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleUpdatePrompt}
                disabled={isUpdatingPrompt || !prompt.trim()}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {isUpdatingPrompt ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Persona
              </button>
            </div>
          </div>

          {/* Dataset Panel */}
          <div className="glass p-6 rounded-2xl border border-white/20">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <UploadCloud className="h-5 w-5 text-primary" />
              Model Fine-Tuning
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a `.jsonl` dataset to train a dedicated Gemini model. The chatbot will auto-switch when training is complete.
            </p>
            
            <form onSubmit={handleUploadDataset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Dataset File (.jsonl)</label>
                <input 
                  type="file" 
                  accept=".jsonl"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Custom Model Name (Optional)</label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. yukizi-support-v2"
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button 
                type="submit"
                disabled={isUploading || !file}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 transition-all"
              >
                {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Start Fine-Tuning Job
              </button>
            </form>

            {jobId && (
              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Active Job ID</span>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", jobStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : jobStatus === 'SUCCEEDED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                    {jobStatus || "UNKNOWN"}
                  </span>
                </div>
                <div className="text-sm font-mono truncate mb-3">{jobId}</div>
                <button 
                  onClick={handleCheckStatus}
                  className="text-xs flex items-center gap-1 text-primary hover:underline"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh Status
                </button>
              </div>
            )}
          </div>
          
        </div>

        {/* RIGHT COLUMN: Sandbox Chat */}
        <div className="glass flex flex-col rounded-2xl border border-white/20 h-[600px] overflow-hidden">
          <div className="p-4 border-b border-white/20 bg-accent/20">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Live Sandbox Testing
            </h2>
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
              disabled={!chatInput.trim() || isTyping}
              className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
