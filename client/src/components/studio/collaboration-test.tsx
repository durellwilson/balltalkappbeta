import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStudioCollaboration } from "@/hooks/use-studio-collaboration";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, Share2, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CollaborationTestProps {
  sessionId: number;
  sessionCode: string;
}

export function CollaborationTest({ sessionId, sessionCode }: CollaborationTestProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    userId: number;
    username: string;
    message: string;
    timestamp: string;
    system?: boolean;
  }>>([]);

  // Use the collaboration hook
  const { isConnected, collaborators, sendChatMessage } = useStudioCollaboration({
    sessionId,
    sessionCode,
    onUserJoined: (userId, username) => {
      setMessages(prev => [...prev, {
        userId,
        username: 'System',
        message: `${username} joined the session`,
        timestamp: new Date().toISOString(),
        system: true
      }]);
      
      toast({
        title: 'User Joined',
        description: `${username} joined the session`,
      });
    },
    onUserLeft: (userId, username) => {
      setMessages(prev => [...prev, {
        userId,
        username: 'System',
        message: `${username} left the session`,
        timestamp: new Date().toISOString(),
        system: true
      }]);
    },
    onChatMessage: (userId, username, message, timestamp) => {
      setMessages(prev => [...prev, { userId, username, message, timestamp }]);
    }
  });

  // Fetch session details
  const { data: session } = useQuery({
    queryKey: [`/api/studio/sessions/${sessionId}`],
    queryFn: async () => {
      const response = await fetch(`/api/studio/sessions/${sessionId}`);
      return response.json();
    }
  });

  // Handle send message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendChatMessage(message);
    setMessage('');
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-zinc-100 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {session?.title || 'Live Session'} 
            <Badge variant="outline" className="ml-2 text-xs font-normal">
              {isConnected ? 'Connected' : 'Connecting...'}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {collaborators.length + 1} users
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col h-[300px]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.userId === user?.id && !msg.system ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${msg.userId === user?.id && !msg.system ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                    {!msg.system && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{msg.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div>
                      {!msg.system && (
                        <div className={`text-xs ${msg.userId === user?.id ? 'text-right' : ''} text-muted-foreground mb-1`}>
                          {msg.username}
                        </div>
                      )}
                      
                      <div 
                        className={`rounded-lg px-3 py-2 text-sm ${
                          msg.system 
                            ? 'bg-muted text-muted-foreground text-center italic text-xs' 
                            : msg.userId === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}