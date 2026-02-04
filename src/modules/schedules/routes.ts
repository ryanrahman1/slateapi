import type { FastifyPluginAsync } from "fastify"
import { supabase } from "../../config/supabase"
import { optionalAuth, requireAuth } from '../../plugins/auth'

function formatDateLocal(date: any) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
}


const routes: FastifyPluginAsync = async (fastify) => {

    // public route for schedule; no auth for this one
    fastify.get("/:schoolInitials/today", async (request, reply) => {
        const { schoolInitials } = request.params as { schoolInitials: string }

        const todayLocal = new Date()
        const formatted = formatDateLocal(todayLocal)

        // date is the current date in the format YYYY-MM-DD

        const { data, error } = await supabase.schema("core").from("bell_schedule_days").select("*").eq("school_initials", schoolInitials).eq("day", formatted).single() // ensure its the date for eastern time
        const { data: schedule, error: sError } = await supabase.schema("core").from("bell_schedules").select("schedule_data, name").eq("id", data.bell_schedule_id).single()

        if (error || sError) { return reply.status(500).send({ message: "Error fetching schedule" + error?.message + sError?.message }) }

        return reply.status(200).send({ name: schedule.name, schedule: schedule.schedule_data })
    })

    // public route for schedule id; no auth for this one
    fastify.get("/id/:schoolId/today", async (request, reply) => {
        const { schoolId } = request.params as { schoolId: string }

        const todayLocal = new Date()
        const formatted = formatDateLocal(todayLocal)

        // date is the current date in the format YYYY-MM-DD

        const { data, error } = await supabase.schema("core").from("bell_schedule_days").select("*").eq("school_id", schoolId).eq("day", formatted).single() // ensure its the date for eastern time
        const { data: schedule, error: sError } = await supabase.schema("core").from("bell_schedules").select("schedule_data, name").eq("id", data.bell_schedule_id).single()

        if (error || sError) { return reply.status(500).send({ message: "Error fetching schedule" + error?.message + sError?.message }) }

        return reply.status(200).send({ name: schedule.name, schedule: schedule.schedule_data })
    })

    // route for personal schedule
    fastify.get("/personal/:userId", { preHandler: [requireAuth] }, async (request, reply) => {
        const { userId } = request.params as { userId: string }

        const { data, error } = await supabase
            .schema("core")
            .from("personal_schedules")
            .select("schedule_data")
            .eq("user_id", userId)
            .single()

        if (error) {
            // If no personal schedule exists, return an empty array
            if (error.code === 'PGRST116') { // Supabase 'no rows' code
                return reply.status(200).send({ schedule: [] })
            }
            return reply.status(500).send({ message: "Error fetching personal schedule: " + error.message })
        }

        // Normalize: ensure schedule is always an array (JSONB may be object or nested)
        const raw = data.schedule_data
        const schedule = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.schedule)
                ? raw.schedule
                : Array.isArray(raw?.classes)
                    ? raw.classes
                    : []
        return reply.status(200).send({ schedule })
    })



}

export default routes