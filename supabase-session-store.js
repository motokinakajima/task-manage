const { Store } = require('express-session');
const { createClient } = require('@supabase/supabase-js');

class SupabaseStore extends Store {
    constructor(options) {
        super();
        this.supabase = createClient(options.supabaseUrl, options.supabaseKey);
        this.table = options.table || 'sessions';
    }

    async get(sid, callback) {
        try {
            const { data, error } = await this.supabase
                .from(this.table)
                .select('data')
                .eq('id', sid)
                .single();

            if (error) {
                return callback(error);
            }

            if (!data) {
                return callback(null, null);
            }

            return callback(null, data.data);
        } catch (err) {
            return callback(err);
        }
    }

    async set(sid, session, callback) {
        try {
            const expires = session.cookie.expires ? new Date(session.cookie.expires) : null;
            const { error } = await this.supabase
                .from(this.table)
                .upsert({ id: sid, data: session, expires: expires });

            if (error) {
                return callback(error);
            }

            return callback(null);
        } catch (err) {
            return callback(err);
        }
    }

    async destroy(sid, callback) {
        try {
            const { error } = await this.supabase
                .from(this.table)
                .delete()
                .eq('id', sid);

            if (error) {
                return callback(error);
            }

            return callback(null);
        } catch (err) {
            return callback(err);
        }
    }
}

module.exports = SupabaseStore;
