'use client';

import { useState } from 'react';
import { Box, Stack, TextField, Button, CircularProgress, Typography, Paper } from '@mui/material';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi I'm the Headstarter Support Agent, how can I assist you today?",
    },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setMessage('');
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: message },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages.concat({ role: 'user', content: message })),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: '' },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ];
        });
      }
    } catch (error) {
      console.error("Error details:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: `Error: ${error.message}. Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#e0f2f1" // Background color for the whole page
      p={2}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 2,
          color: '#00796b', // Title color
        }}
      >
        GPT Discordia
      </Typography>
      <Paper
        elevation={6}
        sx={{
          width: '800px', // Increased width
          height: '600px', // Increased height
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#ffffff', // Background color for the chat box
          border: '1px solid #cfd8dc', // Border color
        }}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          p={2}
          sx={{
            backgroundColor: '#fafafa', // Background color for message area
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
              mb={1}
            >
              <Box
                bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                color="white"
                borderRadius={16}
                p={2}
                maxWidth="75%" // Adjusted width
                display="flex"
                alignItems="center"
                boxShadow={2}
              >
                <Typography variant="body1" component="span">
                  {message.content}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2} p={2}>
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="outlined"
            placeholder="Type your message..."
            fullWidth
            disabled={isLoading}
            InputProps={{
              sx: {
                borderRadius: '16px',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
            sx={{
              borderRadius: '16px',
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
