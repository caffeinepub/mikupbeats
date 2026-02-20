import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetSection,
  useGetMessages,
  useAddMessage,
  useDeleteMessage,
  useDeleteSection,
  useSetSectionLinkSharing,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ArrowLeft, Send, Link2Off } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// URL regex pattern for detecting links
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Sanitize URL to prevent XSS
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return '#';
  } catch {
    return '#';
  }
}

// Parse message text and convert URLs to clickable links
function parseMessageWithLinks(text: string, linkSharingEnabled: boolean): React.ReactNode {
  if (!linkSharingEnabled) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(URL_REGEX);
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the URL as a clickable link
    const url = match[0];
    const sanitizedUrl = sanitizeUrl(url);
    parts.push(
      <a
        key={match.index}
        href={sanitizedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-400 hover:text-purple-300 underline font-medium transition-colors"
        onClick={(e) => {
          if (sanitizedUrl === '#') {
            e.preventDefault();
          }
        }}
      >
        {url}
      </a>
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function SectionDetailPage() {
  const { sectionId } = useParams({ from: '/forum/section/$sectionId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [message, setMessage] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [showDeleteSectionDialog, setShowDeleteSectionDialog] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: section, isLoading: sectionLoading } = useGetSection(sectionId);
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useGetMessages(sectionId);
  const addMessageMutation = useAddMessage();
  const deleteMessageMutation = useDeleteMessage();
  const deleteSectionMutation = useDeleteSection();
  const setLinkSharingMutation = useSetSectionLinkSharing();

  const isAuthenticated = !!identity;
  const isAdmin = section?.creator === 'admin';
  const linkSharingEnabled = section?.linkSharingEnabled ?? false;

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [refetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > previousMessageCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setPreviousMessageCount(messages.length);
  }, [messages.length, previousMessageCount]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && previousMessageCount === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length, previousMessageCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await addMessageMutation.mutateAsync({
        sectionId,
        id: messageId,
        message: message.trim(),
      });
      setMessage('');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;

    try {
      await deleteMessageMutation.mutateAsync(deleteMessageId);
      setDeleteMessageId(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleDeleteSection = async () => {
    try {
      await deleteSectionMutation.mutateAsync(sectionId);
      navigate({ to: '/forum' });
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleToggleLinkSharing = async (enabled: boolean) => {
    try {
      await setLinkSharingMutation.mutateAsync({ id: sectionId, enabled });
    } catch (error) {
      console.error('Failed to update link sharing:', error);
    }
  };

  if (sectionLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Section not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/forum' })}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forum
          </Button>

          <Card className="bg-card/50 backdrop-blur-sm border-border/40">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-[#a970ff] mb-2">{section.title}</CardTitle>
                  <p className="text-muted-foreground">{section.description}</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteSectionDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Admin Controls */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2Off className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="link-sharing" className="text-sm font-medium">
                        Enable Link Sharing
                      </Label>
                    </div>
                    <Switch
                      id="link-sharing"
                      checked={linkSharingEnabled}
                      onCheckedChange={handleToggleLinkSharing}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    When enabled, URLs in messages will be converted to clickable links
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-6">
          {messages.length === 0 ? (
            <Card className="bg-card/30 backdrop-blur-sm border-border/40">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No messages yet. Be the first to post!</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg, index) => {
              const isNewMessage = index >= previousMessageCount - 1 && previousMessageCount > 0;
              return (
                <Card
                  key={msg.id}
                  className={`bg-card/50 backdrop-blur-sm border-border/40 transition-all duration-500 ${
                    isNewMessage ? 'animate-in slide-in-from-bottom-2' : ''
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-[#a970ff] truncate">
                            {msg.name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(Number(msg.createdAt) / 1000000).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                          {parseMessageWithLinks(msg.message, linkSharingEnabled)}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteMessageId(msg.id)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {isAuthenticated ? (
          <Card className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/40 rounded-none">
            <CardContent className="py-4">
              <form onSubmit={handleSubmit} className="container mx-auto max-w-4xl">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                    className="min-h-[60px] max-h-[200px] resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || addMessageMutation.isPending}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/40 rounded-none">
            <CardContent className="py-4">
              <div className="container mx-auto max-w-4xl text-center">
                <p className="text-muted-foreground">Please log in to post messages</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Message Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Section Dialog */}
      <AlertDialog open={showDeleteSectionDialog} onOpenChange={setShowDeleteSectionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire section? All messages will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive hover:bg-destructive/90">
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
