using AuthAPI.DataAccess;
using AuthAPI.Interfaces;
using AuthAPI.Services;
using AuthAPI.Services.Validators;
using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AnthropometryService>();
builder.Services.AddScoped<UserLogrepository>();
builder.Services.AddScoped<SessionValidator>();
builder.Services.AddScoped<ISessionValidator, SessionValidator>();
builder.Services.AddScoped<ClaimsCurrentUserAccessor>();
builder.Services.AddScoped<ICurrentUserAccessor, FreshCurrentUserAccessor>();

builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();

builder.Services.AddHttpContextAccessor();

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});
builder.Services.AddFitnessAuthAsAuthApi(builder.Configuration);

var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD")
                 ?? throw new InvalidOperationException(
                     "DB_PASSWORD is not set. Provide it as an environment variable.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql($"Host=localhost;Port=5442;Database=auth;Username=fitnessapp;Password={dbPassword}"));
    /*tu w dockerze pozniej host=db-auth*/

var app = builder.Build();

app.UseCors(FitnessAppAuthExtensions.CorsPolicyName);
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    db.Database.Migrate();
}

app.Run();