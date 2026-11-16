// Client Supabase minimal, basé sur fetch (auth par e-mail + table gd_saves).
// Pas de dépendance à supabase-js : rien à patcher pour Hermes / Expo Go.
// Fichier pur (sans React) : testé par scripts/verify.mjs contre un serveur factice.

const MESSAGES = [
  [/invalid login credentials|invalid_credentials/i, 'E-mail ou mot de passe incorrect.'],
  [/already registered|user_already_exists|already been registered/i, 'Un compte existe déjà avec cet e-mail. Connecte-toi.'],
  [/email not confirmed|email_not_confirmed/i, "Confirme d'abord ton e-mail avec le lien reçu, puis connecte-toi."],
  [/password should be|weak_password/i, 'Mot de passe trop court (6 caractères minimum).'],
  [/unable to validate email|invalid format|email_address_invalid/i, 'Adresse e-mail invalide.'],
  [/rate limit|too many requests|over_email_send_rate_limit/i, 'Trop de tentatives. Réessaie dans quelques minutes.'],
  [/signups? (not allowed|disabled)/i, 'La création de compte est désactivée pour le moment.'],
];
function friendly(raw) {
  const text = String(raw || '');
  for (const [re, msg] of MESSAGES) if (re.test(text)) return msg;
  return text || 'Une erreur est survenue.';
}

export class CloudError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export function createCloud({ url, key, fetchImpl }) {
  const doFetch = fetchImpl || fetch;
  const base = String(url || '').replace(/\/+$/, '');

  async function call(path, { method = 'GET', body, token, headers } = {}) {
    let res;
    try {
      res = await doFetch(base + path, {
        method,
        headers: { apikey: key, Authorization: `Bearer ${token || key}`, 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      throw new CloudError('Pas de connexion. Vérifie ton réseau et réessaie.', 0);
    }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { /* réponse non JSON */ }
    if (!res.ok) {
      const raw = json && (json.msg || json.message || json.error_description || json.error_code || json.error);
      throw new CloudError(friendly(raw || `Erreur ${res.status}`), res.status);
    }
    return json;
  }

  const toSession = (j) => ({
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
    user: { id: j.user.id, email: j.user.email },
  });

  return {
    // Renvoie { session } si le compte est utilisable tout de suite, ou { needsConfirm: true } si un e-mail de confirmation est envoyé
    async signUp(email, password) {
      const j = await call('/auth/v1/signup', { method: 'POST', body: { email, password } });
      if (j && j.access_token) return { session: toSession(j) };
      return { needsConfirm: true };
    },
    async signIn(email, password) {
      return toSession(await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
    },
    async refresh(session) {
      const j = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
      return { ...toSession(j), lastPushed: session.lastPushed };
    },
    async signOut(session) {
      try { await call('/auth/v1/logout', { method: 'POST', token: session.access_token }); } catch (e) { /* la session locale est effacée de toute façon */ }
    },
    async recover(email) {
      await call('/auth/v1/recover', { method: 'POST', body: { email } });
    },
    // Ligne { data, updated_at } de la partie en ligne, ou null
    async getSave(session) {
      const rows = await call(`/rest/v1/gd_saves?select=data,updated_at&user_id=eq.${session.user.id}`, { token: session.access_token });
      return rows && rows.length ? rows[0] : null;
    },
    // Enregistre la partie ; renvoie l'horodatage serveur (sert à détecter une écriture depuis un autre appareil)
    async putSave(session, data) {
      const rows = await call('/rest/v1/gd_saves?on_conflict=user_id', {
        method: 'POST',
        token: session.access_token,
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: {
          user_id: session.user.id,
          data,
          name: data.name || null,
          cars: Array.isArray(data.discovered) ? data.discovered.length : 0,
          updated_at: new Date().toISOString(),
        },
      });
      return rows && rows[0] ? rows[0].updated_at : null;
    },
    async deleteSave(session) {
      await call(`/rest/v1/gd_saves?user_id=eq.${session.user.id}`, { method: 'DELETE', token: session.access_token });
    },
  };
}

// Le jeton d'accès expire : on le renouvelle un peu avant, ou après un refus 401
export const needsRefresh = (session) => !session.expires_at || session.expires_at - 90 < Date.now() / 1000;
