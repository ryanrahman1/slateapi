// routes for canvas

import type { FastifyPluginAsync } from "fastify"
import { supabase } from "../../config/supabase"
import { requireAuth } from "../../plugins/auth"
import { getUser } from "../../lib/helpers"

const routes: FastifyPluginAsync = async (app) => {

    // authentication and checks

    app.post('/connect', {
        preHandler: requireAuth
    }, async (request, reply) => {
        const userId = request.userId

        const { canvas_api_key, canvas_api_expiration } = request.body as {
            canvas_api_key: string
            canvas_api_expiration: string
        }

        if (!canvas_api_key || !canvas_api_expiration) {
            return reply.status(400).send({ error: 'canvas_api_key and canvas_api_expiration are required' })
        }

        // check if canvas token is valid
        const canvasResponse = await fetch("https://canvas.instructure.com/api/v1/users/self", {
            headers: {
                'Authorization': `Bearer ${canvas_api_key}`
            }
        })

        if (!canvasResponse.ok) {
            return reply.status(400).send({ error: 'Invalid canvas token' })
        }

        const expiresAt = new Date(canvas_api_expiration)

        const { error } = await supabase
            .schema('core')
            .from('users')
            .update({
                canvas_access_token: canvas_api_key,
                canvas_token_expires_at: expiresAt.toISOString(),
            })
            .eq('id', userId)

        if (error) {
            console.error('Database update error:', error)
            return reply.status(500).send({ error: 'Failed to update canvas token', details: error.message })
        }

        return reply.status(200).send({ message: 'Canvas connected successfully' })
    })

    app.get('/status', {
        preHandler: requireAuth
    }, async (request, reply) => {
        const userId = request.userId

        const { data: user } = await supabase
            .schema('core')
            .from('users')
            .select('canvas_access_token, canvas_token_expires_at')
            .eq('id', userId)
            .single()

        if (!user?.canvas_access_token) {
            return reply.send({ connected: false })
        }


        const expiresAt = new Date(user.canvas_token_expires_at)
        const daysUntilExpiry = Math.floor((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

        return reply.status(200).send({
            connected: true,
            expires_in_days: daysUntilExpiry,
            expires_at: expiresAt,
            needs_renewal: daysUntilExpiry <= 7
        })
    })


    // fetch


    // get active courses
    app.get('/courses/active', { preHandler: requireAuth }, async (request, reply) => {
        const userId = request.userId
        const user = await getUser(userId as string)

        const params = new URLSearchParams()
        params.append('enrollment_state', 'active')
        params.append('include[]', 'teachers')
        params.append('include[]', 'total_students')
        params.append('include[]', 'banner_image')

        const res = await fetch(
            'https://canvas.instructure.com/api/v1/courses?' + params.toString(),
            {
                headers: { 'Authorization': `Bearer ${user.canvas_access_token}` }
            }
        )

        if (!res.ok) {
            return reply.status(500).send({ error: `Failed to fetch courses: ${res.statusText}` })
        }

        const data = await res.json()
        return reply.status(200).send(data)
    })



}

export default routes