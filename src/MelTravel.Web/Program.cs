using System.Text.Json;
using MelTravel.Web.Domain;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.WriteIndented = true;
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

string appDataDir = Path.Combine(app.Environment.ContentRootPath, "App_Data");
string profileFilePath = Path.Combine(appDataDir, "user-profile.local.json");

app.MapGet("/api/catalog", () => Results.Ok(new
{
    provinces = TravelCatalog.Provinces,
    airports = TravelCatalog.Airports,
    aircraftModels = TravelCatalog.AircraftModels
}));

app.MapGet("/api/profile", () =>
{
    if (File.Exists(profileFilePath))
    {
        try
        {
            var json = File.ReadAllText(profileFilePath);
            var saved = JsonSerializer.Deserialize<UserProfileState>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            if (saved is not null)
                return Results.Ok(saved);
        }
        catch
        {
            // Fall back to default seed profile if local file is corrupted
        }
    }

    return Results.Ok(TravelCatalog.CreateDefaultMelihProfile());
});

app.MapPost("/api/profile", async (HttpContext ctx) =>
{
    var state = await ctx.Request.ReadFromJsonAsync<UserProfileState>();
    if (state is null)
        return Results.BadRequest(new { error = "Geçersiz profil verisi." });

    Directory.CreateDirectory(appDataDir);
    var json = JsonSerializer.Serialize(state, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    });
    await File.WriteAllTextAsync(profileFilePath, json);
    return Results.Ok(state);
});

app.MapGet("/api/distance", (string from, string to) =>
{
    int km = TravelCatalog.CalculateDistanceBetweenAirports(from, to);
    return Results.Ok(new { from, to, distanceKm = km });
});

app.Run();

public partial class Program { }
