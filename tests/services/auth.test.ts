import { AuthService } from '../../src/services/auth';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      updateUser: jest.fn(),
      signInWithOAuth: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

describe('AuthService & useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().reset();
  });

  it('validates default credentials format', () => {
    expect(AuthService.isValidEmail('octaadsp@gmail.com')).toBe(true);
    expect(AuthService.isValidEmail('jenesia23@gmail.com')).toBe(true);
    expect(AuthService.isValidEmail('invalid-email')).toBe(false);
  });

  it('logs in successfully and updates auth store', async () => {
    const mockUser = { id: 'u1', email: 'octaadsp@gmail.com' };
    const mockSession = { access_token: 'token123', user: mockUser };

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const result = await AuthService.loginWithEmail('octaadsp@gmail.com', 'Admin123@');

    expect(result.user).toEqual(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('changes password successfully', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });

    const result = await AuthService.changePassword('NewSecurePassword123!');
    expect(result.success).toBe(true);
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'NewSecurePassword123!' });
  });

  it('allows setting active workspace in useAuthStore', () => {
    const workspace = { id: 'w1', name: 'Pernikahan Octa & Jenesia', wedding_date: '2027-10-10' };
    useAuthStore.getState().setActiveWorkspace(workspace);
    expect(useAuthStore.getState().activeWorkspace).toEqual(workspace);
  });
});
