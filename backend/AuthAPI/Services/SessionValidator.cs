using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;
using AuthAPI.DataAccess;

namespace AuthAPI.Services;

public sealed class SessionValidator : ISessionValidator
{
    private readonly UserLogrepository _userRepository;

    public SessionValidator(UserLogrepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<bool> ValidateSessionAsync(SessionId sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _userRepository.GetSessionBySessionIdAsync(sessionId);
        return session != null && session.IsActive;
    }
}