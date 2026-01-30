using Library.DBManager.Setup;
using Library.Entities;
using Library.Entities.DTO;
using Library.Entities.Tools;
using Neo4jClient.Cypher;

namespace Library.DBManager.Providers
{
    public class OcenaProvider
    {
        private readonly Neo4jService _service;
        public OcenaProvider(Neo4jService service)
        {
            _service = service;
        }
        public async Task<List<OcenaHelper>> GetAllOcenaByBook(string knjigaId)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var ocene = await client.Cypher
                    .Match("(u:Korisnik)-[r:OCENIO]->(k:Knjiga {id: $knjigaId})")
                    .WithParam("knjigaId", knjigaId)
                    .Return(() => new OcenaHelper
                    {
                        username = Return.As<string>("u.username"),
                        ocena = Return.As<int>("r.ocena"),
                        komentar = Return.As<string>("r.komentar")
                    })
                    .ResultsAsync;
                var data = ocene.ToList();
                return data;
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public async Task<OcenaHelper> GetUserOcenaOfBook(string username, string knjigaId)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var ocena = await client.Cypher
                    .Match("(u:Korisnik {username: $username})-[r:OCENIO]->(k:Knjiga {id: $knjigaId})")
                    .WithParams(new
                    {
                        username = username,
                        knjigaId = knjigaId
                    })
                    .Return(() => new OcenaHelper
                    {
                        username = Return.As<string>("u.username"),
                        ocena = Return.As<int>("r.ocena"),
                        komentar = Return.As<string>("r.komentar")
                    })
                    .ResultsAsync;
                return ocena.FirstOrDefault();
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public async Task<DBResponse> CreateOcena(OcenaDTO ocena)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var count = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(k:Knjiga {id: $id})")
                    .Merge("(u)-[r:OCENIO]->(k)")
                    .OnCreate()
                        .Set("r.ocena = $ocena, r.komentar = $komentar")
                    .WithParams(new
                    {
                        username = ocena.username,
                        id = ocena.knjigaId,
                        ocena = ocena.ocena,
                        komentar = ocena.komentar
                    })
                    .Return(r => r.Count())
                    .ResultsAsync;
                bool created = count.Single() == 1;
                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Uspesno kreirana ocena!" : "Ocena nije uspesno kreirana!"
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
        public async Task<DBResponse> UpdateOcena(OcenaDTO ocena)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var count = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(k:Knjiga {id: $id})")
                    .Match("(u)-[r:OCENIO]->(k)")
                    .Set("r.ocena = $ocena, r.komentar = $komentar")
                    .WithParams(new
                    {
                        username = ocena.username,
                        id = ocena.knjigaId,
                        ocena = ocena.ocena,
                        komentar = ocena.komentar
                    })
                    .Return(r => r.Count())
                    .ResultsAsync;
                bool updated = count.Single() == 1;
                return new DBResponse
                {
                    Success = updated,
                    Message = updated ? "Uspesno izmenjena ocena!" : "Ocena nije uspesno izmenjena!"
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
        public async Task<DBResponse> DeleteOcena(string username, string knjigaId)
        {
            try
            {
                var client = await _service.GetClientAsync();
                await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(k:Knjiga {id: $id})")
                    .Match("(u)-[r:OCENIO]->(k)")
                    .Delete("r")
                    .WithParams(new
                    {
                        username = username,
                        id = knjigaId
                    })
                    .ExecuteWithoutResultsAsync();
                return new DBResponse
                {
                    Success = true,
                    Message = "Uspesno obrisana ocena!"
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