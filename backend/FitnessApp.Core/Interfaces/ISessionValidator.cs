using FitnessApp.Core.Models;

namespace FitnessApp.Core.Interfaces;

public interface ISessionValidator
{
    Task<bool> ValidateSessionAsync(SessionId sessionId, CancellationToken cancellationToken = default);
}