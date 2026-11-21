using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;
using System.Net.Http.Json;

namespace ExerciseAPI.Services;

public sealed class RemoteSessionValidator : ISessionValidator
{
    private readonly HttpClient _httpClient;

    public RemoteSessionValidator(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<bool> ValidateSessionAsync(SessionId sessionId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/auth/sessions/validate/{sessionId.Value}", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }
}