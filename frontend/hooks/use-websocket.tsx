"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface WebSocketHook {
  isConnected: boolean
  lastMessage: MessageEvent | null
  sendMessage: (message: string | ArrayBuffer) => void
  error: Event | null
  reconnect: () => void
}

/**
 * Custom hook for WebSocket connections
 * @param url The WebSocket URL to connect to
 * @returns WebSocket state and methods
 */
export function useWebSocket(url: string): WebSocketHook {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null)
  const [error, setError] = useState<Event | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketInstanceId = useRef<string>(`socket_${Math.random().toString(36).substring(2, 9)}`);
  const MAX_RECONNECT_ATTEMPTS = 10
  
  // Create a function to connect to WebSocket that we can reuse
  const connectToWebSocket = useCallback(() => {
    // Skip WebSocket connection during SSR
    if (typeof window === 'undefined') {
      console.log('Skipping WebSocket connection during SSR');
      return null;
    }
    
    // Don't attempt to connect if URL is invalid
    if (!url || url === 'undefined') {
      console.log(`[${socketInstanceId.current}] Invalid WebSocket URL: ${url}`);
      return null;
    }
    
    console.log(`[${socketInstanceId.current}] Connecting to WebSocket: ${url}`);
    
    // Close any existing connection before creating a new one
    setSocket(prevSocket => {
      if (prevSocket && prevSocket.readyState === WebSocket.OPEN) {
        console.log(`[${socketInstanceId.current}] Closing existing connection`);
        prevSocket.close();
      }
      return null;
    });

    let ws: WebSocket | null = null;
    
    try {
      // Try a simple connection validation before creating WebSocket
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = url.startsWith('ws') ? url : `${wsProtocol}//${window.location.host}${url}`;
      
      console.log(`[${socketInstanceId.current}] Attempting connection to: ${wsUrl}`);
      
      ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer"; // Support binary data

      ws.onopen = () => {
        console.log(`[${socketInstanceId.current}] WebSocket connected`);
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        
        // Store the connection in sessionStorage to help with tab synchronization
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('websocket_connected', 'true');
          sessionStorage.setItem('websocket_url', url);
          sessionStorage.setItem('websocket_connected_at', new Date().toISOString());
        }
      };

      ws.onmessage = (event) => {
        try {
          setLastMessage(event);
          // Log first 100 characters for debugging
          const previewData = typeof event.data === 'string' 
            ? event.data.substring(0, 100) 
            : 'Binary data received';
          console.log(`[${socketInstanceId.current}] WebSocket message received: ${previewData}${previewData.length > 100 ? '...' : ''}`);
        } catch (err) {
          console.error(`[${socketInstanceId.current}] Error processing WebSocket message:`, err);
        }
      };

      ws.onclose = (event) => {
        console.log(`[${socketInstanceId.current}] WebSocket disconnected with code: ${event.code}, reason: ${event.reason}, clean: ${event.wasClean}`);
        setIsConnected(false);
        
        // Remove from sessionStorage
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('websocket_connected');
        }

        if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          // Try to reconnect after a delay
          const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
          console.log(`[${socketInstanceId.current}] Trying to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);
          
          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connectToWebSocket();
          }, delay);
        }
      };

      ws.onerror = (event) => {
        const errorDetails = {
          timestamp: new Date().toISOString(),
          connectionState: ws ? ws.readyState : 'No WebSocket',
          url: wsUrl
        };
        console.error(`[${socketInstanceId.current}] WebSocket error:`, errorDetails);
        setError(event);
        
        // The WebSocket will attempt to reconnect via the onclose handler
      };

      setSocket(ws);
    } catch (err) {
      console.error(`[${socketInstanceId.current}] WebSocket connection error:`, err);
      setError(err as Event);
    }
    
    return ws;
  }, [url, reconnectAttempts]);

  // Connect to the WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    if (url) {
      ws = connectToWebSocket();
    }

    // Clean up function to close the WebSocket when the component unmounts
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }
  }, [url, connectToWebSocket]);
  
  // Listen for storage events to coordinate between tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'websocket_message' && event.newValue) {
        try {
          // Parse the message from storage
          const storedMessage = JSON.parse(event.newValue);
          
          // Only process if this isn't the original sender
          if (storedMessage.sender !== socketInstanceId.current) {
            console.log(`[${socketInstanceId.current}] Received cross-tab message:`, storedMessage);
            
            // Create a synthetic message event
            const syntheticEvent = new MessageEvent('message', {
              data: storedMessage.data,
            });
            
            // Process as if it came from WebSocket
            setLastMessage(syntheticEvent);
          }
        } catch (err) {
          console.error('Error processing cross-tab message:', err);
        }
      }
    };
    
    // Add the storage event listener
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Manual reconnection function
  const reconnect = useCallback(() => {
    console.log(`[${socketInstanceId.current}] Manual reconnection requested`);
    setSocket(currentSocket => {
      if (currentSocket) {
        currentSocket.close();
      }
      return null;
    });
    setReconnectAttempts(0);
    connectToWebSocket();
  }, [connectToWebSocket]);

  // Send message function
  const sendMessage = useCallback(
    (message: string | ArrayBuffer) => {
      setSocket(currentSocket => {
        if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
          currentSocket.send(message);
          
          // If this is a string message, also store it in localStorage for cross-tab communication
          if (typeof message === 'string') {
            try {
              const parsedMessage = JSON.parse(message);
              
              // Store in localStorage with a timestamp and sender ID
              const crossTabMessage = {
                sender: socketInstanceId.current,
                timestamp: Date.now(),
                data: message
              };
              
              localStorage.setItem('websocket_message', JSON.stringify(crossTabMessage));
              
              // Remove after a short timeout to trigger storage events again in the future
              setTimeout(() => {
                localStorage.removeItem('websocket_message');
              }, 100);
            } catch (err) {
              // Not valid JSON, ignore for cross-tab communication
            }
          }
        } else {
          console.error(`[${socketInstanceId.current}] WebSocket is not connected`);
          
          // Try to reconnect
          reconnect();
        }
        
        return currentSocket;
      });
    },
    [reconnect],
  )

  return { isConnected, lastMessage, sendMessage, error, reconnect }
}
