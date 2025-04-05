import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Mail, 
  Search, 
  CheckCheck,
  Archive, 
  Loader2, 
  AlertCircle, 
  XCircle
} from 'lucide-react';
import { adminApiClient } from '@/lib/adminApiClient';
import { adminEndpoints } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SupportMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
};

const ITEMS_PER_PAGE = 10;

export function SupportMessages() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'unread' | 'read' | 'archived' | 'all'>('unread');
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  
  // Define the status based on the active tab
  const status = activeTab !== 'all' ? activeTab : undefined;
  
  // Fetch support messages with pagination, search, and filtering
  const { data, isLoading, isError } = useQuery({
    queryKey: [adminEndpoints.supportMessages, page, searchTerm, status],
    queryFn: () => adminApiClient.getSupportMessages(
      page, 
      ITEMS_PER_PAGE, 
      status as any
    ),
  });
  
  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: number) => adminApiClient.markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [adminEndpoints.supportMessages] });
      toast({
        title: 'Message marked as read',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to mark message as read',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Mark message as archived mutation
  const markAsArchivedMutation = useMutation({
    mutationFn: (messageId: number) => adminApiClient.markMessageAsArchived(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [adminEndpoints.supportMessages] });
      toast({
        title: 'Message archived',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to archive message',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'unread' | 'read' | 'archived' | 'all');
    setPage(1); // Reset to first page when changing tabs
  };
  
  // Handle pagination
  const handleNextPage = () => {
    if (data && data.page < Math.ceil(data.total / data.limit)) {
      setPage(page + 1);
    }
  };
  
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  // Open message dialog and mark as read if unread
  const handleOpenMessage = (message: SupportMessage) => {
    setSelectedMessage(message);
    setMessageDialogOpen(true);
    
    // If the message is unread, mark it as read
    if (message.status === 'unread') {
      markAsReadMutation.mutate(message.id);
    }
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get message status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Unread
          </Badge>
        );
      case 'read':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Read
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="default" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium">Failed to load support messages</h3>
        <p className="text-muted-foreground">
          There was an error loading the support messages. Please try again.
        </p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: [adminEndpoints.supportMessages] })}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <Tabs defaultValue="unread" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data?.messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No messages found</h3>
              <p className="text-muted-foreground">
                There are no {activeTab !== 'all' ? activeTab : ''} messages at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.messages.map((message: SupportMessage) => (
                <Card 
                  key={message.id} 
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                    message.status === 'unread' ? 'border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => handleOpenMessage(message)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{message.subject}</CardTitle>
                        <CardDescription>
                          From: {message.name} ({message.email})
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(message.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {data?.messages.length} of {data?.total} messages
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= Math.ceil(data?.total / data?.limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>{selectedMessage.subject}</DialogTitle>
                  {getStatusBadge(selectedMessage.status)}
                </div>
                <DialogDescription>
                  From: {selectedMessage.name} ({selectedMessage.email})
                  <br />
                  Date: {formatDate(selectedMessage.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-accent/30 p-4 rounded-md max-h-[400px] overflow-y-auto">
                <p className="whitespace-pre-line">{selectedMessage.message}</p>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                {selectedMessage.status !== 'archived' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      markAsArchivedMutation.mutate(selectedMessage.id);
                      setMessageDialogOpen(false);
                    }}
                    disabled={markAsArchivedMutation.isPending}
                  >
                    {markAsArchivedMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                )}
                
                {selectedMessage.status === 'unread' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      markAsReadMutation.mutate(selectedMessage.id);
                    }}
                    disabled={markAsReadMutation.isPending}
                  >
                    {markAsReadMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    // TODO: Implement email reply functionality
                    window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`);
                  }}
                >
                  Reply via Email
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}