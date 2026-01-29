using Library.DBManager.Setup;
using Library.Entities;
using Library.Entities.DTO;
using Library.Entities.Tools;
using Neo4jClient.Cypher;
using Newtonsoft.Json.Linq;
using System.Xml.Linq;

namespace Library.DBManager.Providers
{
    public class KorisnikProvider
    {
        private readonly Neo4jService _service;
        public KorisnikProvider(Neo4jService service)
        {
            _service = service;
        }

        public async Task<DBResponse> InsertUser(Korisnik user)
        {
            try
            {
                var Password = BCrypt.Net.BCrypt.HashPassword(user.Password, workFactor: 11);
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                .Merge("(a:Korisnik {username: $username})")
                .OnCreate()
                    .Set("a.name = $name, a.lastname = $lastname, a.password = $password, a.email = $email, a.number = $number, a.role = 'user', a._created = true")
                .OnMatch()
                    .Set("a._created = false")
                .WithParams(new
                {
                    username = user.Username,
                    name = user.Name,
                    password = Password,
                    lastname = user.Lastname,
                    email = user.Email,
                    number = user.Number
                })
                .Return(a => a.As<dynamic>())
                .ResultsAsync;

                bool created = result.Single()._created;

                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Uspesno kreirano" : "Postojeci Username"
                };
            }
            catch (Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<TokenData> ConfirmUser(LoginData login)
        {
            try
            {
                
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(k:Korisnik)")
                    .Where("k.username IS NOT NULL AND k.name =~ $username")
                    .WithParam("username",login.Username)
                    .Return(a => a.As<Korisnik>())
                    .ResultsAsync;
                
                var user = result.FirstOrDefault();

                if (user == null) {
                    return new TokenData
                    {
                        IsAuthenticated = false,
                        InvalidMessage = "Korisnicko ime nije pronadjeno"
                    };
                }

                bool isValid = BCrypt.Net.BCrypt.Verify(login.Password, user.Password);

                if (!isValid)
                {
                    return new TokenData
                    {
                        IsAuthenticated = false,
                        InvalidMessage = "Lozinka se ne podudara"
                    };
                }

                return new TokenData
                {
                    IsAuthenticated = true,
                    Username = login.Username,
                    Role = user.Role
                };
            }
            catch (Exception ex)
            {
                return new TokenData
                {
                    IsAuthenticated = false,
                    InvalidMessage = ex.Message
                };
            }
        }

        public async Task<KorisnikDTO> UserData(string username)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(k:Korisnik)")
                    .Where("k.username IS NOT NULL AND k.username =~ $username")
                    .WithParam("username", username)
                    .Return(a => a.As<Korisnik>())
                    .ResultsAsync;

                var user = result.FirstOrDefault();

                return new KorisnikDTO
                {
                    Username = user.Username,
                    Name = user.Name,
                    Lastname = user.Lastname,
                    Number = user.Number,
                    Email = user.Email
                };
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<DBResponse> DeleteUser(string username)
        {
            try
            {
                var client = await _service.GetClientAsync();
                client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .WithParam("username", username)
                    .DetachDelete("u")
                    .ExecuteWithoutResultsAsync();


                return new DBResponse
                {
                    Success = true,
                    Message = "Brisanje izvrseno"
                };
            }
            catch (Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<List<KorisnikDTO>> GetUserList()
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(k:Korisnik)")
                    .Return(a => a.As<Korisnik>())
                    .ResultsAsync;

                List<KorisnikDTO> lista = new List<KorisnikDTO>();

                foreach (var item in result)
                {
                    lista.Add(new KorisnikDTO
                    {
                        Username = item.Username,
                        Name = item.Name,
                        Lastname = item.Lastname,
                        Email = item.Email,
                        Number = item.Number
                    }
                        );
                }

                return lista;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<DBResponse> EditPassword(string username, string oldPassword, string newPassword)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(k:Korisnik)")
                    .Where("k.username IS NOT NULL AND k.name =~ $username")
                    .WithParam("username", username)
                    .Return(a => a.As<Korisnik>())
                    .ResultsAsync;

                var u = result.FirstOrDefault();

                if (u == null)
                {
                    return new DBResponse
                    {
                        Success = false,
                        Message = "Korisnicko ime nije pronadjeno"
                    };
                }

                bool isValid = BCrypt.Net.BCrypt.Verify(oldPassword, u.Password);

                if (!isValid)
                {
                    return new DBResponse
                    {
                        Success = false,
                        Message = "Lozinka se ne podudara"
                    };
                }

                var updated = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .WithParam("username", username)
                    .Set("u.password = $password")
                    .WithParam("password", newPassword)
                    .Return<int>("count(u)")
                    .ResultsAsync;

                bool success = updated.Single() == 1;

                return new DBResponse
                {
                    Success = success,
                    Message = success ? "Lozinka je promenjena" : "Korisnik ne postoji"
                };
            }
            catch (Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<DBResponse> EditUser(KorisnikDTO user)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var updated = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .WithParam("username", user.Username)
                    .Set("u.name = $name, u.lastname = $lastname, u.email = $email, u.number = $number")
                    .WithParams(new
                    {
                        name = user.Name,
                        lastname = user.Lastname,
                        email = user.Email,
                        number = user.Number
                    })
                    .Return<int>("count(u)")
                    .ResultsAsync;

                bool success = updated.Single() == 1;

                return new DBResponse
                {
                    Success = success,
                    Message = success ? "Korisnik je ažuriran" : "Korisnik ne postoji"
                };
            }
            catch (Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }
    }
}
