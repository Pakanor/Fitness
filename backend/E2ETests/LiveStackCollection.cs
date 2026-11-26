using Xunit;

namespace FitnessApp.E2ETests;

[CollectionDefinition("LiveStack")]
public sealed class LiveStackCollection : ICollectionFixture<EmptyFixture>
{
}

public sealed class EmptyFixture { }
