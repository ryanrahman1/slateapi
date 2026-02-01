import 'dotenv/config'

const env = {
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || "0.0.0.0",
    SUPABASE_URL: process.env.SUPABASE_URL as string,
    SUPABASE_KEY: process.env.SUPABASE_KEY as string,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN as string | undefined,
}

export default env