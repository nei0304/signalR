using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using ChatApi.Data;
using ChatApi.Models;
using ChatApi.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Banco de dados
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite("Data Source=chat.db"));

// 2. JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(opt => {
       opt.TokenValidationParameters = new TokenValidationParameters {
           ValidateIssuerSigningKey = true,
           IssuerSigningKey = new SymmetricSecurityKey(
               Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
           ValidateIssuer = false,
           ValidateAudience = false,
           ClockSkew = TimeSpan.Zero
       };

       // SignalR lê token do query string
       opt.Events = new JwtBearerEvents {
           OnMessageReceived = context => {
               var accessToken = context.Request.Query["access_token"];
               var path = context.HttpContext.Request.Path;
               if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chat"))
               {
                   context.Token = accessToken;
               }
               return Task.CompletedTask;
           }
       };
   });

builder.Services.AddAuthorization();
builder.Services.AddScoped<TokenService>();

// 3. CORS pro React
builder.Services.AddCors(opt => {
    opt.AddDefaultPolicy(p => p
    .WithOrigins("http://localhost:5173")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials());
});

// 4. SignalR
builder.Services.AddSignalR();

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// 5. Endpoints de Auth
app.MapPost("/register", async (AppDbContext db, User user) => {
    if (await db.Users.AnyAsync(u => u.Username == user.Username))
        return Results.BadRequest(new { error = "Usuário já existe" });

    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Usuário criado" });
});

app.MapPost("/login", async (AppDbContext db, TokenService tokenService, User login) => {
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == login.Username);
    if (user == null ||!BCrypt.Net.BCrypt.Verify(login.PasswordHash, user.PasswordHash))
        return Results.Unauthorized();

    var authResponse = await tokenService.CreateRefreshTokenAsync(user.Id);
    return Results.Ok(authResponse);
});

app.MapPost("/refresh", async (TokenService tokenService, RefreshRequest req) => {
    var result = await tokenService.RefreshTokenAsync(req.RefreshToken);
    return result == null? Results.Unauthorized() : Results.Ok(result);
});

app.MapGet("/me", [Authorize] (ClaimsPrincipal user) => {
    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var username = user.FindFirst(ClaimTypes.Name)?.Value;
    return Results.Ok(new { id = userId, username });
});

app.MapPost("/logout", [Authorize] async (AppDbContext db, RefreshRequest req) => {
    var token = await db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == req.RefreshToken);
    if (token!= null)
    {
        token.IsRevoked = true;
        await db.SaveChangesAsync();
    }
    return Results.Ok(new { message = "Logout feito" });
});

// 6. SignalR Hub
app.MapHub<ChatHub>("/chat");

app.Run();

// Records
public record RefreshRequest(string RefreshToken);

// Hub com Auth + Persistência
[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _db;

    public ChatHub(AppDbContext db)
    {
        _db = db;
    }

    public async Task JoinRoom(string room)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, room);

        var history = await _db.Messages
         .Where(m => m.Room == room)
         .OrderByDescending(m => m.SentAt)
         .Take(50)
         .OrderBy(m => m.SentAt)
         .Select(m => new {
              m.Id,
              m.Room,
              m.Username,
              m.Content,
              m.SentAt
          })
         .ToListAsync();

        await Clients.Caller.SendAsync("LoadHistory", history);

        var username = Context.User?.Identity?.Name?? "Anon";
        await Clients.Group(room).SendAsync("UserJoined", username);
    }

    public async Task SendMessage(string room, string message)
    {
        var username = Context.User?.Identity?.Name?? "Anon";
        var userId = int.Parse(Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value?? "0");

        var msg = new Message {
            Room = room,
            Username = username,
            Content = message,
            SentAt = DateTime.UtcNow
        };

        _db.Messages.Add(msg);
        await _db.SaveChangesAsync();

        await Clients.Group(room).SendAsync("ReceiveMessage", new {
            msg.Id,
            msg.Room,
            msg.Username,
            msg.Content,
            msg.SentAt
        });
    }

    public async Task Typing(string room)
    {
        var username = Context.User?.Identity?.Name?? "Anon";
        await Clients.OthersInGroup(room).SendAsync("UserTyping", username);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var username = Context.User?.Identity?.Name?? "Anon";
        await Clients.All.SendAsync("UserLeft", username);
        await base.OnDisconnectedAsync(exception);
    }
}