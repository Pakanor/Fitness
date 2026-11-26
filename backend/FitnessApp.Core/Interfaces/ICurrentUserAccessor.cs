using FitnessApp.Core.Models;

namespace FitnessApp.Core.Interfaces;

public interface ICurrentUserAccessor
{
    CurrentUser Get();
    Task<CurrentUser> GetFreshAsync(CancellationToken cancellationToken = default);
}