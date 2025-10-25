// Environment configuration utility
// This file handles environment variables for both development and production

interface EnvironmentConfig {
  apiBaseUrl: string;
  debug: boolean;
  logLevel: string;
  isProduction: boolean;
  nodeEnv: string;
}

class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = {
      apiBaseUrl: this.getEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8000'),
      debug: this.getEnvVar('NEXT_PUBLIC_DEBUG', 'false') === 'true',
      logLevel: this.getEnvVar('NEXT_PUBLIC_LOG_LEVEL', 'info'),
      isProduction: this.getEnvVar('NODE_ENV', 'development') === 'production',
      nodeEnv: this.getEnvVar('NODE_ENV', 'development'),
    };
  }

  private getEnvVar(key: string, defaultValue: string): string {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      // In browser, use public runtime config or fallback to default
      return (window as any).__NEXT_DATA__?.props?.pageProps?.config?.[key] || defaultValue;
    }
    
    // In server environment, use process.env
    return process.env[key] || defaultValue;
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public getApiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  public isDebug(): boolean {
    return this.config.debug;
  }

  public isProduction(): boolean {
    return this.config.isProduction;
  }

  public getLogLevel(): string {
    return this.config.logLevel;
  }

  public log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.debug && level === 'info') return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}

// Create singleton instance
const envManager = new EnvironmentManager();

export default envManager;
export type { EnvironmentConfig };
