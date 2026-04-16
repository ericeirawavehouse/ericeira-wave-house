import { createClient } from '@supabase/supabase-js'

// Estas variáveis são lidas do ficheiro .env.local em desenvolvimento
// e das "Environment Variables" configuradas no painel do Vercel em produção.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificação de segurança para ajudar no diagnóstico de erros em produção
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERRO SUPABASE: As chaves VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não foram encontradas! " +
    "Verifica se as configuraste corretamente no painel do Vercel (Settings > Environment Variables)."
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)