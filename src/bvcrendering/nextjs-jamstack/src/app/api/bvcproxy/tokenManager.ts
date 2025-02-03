interface TokenData {
    accessToken: string;
    expiresAt: number;
  }
  
  class TokenManager {
    private static currentToken: TokenData | null = null;
    private static readonly BUFFER_TIME = 5 * 60 * 1000; // 5 minutes buffer before expiration
  
    static getStoredToken(): TokenData | null {
      try {
        if (!this.currentToken) return null;
        
        const now = Date.now();
        
        // Check if token is expired (including buffer time)
        if (now >= this.currentToken.expiresAt - this.BUFFER_TIME) {
          this.clearToken();
          return null;
        }
        
        return this.currentToken;
      } catch (error) {
        console.error('Error retrieving token:', error);
        return null;
      }
    }
  
    static storeToken(accessToken: string, expiresIn: number): void {
      try {
        const expiresAt = Date.now() + (expiresIn * 1000);
        this.currentToken = {
          accessToken,
          expiresAt
        };
      } catch (error) {
        console.error('Error storing token:', error);
      }
    }
  
    static clearToken(): void {
      this.currentToken = null;
    }
  }
  
  export default TokenManager;