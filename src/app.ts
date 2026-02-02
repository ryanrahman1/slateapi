// fastify application for slate api

import Fastify from "fastify"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import env from "./config/env"
import authRoutes from "./modules/auth/routes"
import academicsRoutes from "./modules/academics/routes"
import essaysRoutes from "./modules/essays/routes"
import tasksRoutes from "./modules/tasks/routes"


const app = Fastify({
    logger: true,
    trustProxy: true // Trust proxy headers for correct IP extraction
})

// CORS so browser allows requests from the React app (different origin) and sends OPTIONS preflight
app.register(cors, {
    origin: true, // reflect request origin (e.g. http://localhost:5173)
    credentials: true, // allow cookies (credentials: 'include' on frontend)
})

// Register cookie plugin
app.register(cookie)

// Register auth routes
app.register(authRoutes, { prefix: '/api/auth' })

// Register academics routes
app.register(academicsRoutes, { prefix: '/api/academics' })

// Register essays routes
app.register(essaysRoutes, { prefix: '/api/essays' })

// Register tasks routes (tasks + goals under /api)
app.register(tasksRoutes, { prefix: '/api' })

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
