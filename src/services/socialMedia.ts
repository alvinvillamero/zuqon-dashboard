import { ENV } from '../config/env';

// Social Media Account Types
export interface SocialMediaAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter';
  name: string;
  username: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  isConnected: boolean;
  lastSync?: string;
  permissions: string[];
}

export interface PostData {
  content: string;
  imageUrl?: string;
  scheduledTime?: string;
  platform: 'facebook' | 'instagram' | 'twitter';
}

export interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
  platform: string;
}

// Facebook Graph API Integration
export class FacebookAPI {
  private static readonly API_BASE = 'https://graph.facebook.com/v19.0';
  private static readonly AUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
  
  static getAuthUrl(): string {
    console.log('Facebook App ID:', ENV.FACEBOOK_APP_ID);
    const redirectUri = `http://localhost:3000/auth/facebook/callback`;
    console.log('Redirect URI:', redirectUri);
    
    if (!ENV.FACEBOOK_APP_ID) {
      throw new Error('Facebook App ID is not configured. Please check your .env file.');
    }
    
    const params = new URLSearchParams({
      client_id: ENV.FACEBOOK_APP_ID,
      redirect_uri: redirectUri,
      scope: 'pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_metadata',
      response_type: 'code',
      state: 'facebook_auth'
    });
    
    const authUrl = `${FacebookAPI.AUTH_URL}?${params.toString()}`;
    console.log('Generated Facebook Auth URL:', authUrl);
    
    return authUrl;
  }
  
  static async exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await fetch(`${FacebookAPI.API_BASE}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: ENV.FACEBOOK_APP_ID || '',
          client_secret: ENV.FACEBOOK_APP_SECRET || '',
          redirect_uri: `${window.location.origin}/auth/facebook/callback`,
          code: code,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('Facebook token exchange error:', error);
      throw error;
    }
  }
  
  static async getUserPages(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch(`${FacebookAPI.API_BASE}/me/accounts?fields=id,name,picture{url},access_token&access_token=${accessToken}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Facebook pages fetch error:', error);
      throw error;
    }
  }
  
  static async postToPage(pageId: string, accessToken: string, postData: PostData): Promise<PostResult> {
    try {
      const formData = new FormData();
      formData.append('message', postData.content);
      formData.append('access_token', accessToken);
      
      if (postData.imageUrl) {
        formData.append('url', postData.imageUrl);
      }
      
      if (postData.scheduledTime) {
        const scheduledTime = Math.floor(new Date(postData.scheduledTime).getTime() / 1000);
        formData.append('scheduled_publish_time', scheduledTime.toString());
        formData.append('published', 'false');
      }
      
      const response = await fetch(`${FacebookAPI.API_BASE}/${pageId}/feed`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return {
        success: true,
        postId: data.id,
        platform: 'facebook'
      };
    } catch (error) {
      console.error('Facebook post error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'facebook'
      };
    }
  }
}

// Instagram Basic Display API Integration
export class InstagramAPI {
  private static readonly API_BASE = 'https://graph.facebook.com/v18.0';
  private static readonly AUTH_URL = 'https://api.instagram.com/oauth/authorize';
  
  static getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: ENV.INSTAGRAM_APP_ID || '',
      redirect_uri: `${window.location.origin}/auth/instagram/callback`,
      scope: 'user_profile,user_media',
      response_type: 'code',
      state: 'instagram_auth'
    });
    
    return `${InstagramAPI.AUTH_URL}?${params.toString()}`;
  }
  
  static async exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await fetch(`${InstagramAPI.API_BASE}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: ENV.INSTAGRAM_APP_ID || '',
          client_secret: ENV.INSTAGRAM_APP_SECRET || '',
          grant_type: 'authorization_code',
          redirect_uri: `${window.location.origin}/auth/instagram/callback`,
          code: code,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('Instagram token exchange error:', error);
      throw error;
    }
  }
  
  static async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await fetch(`${InstagramAPI.API_BASE}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Instagram profile fetch error:', error);
      throw error;
    }
  }
  
  static async postToInstagram(accessToken: string, postData: PostData): Promise<PostResult> {
    try {
      // Instagram requires a two-step process for posting
      // Step 1: Create media container
      const containerResponse = await fetch(`${InstagramAPI.API_BASE}/me/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          image_url: postData.imageUrl || '',
          caption: postData.content,
          access_token: accessToken,
        }),
      });
      
      const containerData = await containerResponse.json();
      
      if (containerData.error) {
        throw new Error(containerData.error.message);
      }
      
      // Step 2: Publish the container
      const publishResponse = await fetch(`${InstagramAPI.API_BASE}/me/media_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      });
      
      const publishData = await publishResponse.json();
      
      if (publishData.error) {
        throw new Error(publishData.error.message);
      }
      
      return {
        success: true,
        postId: publishData.id,
        platform: 'instagram'
      };
    } catch (error) {
      console.error('Instagram post error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'instagram'
      };
    }
  }
}

// Twitter API v2 Integration (Simplified - Skip for now)
export class TwitterAPI {
  private static readonly API_BASE = 'https://api.twitter.com/2';
  
  static async getAuthUrl(): Promise<string> {
    // For now, throw an error to skip Twitter
    throw new Error('Twitter integration is temporarily disabled. Please use Facebook or Instagram.');
  }
  
  static async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    throw new Error('Twitter integration is temporarily disabled');
  }
  
  static async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await fetch(`${TwitterAPI.API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].detail);
      }
      
      return data.data;
    } catch (error) {
      console.error('Twitter profile fetch error:', error);
      throw error;
    }
  }
  
  static async postTweet(accessToken: string, postData: PostData): Promise<PostResult> {
    try {
      const tweetData: any = {
        text: postData.content
      };
      
      if (postData.imageUrl) {
        // First upload media
        const mediaResponse = await fetch(`${TwitterAPI.API_BASE}/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: new FormData().append('media', postData.imageUrl),
        });
        
        const mediaData = await mediaResponse.json();
        
        if (mediaData.errors) {
          throw new Error(mediaData.errors[0].detail);
        }
        
        tweetData.media = {
          media_ids: [mediaData.media_id_string]
        };
      }
      
      const response = await fetch(`${TwitterAPI.API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(tweetData),
      });
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].detail);
      }
      
      return {
        success: true,
        postId: data.data.id,
        platform: 'twitter'
      };
    } catch (error) {
      console.error('Twitter post error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: 'twitter'
      };
    }
  }
}

// Main Social Media Service
export class SocialMediaService {
  static async connectAccount(platform: 'facebook' | 'instagram' | 'twitter'): Promise<string> {
    switch (platform) {
      case 'facebook':
        return FacebookAPI.getAuthUrl();
      case 'instagram':
        return InstagramAPI.getAuthUrl();
      case 'twitter':
        return await TwitterAPI.getAuthUrl();
      default:
        throw new Error('Unsupported platform');
    }
  }
  
  static async connectAccountWithPopup(platform: 'facebook' | 'instagram' | 'twitter'): Promise<SocialMediaAccount> {
    return new Promise(async (resolve, reject) => {
      console.log('Starting popup OAuth for platform:', platform);
      
      try {
        const authUrl = await this.connectAccount(platform);
        console.log('Auth URL generated:', authUrl);
        
        // Open popup window
        const popup = window.open(
          authUrl,
          `${platform}_oauth`,
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        console.log('Popup opened:', popup);
        
        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }
        
        // Listen for popup messages
        const messageListener = (event: MessageEvent) => {
          console.log('Received message from popup:', event.data);
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            popup.close();
            window.removeEventListener('message', messageListener);
            resolve(event.data.account);
          } else if (event.data.type === 'OAUTH_ERROR') {
            popup.close();
            window.removeEventListener('message', messageListener);
            reject(new Error(event.data.error));
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Check if popup is closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);
      } catch (error) {
        console.error('Error in connectAccountWithPopup:', error);
        reject(error);
      }
    });
  }
  
  static async handleAuthCallback(platform: string, code: string): Promise<SocialMediaAccount> {
    console.log('SocialMediaService.handleAuthCallback: Starting for platform:', platform, 'code:', code);
    let tokenData: any;
    let profileData: any;
    
    switch (platform) {
      case 'facebook':
        console.log('SocialMediaService: Handling Facebook callback');
        tokenData = await FacebookAPI.exchangeCodeForToken(code);
        const pages = await FacebookAPI.getUserPages(tokenData.accessToken);
        profileData = pages[0]; // Use first page for now
        
        return {
          id: `fb_${profileData.id}`,
          platform: 'facebook',
          name: profileData.name,
          username: profileData.name,
          accountId: profileData.id,
          accessToken: tokenData.accessToken,
          expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
          isConnected: true,
          lastSync: new Date().toISOString(),
          permissions: ['pages_manage_posts', 'pages_read_engagement']
        };
        
      case 'instagram':
        console.log('SocialMediaService: Handling Instagram callback');
        tokenData = await InstagramAPI.exchangeCodeForToken(code);
        profileData = await InstagramAPI.getUserProfile(tokenData.accessToken);
        
        return {
          id: `ig_${profileData.id}`,
          platform: 'instagram',
          name: profileData.username,
          username: `@${profileData.username}`,
          accountId: profileData.id,
          accessToken: tokenData.accessToken,
          expiresAt: new Date(Date.now() + tokenData.expiresIn * 1000).toISOString(),
          isConnected: true,
          lastSync: new Date().toISOString(),
          permissions: ['user_profile', 'user_media']
        };
        
      case 'twitter':
        console.log('SocialMediaService: Handling Twitter callback');
        console.log('SocialMediaService: About to call TwitterAPI.exchangeCodeForToken');
        tokenData = await TwitterAPI.exchangeCodeForToken(code);
        console.log('SocialMediaService: Token exchange successful, got tokenData:', tokenData);
        console.log('SocialMediaService: About to call TwitterAPI.getUserProfile');
        profileData = await TwitterAPI.getUserProfile(tokenData.accessToken);
        console.log('SocialMediaService: Profile fetch successful, got profileData:', profileData);
        
        return {
          id: `tw_${profileData.id}`,
          platform: 'twitter',
          name: profileData.name,
          username: `@${profileData.username}`,
          accountId: profileData.id,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          isConnected: true,
          lastSync: new Date().toISOString(),
          permissions: ['tweet.read', 'tweet.write', 'users.read']
        };
        
      default:
        throw new Error('Unsupported platform');
    }
  }
  
  static async publishContent(account: SocialMediaAccount, postData: PostData): Promise<PostResult> {
    switch (account.platform) {
      case 'facebook':
        return await FacebookAPI.postToPage(account.accountId, account.accessToken, postData);
      case 'instagram':
        return await InstagramAPI.postToInstagram(account.accessToken, postData);
      case 'twitter':
        return await TwitterAPI.postTweet(account.accessToken, postData);
      default:
        throw new Error('Unsupported platform');
    }
  }
}
