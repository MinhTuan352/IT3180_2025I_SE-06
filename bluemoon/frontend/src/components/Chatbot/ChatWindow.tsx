// src/components/Chatbot/ChatWindow.tsx
import {
  Box, Paper, Typography, TextField, IconButton,
  Avatar, List, ListItem, Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatbotApi } from '../../api/chatbotApi';
import { fetchUserContext, getSystemContext } from '../../utils/chatbotKnowledge';
import CircularProgress from '@mui/material/CircularProgress';
import ReactMarkdown from 'react-markdown';

// Định nghĩa kiểu tin nhắn
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Interface cho dữ liệu user context
interface UserContextData {
  hasResident: boolean;
  resident?: any;
  apartment?: any;
  fees?: any[];
  services?: any[];
  notifications?: any[];
  incidents?: any[];
}

export default function ChatWindow({ isOpen }: { isOpen: boolean }) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [userContext, setUserContext] = useState<UserContextData | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: `Xin chào ${user?.username || 'Cư dân'}! Tôi là trợ lý ảo Bluemoon. Tôi có thể giúp gì cho bạn?`, sender: 'bot', timestamp: new Date() }
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // [MỚI] Fetch user context khi mở chatbot
  useEffect(() => {
    if (isOpen && !userContext) {
      loadUserContext();
    }
  }, [isOpen]);

  const loadUserContext = async () => {
    try {
      setIsLoadingContext(true);
      const context = await fetchUserContext();
      setUserContext(context);

      // Cập nhật tin nhắn chào mừng với tên thật
      if (context?.hasResident && context.resident?.fullName) {
        setMessages([{
          id: 1,
          text: `Xin chào **${context.resident.fullName}**! Tôi là trợ lý ảo Bluemoon.\n\nTôi có thể giúp bạn tra cứu thông tin về:\n- 🏠 Căn hộ của bạn\n- 💰 Công nợ & hóa đơn\n- 📋 Dịch vụ đã đăng ký\n- 📜 Nội quy tòa nhà\n\nHãy hỏi tôi bất cứ điều gì!`,
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Lỗi tải user context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Hiển thị tin nhắn của User ngay lập tức
    const userText = input;
    const userMsg: Message = { id: Date.now(), text: userText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Chuẩn bị dữ liệu (Context) - SỬ DỤNG DỮ LIỆU TỪ DATABASE
      const systemContext = getSystemContext(userContext);

      // 3. Gọi AI
      const aiResponse = await chatbotApi.sendMessage(systemContext, userText);

      // 4. Hiển thị tin nhắn của Bot
      const botMsg: Message = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      // Xử lý lỗi
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  if (!isOpen) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 90,
        right: 24,
        width: 350,
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        zIndex: 1300,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 1.5 }}>
          <SmartToyIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">Trợ lý Bluemoon</Typography>
          <Typography variant="caption">
            {isLoadingContext ? 'Đang tải dữ liệu...' : 'Luôn sẵn sàng hỗ trợ 24/7'}
          </Typography>
        </Box>
        {/* Indicator cho biết đã có context */}
        {userContext?.hasResident && (
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'success.light',
            animation: 'pulse 2s infinite'
          }} />
        )}
      </Box>

      {/* Message List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f7f9' }}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id} sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '80%',
                  borderRadius: 2,
                  bgcolor: msg.sender === 'user' ? 'primary.light' : 'white',
                  color: msg.sender === 'user' ? 'white' : 'text.primary',
                  '& p': { m: 0 },
                  '& ul, & ol': { pl: 2, my: 0.5 },
                  '& li': { mb: 0.5 },
                  '& strong': { fontWeight: 'bold' }
                }}
              >
                {msg.sender === 'bot' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  <Typography variant="body2">{msg.text}</Typography>
                )}
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, fontSize: '0.65rem', textAlign: 'right' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Paper>
            </ListItem>
          ))}

          {/* Hiển thị hiệu ứng "Đang nhập..." khi chờ AI */}
          {isLoading && (
            <ListItem sx={{ justifyContent: 'flex-start', mb: 1 }}>
              <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={14} />
                  <Typography variant="caption" sx={{ fontStyle: 'italic' }}>Đang trả lời...</Typography>
                </Box>
              </Paper>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      <Divider />

      {/* Input Area */}
      <Box sx={{ p: 2, bgcolor: 'white', display: 'flex' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Nhập câu hỏi của bạn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || isLoadingContext}
          sx={{ mr: 1 }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || isLoading || isLoadingContext}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}