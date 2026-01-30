using Library.DBManager.Setup;
using Library.Entities.Tools;
using Library.Entities;
using Library.Entities.DTO;

namespace Library.DBManager.Providers
{
    public class BibliotekaProvider
    {
        private readonly Neo4jService _service;
        public BibliotekaProvider(Neo4jService service)
        {
            _service = service;
        }


        public async Task<DBResponse> InsertLibrary(Biblioteka lib)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                .Create("(a:Biblioteka {id: $id, name: $name, address: $address})")
                .WithParams(new
                {
                    id = Guid.NewGuid().ToString(),
                    name = lib.Naziv,
                    address = lib.Adresa
                })
                .Return(a => a.Count())
                .ResultsAsync;

                bool created = result.Single() == 1;

                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Uspesno kreirano" : "Postojeci id"
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

        public async Task<DBResponse> DeleteLibrary(string id)
        {
            try
            {
                var client = await _service.GetClientAsync();
                client.Cypher
                    .Match("(u:Biblioteka {id: $id})")
                    .WithParam("id", id)
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

        public async Task<DBResponse> EditLibrary(Biblioteka lib)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var updated = await client.Cypher
                    .Match("(u:Biblioteka {id: $id})")
                    .WithParam("id", lib.Id)
                    .Set("u.name = $name, u.address = $address")
                    .WithParams(new
                    {
                        name = lib.Naziv,
                        address = lib.Adresa
                    })
                    .Return<int>("count(u)")
                    .ResultsAsync;

                bool success = updated.Single() == 1;

                return new DBResponse
                {
                    Success = success,
                    Message = success ? "Biblioteka je ažurirana" : "Biblioteka ne postoji"
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

        public async Task<Biblioteka> GetLibrary(string id)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(k:Biblioteka)")
                    .Where("k.id IS NOT NULL AND k.id =~ $id")
                    .WithParam("id", id)
                    .Return(k => k.As<Biblioteka>())
                    .ResultsAsync;

                var lib = result.FirstOrDefault();

                return lib;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<List<Biblioteka>> GetLibraryList()
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(k:Biblioteka)")
                    .Return(k => k.As<Biblioteka>())
                    .ResultsAsync;

                var lista = result.ToList();

                return lista;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}
