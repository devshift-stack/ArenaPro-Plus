// AI Arena - Chat Page with Arena Functionality
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Users, 
  GitBranch, 
  FolderKanban, 
  TestTube2,
  Loader2,
  Bot,
  User,
  ChevronDown,
  Settings2,
  Paperclip,
  Mic,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useArena } from '@/hooks/useArena';
import { useChat } from '@/hooks/useChat';
import { learningApi } from '@/utils/api';

// Arena Mode Configuration
const ARENA_MODES = [
  {
    id: 'AUTO_SELECT',
    name: 'Auto-Select',
    icon: Sparkles,
    description: 'Arena wählt das beste Modell',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'COLLABORATIVE',
    name: 'Collaborative',
    icon: Users,
    description: 'Modelle arbeiten zusammen',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'DIVIDE_CONQUER',
    name: 'Divide & Conquer',
    icon: GitBranch,
    description: 'Aufgaben werden aufgeteilt',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'PROJECT',
    name: 'Project Mode',
    icon: FolderKanban,
    description: 'Kollaborative Projektplanung',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'TESTER',
    name: 'Tester Mode',
    icon: TestTube2,
    description: 'Automatisierte Tests',
    color: 'from-red-500 to-rose-500',
  },
];

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  modelName?: string;
  metadata?: {
    mode?: string;
    processingTime?: number;
    cost?: number;
    confidence?: number;
    subResults?: any[];
  };
  createdAt: Date;
}

export function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState('AUTO_SELECT');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, createChat, isLoading, isSending } = useChat({ chatId: currentChatId });
  const { models } = useArena();

  // Sync chatId from URL
  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    setProgress(0);

    try {
      // Progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 500);

      let targetChatId = currentChatId;

      // Create new chat if needed
      if (!targetChatId) {
        setProgressMessage('Chat wird erstellt...');
        const newChat = await createChat({ mode: selectedMode });
        // createChat returns the Chat object directly
        targetChatId = newChat.id;
        setCurrentChatId(targetChatId);
        navigate(`/chat/${targetChatId}`, { replace: true });
      }

      setProgressMessage('Sende an AI...');

      // Send message with explicit chatId
      await sendMessage(userMessage, targetChatId);

      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage('Fertig!');
    } catch (error) {
      console.error('Send failed:', error);
      setProgressMessage('Fehler beim Senden');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage('');
      }, 500);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle regenerate message
  const handleRegenerate = async (messageId: string) => {
    if (isProcessing || !currentChatId) return;

    // Find the user message before this assistant message to resend
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) return;

    const previousUserMessage = messages.slice(0, messageIndex).reverse().find(m => m.role === 'user');
    if (!previousUserMessage) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Regeneriere Antwort...');

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 500);

      await sendMessage(previousUserMessage.content, currentChatId);

      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage('Fertig!');
    } catch (error) {
      console.error('Regenerate failed:', error);
      setProgressMessage('Fehler beim Regenerieren');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage('');
      }, 500);
    }
  };

  // Get current mode config
  const currentMode = ARENA_MODES.find(m => m.id === selectedMode)!;
  const ModeIcon = currentMode.icon;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${currentMode.color}`}>
            <ModeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {chatId ? 'Chat fortsetzen' : 'Neuer Chat'}
            </h1>
            <p className="text-sm text-slate-400">{currentMode.description}</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedMode} onValueChange={setSelectedMode}>
            <SelectTrigger className="w-[200px] bg-slate-900 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {ARENA_MODES.map(mode => (
                <SelectItem 
                  key={mode.id} 
                  value={mode.id}
                  className="text-white hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <mode.icon className="w-4 h-4" />
                    <span>{mode.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon"
            className="border-slate-700 hover:bg-slate-800"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6">
        <div className="max-w-4xl mx-auto py-6 space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MessageBubble message={message} onRegenerate={handleRegenerate} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${currentMode.color}`}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 bg-slate-900 rounded-lg p-4 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                  <span className="text-sm text-slate-300">{progressMessage || 'Verarbeite...'}</span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Model Selection (for non-auto modes) */}
          {selectedMode !== 'AUTO_SELECT' && (
            <div className="flex flex-wrap gap-2 mb-3">
              {models?.slice(0, 6).map(model => (
                <Badge
                  key={model.id}
                  variant={selectedModels.includes(model.id) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    selectedModels.includes(model.id) 
                      ? 'bg-cyan-600 hover:bg-cyan-700' 
                      : 'hover:bg-slate-800'
                  }`}
                  onClick={() => {
                    setSelectedModels(prev => 
                      prev.includes(model.id)
                        ? prev.filter(id => id !== model.id)
                        : [...prev, model.id]
                    );
                  }}
                >
                  {model.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Schreibe deine Nachricht..."
                className="w-full min-h-[60px] max-h-[200px] pr-24 bg-slate-900 border border-slate-700 
                           focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 resize-none
                           rounded-md px-3 py-2 text-white placeholder:text-slate-500"
                disabled={isProcessing}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className={`h-[60px] px-6 bg-gradient-to-r ${currentMode.color} 
                         hover:opacity-90 disabled:opacity-50`}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Enter zum Senden • Shift+Enter für neue Zeile</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Powered by</span>
              <span className="text-cyan-500 font-medium">AI Arena</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message, onRegenerate }: {
  message: {
    id: string;
    role: string;
    content: string;
    modelId?: string;
    modelName?: string;
    metadata?: Record<string, any>;
    createdAt?: string;
  };
  onRegenerate?: (messageId: string) => void;
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (type: 'up' | 'down') => {
    if (isSubmittingFeedback || feedback === type) return;

    setIsSubmittingFeedback(true);
    try {
      await learningApi.recordFeedback({
        messageId: message.id,
        feedbackType: type === 'up' ? 'POSITIVE' : 'NEGATIVE',
        metadata: {
          modelId: message.modelId,
          modelName: message.modelName,
        }
      });
      setFeedback(type);
      toast({
        title: 'Feedback gespeichert',
        description: type === 'up' ? 'Danke für das positive Feedback!' : 'Danke für dein Feedback. Wir werden uns verbessern.',
      });
    } catch (error) {
      console.error('Feedback failed:', error);
      toast({
        title: 'Fehler',
        description: 'Feedback konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`p-2 rounded-lg ${
        isUser 
          ? 'bg-slate-700' 
          : 'bg-gradient-to-br from-cyan-500 to-blue-500'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {/* Model Info */}
        {!isUser && message.modelName && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-cyan-400">
              {message.modelName}
            </span>
            {message.metadata?.mode && (
              <Badge variant="outline" className="text-xs">
                {message.metadata.mode}
              </Badge>
            )}
            {message.metadata?.processingTime && (
              <span className="text-xs text-slate-500">
                {(message.metadata.processingTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className={`rounded-lg p-4 ${
          isUser 
            ? 'bg-cyan-600 text-white' 
            : 'bg-slate-900 border border-slate-800 text-slate-200'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');

                    if (!isInline && match) {
                      return (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg !my-2"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      );
                    }

                    return (
                      <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sub-Results (for collaborative modes) */}
        {message.metadata?.subResults && message.metadata.subResults.length > 0 && (
          <div className="mt-3 space-y-2">
            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <ChevronDown className="w-4 h-4" />
              <span>Teilergebnisse anzeigen ({message.metadata.subResults.length})</span>
            </button>
          </div>
        )}

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-slate-400 hover:text-white"
              onClick={copyToClipboard}
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? 'Kopiert!' : 'Kopieren'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 ${feedback === 'up' ? 'text-green-400' : 'text-slate-400 hover:text-green-400'}`}
              onClick={() => handleFeedback('up')}
              disabled={isSubmittingFeedback}
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 ${feedback === 'down' ? 'text-red-400' : 'text-slate-400 hover:text-red-400'}`}
              onClick={() => handleFeedback('down')}
              disabled={isSubmittingFeedback}
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-slate-400 hover:text-white"
              onClick={handleRegenerate}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Regenerieren
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
