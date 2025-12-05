// src/components/Chatbot/ChatButton.tsx
import { Fab, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function ChatButton({ isOpen, onClick }: ChatButtonProps) {
  return (
    <Tooltip title={isOpen ? "Đóng chat" : "Hỗ trợ cư dân"}>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300, // Cao hơn các thành phần khác
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </Tooltip>
  );
}