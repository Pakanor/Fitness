using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace FitnessApp.Core.Services;

public static class FitnessAppAuthExtensions
{
    public const string AuthCookieName = "FitnessApp-Auth";
    public const string CorsPolicyName = "FitnessAppAuth";
    private static readonly string[] DefaultOrigins = { "http://localhost:3000", "http://localhost:8000" };

    public sealed class JwtSettings
    {
        public string Key { get; init; } = string.Empty;
        public string Issuer { get; init; } = string.Empty;
        public string Audience { get; init; } = string.Empty;
    }

    public static JwtSettings ReadJwtSettings(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not set.");
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer is not set.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience is not set.");

        return new JwtSettings
        {
            Key = key,
            Issuer = issuer,
            Audience = audience
        };
    }

    public static IServiceCollection AddFitnessAuth(this IServiceCollection services, IConfiguration configuration)
    {
        _ = ReadJwtSettings(configuration);
        AddFitnessCors(services);
        return services;
    }

    public static IServiceCollection AddFitnessAuthAsAuthApi(this IServiceCollection services, IConfiguration configuration)
    {
        AddFitnessAuth(services, configuration);
        return services;
    }

    public static IServiceCollection AddFitnessAuthAsGateway(this IServiceCollection services, IConfiguration configuration)
    {
        AddFitnessAuth(services, configuration);

        var jwt = ReadJwtSettings(configuration);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key))
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (context.Request.Cookies.TryGetValue(AuthCookieName, out var token))
                        {
                            context.Token = token;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        return services;
    }

    public static IServiceCollection AddFitnessAuthAsExerciseApi(this IServiceCollection services, IConfiguration configuration)
    {
        AddFitnessAuth(services, configuration);
        return services;
    }

    private static void AddFitnessCors(IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, policy =>
            {
                policy.WithOrigins(DefaultOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });
    }
}
