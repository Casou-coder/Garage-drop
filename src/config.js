// Configuration du compte en ligne (Supabase).
// L'adresse et la clé « anon » sont publiques par nature (elles sont livrées dans l'app) :
// la sécurité repose sur les règles RLS de la base, voir supabase/garagedrop.sql.
// La clé peut venir de l'environnement (EXPO_PUBLIC_SUPABASE_ANON_KEY) ou être collée ci-dessous.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mphvgiqaolzbmguxfexs.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const CLOUD_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
