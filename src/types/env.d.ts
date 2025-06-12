declare namespace NodeJS {
    interface ProcessEnv {
        YOUTUBE_API_KEY: string;
        MAPBOX_ACCESS_TOKEN: string;
        DATABASE_URL: string;
        FIREBASE_CONFIG: string;
        NODE_ENV: 'development' | 'production' | 'test';
    }
} 