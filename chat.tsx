
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import * as TweetNaCl from 'tweetnacl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Lock, AlertCircle, CheckCheck, Check } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  encryptedContent: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isEncrypted: boolean;
}

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

const Chat = () => {
  const { user, name, partnerName } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myKeyPair, setMyKeyPair] = useState<KeyPair | null>(null);
  const [partnerPublicKey, setPartnerPublicKey] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate RSA key pair on mount (like WhatsApp)
  useEffect(() => {
    const generateKeyPair = () => {
      try {
        const keyPair = TweetNaCl.box.keyPair();
        const publicKeyStr = Buffer.from(keyPair.publicKey).toString('base64');
        const privateKeyStr = Buffer.from(keyPair.secretKey).toString('base64');

        setMyKeyPair({
          publicKey: publicKeyStr,
          privateKey: privateKeyStr,
        });

        // Send public key to partner via server
        fetch(`${import.meta.env.VITE_API_URL}/api/keys/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            publicKey: publicKeyStr,
          }),
        }).catch((error) => console.error('Failed to register key:', error));
      } catch (error) {
        console.error('Failed to generate key pair:', error);
        toast.error('Encryption setup failed');
      }
    };

    generateKeyPair();
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      toast.success('🔒 Secured Connection', { icon: '🔐' });
    });

    // Receive partner's public key
    newSocket.on('partner_key', (data: { publicKey: string }) => {
      setPartnerPublicKey(data.publicKey);
      console.log('Received partner public key');
    });

    // Receive encrypted message
    newSocket.on('receive_message', (encryptedMessage: any) => {
      try {
        if (!myKeyPair?.privateKey) {
          toast.error('Decryption key not ready');
          return;
        }

        // Decrypt using recipient's private key
        const decrypted = decryptMessage(
          encryptedMessage.encryptedContent,
          myKeyPair.privateKey
        );

        const newMsg: Message = {
          ...encryptedMessage,
          content: decrypted,
          status: 'delivered',
        };

        setMessages((prev) => [...prev, newMsg]);

        // Send read receipt
        newSocket.emit('message_read', { messageId: encryptedMessage.id });
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        toast.error('Failed to decrypt message');
      }
    });

    // Typing indicator from partner
    newSocket.on('partner_typing', () => {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    });

    newSocket.on('partner_stop_typing', () => {
      setIsTyping(false);
    });

    // Message delivery confirmations
    newSocket.on('message_delivered', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
        )
      );
    });

    newSocket.on('message_read', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, status: 'read' } : msg
        )
      );
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      toast.error('Connection lost', { icon: '❌' });
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Chat connection error');
    });

    setSocket(newSocket);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      newSocket.close();
    };
  }, [myKeyPair]);

  // Load chat history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/messages`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();

          // Decrypt all messages
          if (myKeyPair?.privateKey) {
            const decryptedMessages = data.map((msg: any) => {
              try {
                const decrypted = decryptMessage(
                  msg.encryptedContent,
                  myKeyPair.privateKey
                );
                return {
                  ...msg,
                  content: decrypted,
                };
              } catch (error) {
                console.error('Failed to decrypt:', error);
                return msg;
              }
            });
            setMessages(decryptedMessages);
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load chat history');
      }
    };

    if (myKeyPair) {
      fetchMessages();
    }
  }, [myKeyPair]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Encryption function (like WhatsApp Signal Protocol)
  const encryptMessage = (message: string, recipientPublicKey: string): string => {
    try {
      if (!myKeyPair?.privateKey) throw new Error('Private key not available');

      const publicKeyBuffer = Buffer.from(recipientPublicKey, 'base64');
      const secretKeyBuffer = Buffer.from(myKeyPair.privateKey, 'base64');
      const messageBuffer = Buffer.from(message, 'utf-8');

      // Generate nonce
      const nonce = TweetNaCl.randomBytes(TweetNaCl.box.nonceLength);

      // Encrypt
      const encryptedBuffer = TweetNaCl.box(
        messageBuffer,
        nonce,
        publicKeyBuffer,
        secretKeyBuffer
      );

      // Combine nonce + encrypted message
      const combined = Buffer.concat([nonce, encryptedBuffer]);
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  };

  // Decryption function
  const decryptMessage = (encryptedStr: string, myPrivateKey: string): string => {
    try {
      const combined = Buffer.from(encryptedStr, 'base64');
      const nonce = combined.slice(0, TweetNaCl.box.nonceLength);
      const encrypted = combined.slice(TweetNaCl.box.nonceLength);
      const secretKeyBuffer = Buffer.from(myPrivateKey, 'base64');

      const decrypted = TweetNaCl.box.open(
        encrypted,
        nonce,
        Buffer.from(partnerPublicKey || '', 'base64'),
        secretKeyBuffer
      );

      if (!decrypted) throw new Error('Decryption failed');
      return Buffer.from(decrypted).toString('utf-8');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (!socket) {
      toast.error('Not connected to chat');
      return;
    }

    if (!partnerPublicKey) {
      toast.error('Waiting for partner key...');
      return;
    }

    if (!myKeyPair) {
      toast.error('Encryption not ready');
      return;
    }

    setIsLoading(true);
    socket.emit('partner_stop_typing');

    try {
      // Encrypt message
      const encryptedContent = encryptMessage(inputValue, partnerPublicKey);
      const messageId = uuidv4();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            id: messageId,
            content: inputValue,
            encryptedContent,
          }),
        }
      );

      if (response.ok) {
        const newMessage = await response.json();

        // Add to local state with sending status
        const localMessage: Message = {
          ...newMessage,
          status: 'sending',
        };
        setMessages((prev) => [...prev, localMessage]);

        // Emit to partner
        socket.emit('send_message', {
          ...newMessage,
          status: 'sent',
        });

        setInputValue('');
        toast.success('Message sent ✓');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Error sending message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = () => {
    socket?.emit('user_typing');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('user_stop_typing');
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'sent':
        return <Check className="w-3 h-3" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <Card className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {partnerName}
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                End-to-End Encrypted
              </p>
              {!partnerPublicKey && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Waiting for encryption keys...
                </p>
              )}
            </div>
          </Card>

          {/* Messages Container */}
          <Card className="h-[500px] sm:h-[600px] flex flex-col bg-background border">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <AnimatePresence>
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-12 h-12 mx-auto mb-2 text-green-600 dark:text-green-400 opacity-50" />
                      <p className="text-muted-foreground mb-2">
                        No messages yet. Start your conversation! 💕
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All messages are end-to-end encrypted
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.senderId === user?.id;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${
                          isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                              : 'bg-muted text-foreground rounded-bl-none'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {message.senderName}
                          </p>
                          <p className="text-sm sm:text-base break-words">
                            {message.content}
                          </p>
                          <div
                            className={`text-xs mt-1 flex items-center justify-between gap-2 ${
                              isCurrentUser
                                ? 'text-blue-100'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
                            {isCurrentUser && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-muted-foreground text-sm"
                  >
                    <span>{partnerName} is typing</span>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      ●●●
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 sm:p-6 bg-background">
              <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                <Input
                  type="text"
                  placeholder={
                    partnerPublicKey
                      ? 'Type a message...'
                      : 'Waiting for encryption setup...'
                  }
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    handleTyping();
                  }}
                  disabled={isLoading || !socket || !partnerPublicKey}
                  className="flex-1 rounded-full"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !socket || !inputValue.trim() || !partnerPublicKey}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-4 sm:px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;
