import { changePasswordAndSignOut } from '../userProfile';

describe('changePasswordAndSignOut', () => {
  it('updates the password then signs the user out', async () => {
    const updateUserProfile = jest.fn().mockResolvedValue({ message: 'ok' });
    const logout = jest.fn().mockResolvedValue(undefined);

    await changePasswordAndSignOut({
      token: 'auth-token',
      password: 'newSecurePass99',
      updateUserProfile,
      logout,
    });

    expect(updateUserProfile).toHaveBeenCalledTimes(1);
    expect(updateUserProfile).toHaveBeenCalledWith('auth-token', {
      password: 'newSecurePass99',
      password_confirmation: 'newSecurePass99',
    });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(updateUserProfile.mock.invocationCallOrder[0]).toBeLessThan(
      logout.mock.invocationCallOrder[0]
    );
  });

  it('does not sign out when the password update fails', async () => {
    const updateError = new Error('update failed');
    const updateUserProfile = jest.fn().mockRejectedValue(updateError);
    const logout = jest.fn().mockResolvedValue(undefined);

    await expect(
      changePasswordAndSignOut({
        token: 'auth-token',
        password: 'newSecurePass99',
        updateUserProfile,
        logout,
      })
    ).rejects.toThrow('update failed');

    expect(updateUserProfile).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });
});
