import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import './TrialChatbot.css';
import { ClinicalTrial } from '../types';
import { API_ENDPOINTS } from '../config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TrialChatbotProps {
  trial: ClinicalTrial;
  isOpen: boolean;
  onClose: () => void;
}

const TrialChatbot: React.FC<TrialChatbotProps> = ({ trial, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I can help answer questions about this clinical trial: "${trial.title}". What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset messages when trial changes
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I can help answer questions about this clinical trial: "${trial.title}". What would you like to know?`,
          timestamp: new Date()
        }
      ]);
      setInput('');
    }
  }, [trial.nct_id, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.TRIAL_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nct_id: trial.nct_id,
          question: userMessage.content,
          chat_history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          trial: trial
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="trial-chatbot-overlay" onClick={onClose}>
      <div className="trial-chatbot-container" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <FaRobot />
            <div>
              <h3>Ask about this trial</h3>
              <p className="trial-name">{trial.title}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close chatbot">
            <FaTimes />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-icon">
                {message.role === 'user' ? <FaUser /> : <FaRobot />}
              </div>
              <div className="message-content">
                <p>{message.content}</p>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant-message">
              <div className="message-icon">
                <FaRobot />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-form" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about this trial..."
            disabled={loading}
            className="chatbot-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="send-button"
            aria-label="Send message"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrialChatbot;

