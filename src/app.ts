// fastify application for slate api

import Fastify from "fastify"
import cookie from "@fastify/cookie"
import authRoutes from "./modules/auth/routes"
import env from "./config/env"

const app = Fastify({
    logger: true,
    trustProxy: true // Trust proxy headers for correct IP extraction
})

// Register cookie plugin
app.register(cookie)

// Register auth routes
app.register(authRoutes, { prefix: '/api/auth' })

// Start server
const start = async () => {
    try {
        await app.listen({ 
            port: Number(env.PORT), 
            host: env.HOST 
        })
        console.log(`Server listening on ${env.HOST}:${env.PORT}`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()

export default app
