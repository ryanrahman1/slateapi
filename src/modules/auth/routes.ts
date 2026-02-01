import type { FastifyPluginAsync, FastifyRequest } from "fastify"
import { AuthService } from "./service"
import env from "../../config/env"
import fastifyCookie from '@fastify/cookie'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Extract device information from the request
 */
function getDeviceInfo(request: FastifyRequest): {
    deviceName?: string | null
    userAgent?: string | null
    ipAddress?: string | null
} {
    const userAgent = request.headers['user-agent'] || null
    const ipAddress = request.ip || request.socket.remoteAddress || null
    
    // Try to extract device name from user agent or use a default
    let deviceName: string | null = null
    if (userAgent) {
        // Simple device detection - can be enhanced later
        if (userAgent.includes('Mobile')) {
            deviceName = 'Mobile Device'
        } else if (userAgent.includes('Tablet')) {
            deviceName = 'Tablet'
        } else {
            deviceName = 'Desktop'
        }
    }

    return {
        deviceName,
        userAgent,
        ipAddress
    }
}

const routes: FastifyPluginAsync = async (app) => {
    await app.register(fastifyCookie)

    // Signup route
    app.post('/signup', async (request, reply) => {
        try {
            const { email, name, password, school_id } = request.body as { 
                email: string
                name: string
                password: string
                school_id?: string
            }

            if (!email || !name || !password) {
                return reply.status(400).send({ 
                    error: 'Email, name and password are required' 
                })
            }

            if (!emailRegex.test(email)) {
                return reply.status(400).send({ 
                    error: 'Invalid email format' 
                })
            }

            if (password.length < 8) {
                return reply.status(400).send({ 
                    error: 'Password must be at least 8 characters' 
                })
            }

            const deviceInfo = getDeviceInfo(request)
            const result = await AuthService.signup(email, name, password, school_id, deviceInfo)

            // Set session cookie
            const cookieOptions: any = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            }

            if (env.COOKIE_DOMAIN) {
                cookieOptions.domain = env.COOKIE_DOMAIN
            }

            reply.setCookie('session_token', result.token, cookieOptions)

            return reply.status(201).send({
                user: result.user
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            return reply.status(400).send({ error: message })
        }
    })

    // Sign in route
    app.post('/signin', async (request, reply) => {
        try {
            const { email, password } = request.body as { 
                email: string
                password: string
            }

            if (!email || !password) {
                return reply.status(400).send({ 
                    error: 'Email and password are required' 
                })
            }

            if (!emailRegex.test(email)) {
                return reply.status(400).send({ 
                    error: 'Invalid email format' 
                })
            }

            const deviceInfo = getDeviceInfo(request)
            const result = await AuthService.signin(email, password, deviceInfo)

            // Set session cookie
            const cookieOptions: any = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            }

            if (env.COOKIE_DOMAIN) {
                cookieOptions.domain = env.COOKIE_DOMAIN
            }

            reply.setCookie('session_token', result.token, cookieOptions)

            return reply.status(200).send({
                user: result.user
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            return reply.status(401).send({ error: message })
        }
    })

    // Sign out route
    app.post('/signout', async (request, reply) => {
        try {
            const token = request.cookies.session_token

            if (token) {
                await AuthService.signout(token)
            }

            // Clear session cookie
            const cookieOptions: any = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                path: '/'
            }

            if (env.COOKIE_DOMAIN) {
                cookieOptions.domain = env.COOKIE_DOMAIN
            }

            reply.clearCookie('session_token', cookieOptions)

            return reply.status(200).send({ 
                message: 'Signed out successfully' 
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            return reply.status(400).send({ error: message })
        }
    })

    // Get current user route
    app.get('/me', async (request, reply) => {
        const token = request.cookies.session_token

        if (!token) {
            return reply.status(401).send({ error: 'Not authenticated' })
        }

        const user = await AuthService.verifySession(token)
        if (!user) {
            return reply.status(401).send({ error: 'Invalid or expired session' })
        }

        return reply.status(200).send({ user })
    })
}

export default routes
