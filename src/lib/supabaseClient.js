import { createClient } from '@supabase/supabase-js'

// Estas variáveis têm de começar por VITE_ para o Vite as detetar
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: Variáveis de ambiente do Supabase não encontradas!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)