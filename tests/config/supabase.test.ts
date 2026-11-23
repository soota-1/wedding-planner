import { supabase } from '../../src/config/supabase';

describe('Supabase Client Configuration', () => {
  it('should initialize supabase client with valid url and anon key', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
