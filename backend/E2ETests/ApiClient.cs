using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace FitnessApp.E2ETests;

/// <summary>
/// HTTP client against the live Gateway (http://localhost:8000) that automatically
/// tracks cookies so the __Host-FitnessApp-Auth / FitnessApp-Auth session cookie
/// issued by AuthAPI is replayed on every request.
/// </summary>
public sealed class ApiClient : IDisposable
{
    private readonly HttpClient _http;
    private readonly CookieContainer _cookies = new();
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    public ApiClient(string baseUrl)
    {
        var handler = new HttpClientHandler
        {
            CookieContainer = _cookies,
            UseCookies = true,
            AllowAutoRedirect = false,
        };
        _http = new HttpClient(handler) { BaseAddress = new Uri(baseUrl) };
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public Uri BaseAddress => _http.BaseAddress!;
    public CookieContainer CookieContainer => _cookies;

    /// <summary>Value of the auth cookie issued by AuthAPI login, if any.</summary>
    public string? AuthCookie => _cookies.GetCookies(BaseAddress)["FitnessApp-Auth"]?.Value;

    public Task<ApiResponse> GetAsync(string path) => SendAsync(HttpMethod.Get, path, null);
    public Task<ApiResponse> PostAsync(string path, object? body) => SendAsync(HttpMethod.Post, path, body);
    public Task<ApiResponse> PutAsync(string path, object? body) => SendAsync(HttpMethod.Put, path, body);
    public Task<ApiResponse> PatchAsync(string path, object? body) => SendAsync(HttpMethod.Patch, path, body);
    public Task<ApiResponse> DeleteAsync(string path) => SendAsync(HttpMethod.Delete, path, null);

    private async Task<ApiResponse> SendAsync(HttpMethod method, string path, object? body)
    {
        using var req = new HttpRequestMessage(method, path);
        if (body is not null)
        {
            req.Content = new StringContent(JsonSerializer.Serialize(body, JsonOpts), Encoding.UTF8, "application/json");
        }
        using var res = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
        string bodyText = await res.Content.ReadAsStringAsync();
        return new ApiResponse(res.StatusCode, bodyText);
    }

    public T? ParseJson<T>(string body) =>
        string.IsNullOrWhiteSpace(body) ? default : JsonSerializer.Deserialize<T>(body, JsonOpts);

    public void Dispose() => _http.Dispose();
}

public sealed record ApiResponse(HttpStatusCode StatusCode, string Body);
