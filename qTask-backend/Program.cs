using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using QtechOJT_Net9.Database;
using Scalar.AspNetCore;
using QtechOJT_Net9.Models;
using QtechOJT_Net9.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSignalR();
builder.Services.AddControllers();

// ===== CORS CONFIGURATION =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://192.168.1.10:5173",
                "http://198.71.60.22:5173",
                "http://198.71.60.22:80"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddOpenApi();

builder.Services.AddDbContext<KanbanDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.ConfigureWarnings(warnings =>
        warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
});

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
    o.MultipartBodyLengthLimit = 10 * 1024 * 1024);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapScalarApiReference();
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");

// Serve static files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();

// Map API endpoints
app.MapControllers();
app.MapHub<KanbanHub>("/hubs/kanban");

// ===== CUSTOM MIDDLEWARE FOR REACT ROUTER =====
// This handles all routes that don't match API or static files
app.Use(async (context, next) =>
{
    await next();

    // Only handle 404 responses
    if (context.Response.StatusCode == 404)
    {
        var path = context.Request.Path.Value ?? "";

        // Don't interfere with API or Hubs
        if (!path.StartsWith("/api") && !path.StartsWith("/hubs"))
        {
            var indexPath = Path.Combine(app.Environment.WebRootPath, "index.html");
            if (File.Exists(indexPath))
            {
                context.Response.StatusCode = 200;
                context.Response.ContentType = "text/html";
                await context.Response.SendFileAsync(indexPath);
            }
        }
    }
});

app.Run();