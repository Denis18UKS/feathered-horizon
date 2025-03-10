
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar: string;
  } | null;
}

const FriendRequests = () => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch received friend requests
      const { data: receivedData, error: receivedError } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          profiles:user_id(username, avatar)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      // Fetch sent friend requests
      const { data: sentData, error: sentError } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // For sent requests, we need to get the friend's profile info
      const sentWithProfiles = await Promise.all(
        (sentData || []).map(async (request) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar')
            .eq('id', request.friend_id)
            .single();

          return {
            ...request,
            profiles: profileData || { username: "Unknown User", avatar: "" }
          };
        })
      );

      const receivedWithDefaultProfiles = (receivedData || []).map(request => ({
        ...request,
        profiles: request.profiles || { username: "Unknown User", avatar: "" }
      }));

      setFriendRequests(receivedWithDefaultProfiles);
      setSentRequests(sentWithProfiles);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      toast({
        title: 'Error',
        description: 'Could not load friend requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      setFriendRequests(friendRequests.filter(req => req.id !== requestId));
      toast({
        title: 'Success',
        description: 'Friend request accepted',
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: 'Could not accept friend request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setFriendRequests(friendRequests.filter(req => req.id !== requestId));
      toast({
        title: 'Success',
        description: 'Friend request rejected',
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: 'Error',
        description: 'Could not reject friend request',
        variant: 'destructive',
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setSentRequests(sentRequests.filter(req => req.id !== requestId));
      toast({
        title: 'Success',
        description: 'Friend request cancelled',
      });
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast({
        title: 'Error',
        description: 'Could not cancel friend request',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Friend Requests</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Received Requests</h2>
          {friendRequests.length > 0 ? (
            <div className="space-y-4">
              {friendRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <CardTitle>From: {request.profiles?.username || 'Unknown User'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleAcceptRequest(request.id)}>Accept</Button>
                      <Button variant="outline" onClick={() => handleRejectRequest(request.id)}>Reject</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No pending friend requests</p>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Sent Requests</h2>
          {sentRequests.length > 0 ? (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <CardTitle>To: {request.profiles?.username || 'Unknown User'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={() => handleCancelRequest(request.id)}>Cancel Request</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No sent friend requests</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;
