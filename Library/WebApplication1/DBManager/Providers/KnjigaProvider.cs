using Library.DBManager.Setup;
using Library.Entities;
using Library.Entities.Tools;

namespace Library.DBManager.Providers
{
    public class KnjigaProvider
    {
        private readonly Neo4jService _service;
        public KnjigaProvider(Neo4jService service)
        {
            _service = service;
        }
        public async Task<List<Knjiga>> GetAllBooks()
        {
            try
            {
                var client = await _service.GetClientAsync();
                var knjige = await client.Cypher
                    .Match("(k:Knjiga)")
                    .Return(k => k.As<Knjiga>())
                    .ResultsAsync;
                var data = knjige.ToList();
                return data;
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public async Task<List<Knjiga>> GetBooksByName(string naziv)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var knjige = await client.Cypher
                    .Match("(k:Knjiga)")
                    .Where("k.naziv is not null and k.naziv =~ $naziv")
                    .WithParam("naziv", naziv)
                    .Return(k => k.As<Knjiga>())
                    .ResultsAsync;
                var data = knjige.ToList();
                return data;
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public async Task<DBResponse> CreateKnjiga(Knjiga knjiga)
        {
            try
            {
                var client = await _service.GetClientAsync();
                knjiga.id = Guid.NewGuid().ToString();
                var count = await client.Cypher
                    .Create("(k:Knjiga {id: $id, naziv: $naziv, zanr: $zanr, godinaIznavanja: $godinaIzdavanja, opis: $opis})")
                    .WithParams(new
                    {
                        id = knjiga.id,
                        naziv = knjiga.naziv,
                        zanr = knjiga.zanr,
                        godinaIzdavanja = knjiga.godinaIzdavanja,
                        opis = knjiga.opis
                    })
                    .Return(k => k.Count())
                    .ResultsAsync;
                bool created = count.Single() == 1;
                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Uspesno kreirana knjiga!" : "Knjiga nije uspesno kreirana!"
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
        public async Task<DBResponse> UpdateKnjiga(Knjiga knjiga)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var book = await client.Cypher
                    .Match("(k:Knjiga)")
                    .Where("k.id is not null and k.id =~ $id")
                    .WithParam("id", knjiga.id)
                    .Set("k.naziv = $naziv, k.zanr = $zanr, k.godinaIznavanja = $godinaIzdavanja, k.opis = $opis")
                    .WithParams(new
                    {
                        naziv = knjiga.naziv,
                        zanr = knjiga.zanr,
                        godinaIzdavanja = knjiga.godinaIzdavanja,
                        opis = knjiga.opis
                    })
                    .Return(k => k.As<Knjiga>())
                    .ResultsAsync;
                bool updated = book == knjiga;
                return new DBResponse
                {
                    Success = updated,
                    Message = updated ? "Uspesno izmenjena knjiga!" : "Knjiga nije uspesno izmenjena!"
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
        public async Task<DBResponse> DeleteKnjiga(string id)
        {
            try
            {
                var client = await _service.GetClientAsync();
                await client.Cypher
                    .Match("(k:Knjiga)")
                    .Where("k.id is not null and k.id =~ $id")
                    .WithParam("id", id)
                    .DetachDelete("k")
                    .ExecuteWithoutResultsAsync();
                return new DBResponse
                {
                    Success = true,
                    Message = "Uspesno obrisana knjiga!"
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