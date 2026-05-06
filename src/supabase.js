import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ycrpoekggnfxshfnhvcf.supabase.co'
const supabaseKey = 'sb_publishable_vkJYyoJcfow-8-6u771QMA_AxjRZ-MN'

export const supabase = createClient(supabaseUrl, supabaseKey)