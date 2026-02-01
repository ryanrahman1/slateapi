import { supabase } from '../../config/supabase'
import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

export class AuthService {
    /**
     * Generate a secure random token for sessions
     */
    private static generateToken(): string {
        return randomBytes(32).toString('hex')
    }

    /**
     * Create a session for a user
     */
    private static async createSession(
        userId: string,
        deviceInfo?: {
            deviceName?: string | null
            userAgent?: string | null
            ipAddress?: string | null
        }
    ): Promise<string> {
        const token = AuthService.generateToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        const { error } = await supabase
            .schema('core')
            .from('sessions')
            .insert({
                user_id: userId,
                token: token,
                expires_at: expiresAt.toISOString(),
                device_name: deviceInfo?.deviceName || null,
                user_agent: deviceInfo?.userAgent || null,
                ip_address: deviceInfo?.ipAddress || null
            })

        if (error) {
            throw new Error(`Failed to create session: ${error.message}`)
        }

        return token
    }

    /**
     * Sign up a new user
     */
    static async signup(
        email: string,
        name: string,
        password: string,
        schoolId?: string,
        deviceInfo?: {
            deviceName?: string | null
            userAgent?: string | null
            ipAddress?: string | null
        }
    ) {
        // Check if user already exists
        const { data: existingUser } = await supabase
            .schema('core')
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existingUser) {
            // Don't leak information about existing users
            throw new Error('Invalid email or password')
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Create user
        const { data: user, error: userError } = await supabase
            .schema('core')
            .from('users')
            .insert({
                email: email,
                name: name,
                password_hash: passwordHash,
                school_id: schoolId || null
            })
            .select('id, email, name, school_id, created_at')
            .single()

        if (userError || !user) {
            throw new Error(`Failed to create user: ${userError?.message || 'Unknown error'}`)
        }

        // Create session
        const token = await AuthService.createSession(user.id, deviceInfo)

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                school_id: user.school_id,
                created_at: user.created_at
            },
            token
        }
    }

    /**
     * Sign in an existing user
     */
    static async signin(
        email: string,
        password: string,
        deviceInfo?: {
            deviceName?: string | null
            userAgent?: string | null
            ipAddress?: string | null
        }
    ) {
        // Find user by email
        const { data: user, error: userError } = await supabase
            .schema('core')
            .from('users')
            .select('id, email, name, password_hash, school_id, created_at')
            .eq('email', email)
            .single()

        if (userError || !user) {
            throw new Error('Invalid email or password')
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash)
        if (!isValidPassword) {
            throw new Error('Invalid email or password')
        }

        // Create session
        const token = await AuthService.createSession(user.id, deviceInfo)

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                school_id: user.school_id,
                created_at: user.created_at
            },
            token
        }
    }

    /**
     * Sign out a user by deleting their session
     */
    static async signout(token: string) {
        const { error } = await supabase
            .schema('core')
            .from('sessions')
            .delete()
            .eq('token', token)

        if (error) {
            throw new Error(`Failed to sign out: ${error.message}`)
        }

        return { success: true }
    }

    /**
     * Verify a session token and get user
     */
    static async verifySession(token: string) {
        const { data: session, error: sessionError } = await supabase
            .schema('core')
            .from('sessions')
            .select('user_id, expires_at')
            .eq('token', token)
            .single()

        if (sessionError || !session) {
            return null
        }

        // Check if session is expired
        const expiresAt = new Date(session.expires_at)
        if (expiresAt < new Date()) {
            // Delete expired session
            await supabase
                .schema('core')
                .from('sessions')
                .delete()
                .eq('token', token)
            return null
        }

        // Get user
        const { data: user, error: userError } = await supabase
            .schema('core')
            .from('users')
            .select('id, email, name, school_id, created_at')
            .eq('id', session.user_id)
            .single()

        if (userError || !user) {
            return null
        }

        return user
    }
}
