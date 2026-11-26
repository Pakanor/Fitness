using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;

namespace FitnessApp.Core.Testing;

public sealed class FakeCurrentUserAccessor : ICurrentUserAccessor
{
    private CurrentUser _currentUser = CurrentUser.Anonymous;
    private CurrentUser? _freshCurrentUser;

    public CurrentUser CurrentUser
    {
        get => _currentUser;
        set => _currentUser = value ?? CurrentUser.Anonymous;
    }

    public CurrentUser? FreshCurrentUser
    {
        get => _freshCurrentUser;
        set => _freshCurrentUser = value;
    }

    public CurrentUser Get() => _currentUser;

    public Task<CurrentUser> GetFreshAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(_freshCurrentUser ?? _currentUser);
}