const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

export const finishGoogleAuthentication = (data, login) => {
  if (data?.requiresProfile || data?.needsProfile) {
    const onboardingToken = data.registrationToken || data.onboardingToken || data.setupToken;
    if (!onboardingToken) {
      throw new Error('Google sign-in needs profile completion, but the server did not provide a secure setup token.');
    }
    sessionStorage.setItem('googleOnboarding', JSON.stringify({
      token: onboardingToken,
      name: data.profile?.name || data.user?.name || '',
      email: data.profile?.email || data.user?.email || ''
    }));
    return '/complete-profile';
  }

  if (!data?.token || !data?.user) {
    throw new Error('The server did not return a valid Google sign-in session.');
  }
  sessionStorage.removeItem('googleOnboarding');
  login(data.token, data.user);
  return roleHome[data.user.role] || '/dashboard';
};
