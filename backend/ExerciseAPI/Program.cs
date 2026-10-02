using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using ExerciseAPI.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
var builder = WebApplication.CreateBuilder(args);

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";


builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "AuthAPI",
            ValidateAudience = true,
            ValidAudience = "FitnessAppUsers", 
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("SUPER_SECRET_KEY_123456789012345678901234567890"))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                    if (context.Request.Cookies.ContainsKey("FitnessApp-Auth"))
                    {
                        context.Token = context.Request.Cookies["FitnessApp-Auth"];
                    }
                return Task.CompletedTask;
            }
        };
    });



builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD")
                 ?? throw new InvalidOperationException(
                     "DB_PASSWORD is not set. Provide it as an environment variable.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql($"Host=localhost;Port=5443;Database=exercise;Username=fitnessapp;Password={dbPassword}"));
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<ExerciseDbImportService>();
builder.Services.AddHostedService<ExerciseStartupSeeder>();
builder.Services.AddScoped<OneRepMaxCalculator>();
builder.Services.AddScoped<RecordsService>();
builder.Services.AddScoped<ExerciseAPI.Interfaces.ITemplateService, ExerciseAPI.Services.TemplateService>();
builder.Services.AddScoped<ExerciseAPI.Interfaces.IWorkoutStartModeService, ExerciseAPI.Services.WorkoutStartModeService>();
builder.Services.AddScoped<ExerciseAPI.Interfaces.IWorkoutStatusService, ExerciseAPI.Services.WorkoutStatusService>();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

var app = builder.Build();

app.UseCors(MyAllowSpecificOrigins);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseStaticFiles();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    db.Database.Migrate();
}


app.Run();
