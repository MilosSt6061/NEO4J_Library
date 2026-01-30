using Library.DBManager.Setup;
using Library.Entities.Tools;
using Library.Entities;
using Library.Entities.DTO;

namespace Library.DBManager.Providers
{
    public class IznajmljivanjeProvider
    {
        private readonly Neo4jService _service;
        public IznajmljivanjeProvider(Neo4jService service)
        {
            _service = service;
        }

        public async Task<DBResponse> CreateIznajmljivanje(IznajmljivanjeDTO iz)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(l:Biblioteka {id: $id})")
                    .Create("(u)-[r:IZNAJMIO_U {bookid: $bookid, date: $date, returned: false}]->(l)")
                    .WithParams(new
                    {
                        username = iz.Username,
                        id = iz.LibID,
                        bookid = iz.BookID,
                        date = iz.Date
                    })
                    .Return(r => r.Count())
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

        public async Task<List<IznajmljivanjeDTO>> GetIznajmljivanja(string username)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(u)-[r:IZNAJMIO_U ]->(b)")
                    .WithParam("username", username)
                    .Return((u, r, b) => new IznajmljivanjeDTO
                    {
                        Username = u.As<KorisnikDTO>().Username,
                        LibID = b.As<Biblioteka>().Id,
                        Returned = r.As<IznaljmiljivanjeHelper>().Returned,
                        Date = r.As<IznaljmiljivanjeHelper>().Date,
                        BookID = r.As<IznaljmiljivanjeHelper>().BookID
                    })
                    .ResultsAsync;

                List<IznajmljivanjeDTO> lista = result.ToList();

                return lista;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

            public async Task<List<IznajmljivanjeDTO>> GetIznajmljivanja(string username, string libid)
            {
                try
                {
                    var client = await _service.GetClientAsync();
                    var result = await client.Cypher
                        .Match("(u:Korisnik {username: $username})")
                        .Match("(b:Biblioteka {id: $id})")
                        .Match("(u)-[r:IZNAJMIO_U]->(b)")
                        .WithParams(new {
                            username = username,
                            id = libid
                            })
                        .Return((u, r, b) => new IznajmljivanjeDTO
                        {
                            Username = u.As<KorisnikDTO>().Username,
                            LibID = b.As<Biblioteka>().Id,
                            Returned = r.As<IznaljmiljivanjeHelper>().Returned,
                            Date = r.As<IznaljmiljivanjeHelper>().Date,
                            BookID = r.As<IznaljmiljivanjeHelper>().BookID
                        })
                        .ResultsAsync;

                    List<IznajmljivanjeDTO> lista = result.ToList();

                    return lista;
                }
                catch (Exception ex)
                {
                    return null;
                }
            }

        public async Task<DBResponse> EditIznajmljivanje(string username, string libid)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(l:Biblioteka {id: $id})")
                    .Match("(u)-[r:IZNAJMIO_U]->(l)")
                    .Set("r.returned = true")
                    .WithParams(new
                    {
                        username = username,
                        id = libid
                    })
                    .Return(r => r.Count())
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
    }
}
