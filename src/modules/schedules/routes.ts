import type { FastifyPluginAsync } from "fastify"
import { supabase } from "../../config/supabase"
import { optionalAuth, requireAuth } from '../../plugins/auth'

function formatDateLocal(date) {
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
        const { data: schedule, error: sError } = await supabase.schema("core").from("bell_schedules").select("schedule_data, name").eq("id",data.bell_schedule_id).single()

        if (error || sError) { return reply.status(500).send({ message: "Error fetching schedule" + error?.message + sError?.message }) }

        return reply.status(200).send({ name: schedule.name, schedule: schedule.schedule_data })
    })


}

export default routes