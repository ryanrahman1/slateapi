import type { FastifyRequest, FastifyReply } from "fastify"
import { supabase } from "../config/supabase"

/**
 * Extend FastifyRequest to include userId
 */
declare module "fastify" {
    interface FastifyRequest {
        userId?: string | null
    }
}

/**
 * Verify session token and get user ID
 */
async function verifySessionToken(token: string): Promise<string | null> {
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

    return session.user_id
}

/**
 * Authentication preHandler
 * Use this as a preHandler on routes that require authentication
 * Parses session token from cookies, validates it, and attaches userId to request
 * Returns 401 if authentication fails
 */
export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    // Initialize userId
    request.userId = null

    // Extract session token from cookie
    const token = request.cookies?.session_token

    if (!token) {
        reply.status(401).send({ error: 'Not authenticated' })
        return
    }

    // Verify token and get user ID
    try {
        const userId = await verifySessionToken(token)
        
        if (!userId) {
            reply.status(401).send({ error: 'Invalid or expired session' })
            return
        }

        request.userId = userId
    } catch (error) {
        reply.status(401).send({ error: 'Authentication failed' })
        return
    }
}

/**
 * Optional authentication preHandler
 * Use this on routes where authentication is optional
 * Sets userId if valid session exists, but doesn't return error if missing
 */
export async function optionalAuth(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    // Initialize userId
    request.userId = null

    // Extract session token from cookie
    const token = request.cookies?.session_token

    if (!token) {
        // No token, but that's okay for optional auth
        return
    }

    // Verify token and get user ID
    try {
        const userId = await verifySessionToken(token)
        request.userId = userId || null
    } catch (error) {
        // If verification fails, just keep userId as null
        request.userId = null
    }
}

