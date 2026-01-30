using Library.DBManager.Setup;
using Library.Entities;
using Library.Entities.DTO;
using Library.Entities.Tools;
using Neo4jClient.Cypher;

namespace Library.DBManager.Providers
{
    public class UclanjenProvider
    {
        private readonly Neo4jService _service;
        public UclanjenProvider(Neo4jService service)
        {
            _service = service;
        }
        public async Task<List<KorisnikDTO>> GetUsersOfLibrary(string bibliotekaId)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var data = await client.Cypher
                    .Match("(b:Biblioteka {id: $id})")
                    .Match("(u)-[r:UCLANJEN]->(b)")
                    .WithParams(new
                    {
                        id = bibliotekaId
                    })
                    .Return(() => new KorisnikDTO
                    {
                        Username = Return.As<string>("u.username"),
                        Name = Return.As<string>("u.name"),
                        Lastname = Return.As<string>("u.lastname"),
                        Email = Return.As<string>("u.email"),
                        Number = Return.As<string>("u.number"),
                    })
                    .ResultsAsync;
                return data.ToList();
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public async Task<DBResponse> CreateUclanjen(string username, string bibliotekaId)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var count = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(b:Biblioteka {id: $id})")
                    .Merge("(u)-[r:UCLANJEN]->(b)")
                    .WithParams(new
                    {
                        username = username,
                        id = bibliotekaId
                    })
                    .Return(r => r.Count())
                    .ResultsAsync;
                bool created = count.Single() == 1;
                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Korisnik je uspesno uclanjen!" : "Korisnik nije uspesno uclanjen!"
                };
            }
            catch(Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }
        public async Task<DBResponse> DeleteUclanjen(string username, string bibliotekaId)
        {
            try
            {
                var client = await _service.GetClientAsync();
                await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(b:Biblioteka {id: $id})")
                    .Match("(u)-[r:UCLANJEN]->(b)")
                    .Delete("r")
                    .WithParams(new
                    {
                        username = username,
                        id = bibliotekaId
                    })
                    .ExecuteWithoutResultsAsync();
                return new DBResponse
                {
                    Success = true,
                    Message = "Korisnik prekinuo clanstvo!"
                };
            }
            catch(Exception ex)
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