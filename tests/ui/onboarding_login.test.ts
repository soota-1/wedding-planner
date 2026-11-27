import OnboardingScreen from '../../app/onboarding';
import LoginScreen from '../../app/login';

describe('Onboarding & Login Screens', () => {
  it('renders OnboardingScreen without throwing', () => {
    expect(OnboardingScreen).toBeDefined();
    expect(typeof OnboardingScreen).toBe('function');
    expect(() => OnboardingScreen()).not.toThrow();
  });

  it('renders LoginScreen without throwing', () => {
    expect(LoginScreen).toBeDefined();
    expect(typeof LoginScreen).toBe('function');
    expect(() => LoginScreen()).not.toThrow();
  });
});
