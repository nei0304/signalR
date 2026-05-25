using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ChatApi.Data;
using ChatApi.Models;

namespace ChatApi.Services;

public class TokenService
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;

    public TokenService(IConfiguration config, AppDbContext db)
    {
        _config = config;
        _db = db;
    }

    public string CreateAccessToken(int userId, string username)
    {
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15), // access token curto
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Função pra criar token aleatório
    public string GenerateRandomToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    // Cria refresh token, salva no banco e retorna com user
    public async Task<AuthResponse> CreateRefreshTokenAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) throw new Exception("User not found");

        var refreshToken = new RefreshToken
        {
            Token = GenerateRandomToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            UserId = userId
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = CreateAccessToken(user.Id, user.Username),
            RefreshToken = refreshToken.Token,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username
            }
        };
    }

    public async Task<AuthResponse?> RefreshTokenAsync(string token)
    {
        var refreshToken = await _db.RefreshTokens
          .Include(r => r.User)
          .FirstOrDefaultAsync(r => r.Token == token);

        if (refreshToken == null || refreshToken.IsRevoked || refreshToken.ExpiresAt < DateTime.UtcNow)
            return null;

        // Revoga o antigo e cria novo
        refreshToken.IsRevoked = true;

        var newRefresh = new RefreshToken
        {
            Token = GenerateRandomToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            UserId = refreshToken.UserId
        };

        _db.RefreshTokens.Add(newRefresh);
        await _db.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = CreateAccessToken(refreshToken.User.Id, refreshToken.User.Username),
            RefreshToken = newRefresh.Token,
            User = new UserDto
            {
                Id = refreshToken.User.Id,
                Username = refreshToken.User.Username
            }
        };
    }
}

// DTOs de resposta
public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
}