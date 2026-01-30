using Library.DBManager.Setup;
using Library.Entities.Tools;
using Library.Entities;
using Library.Entities.DTO;
using System.Net;

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
                    .Match("(l:Biblioteka {id: $lid})")
                    .Match("(b:Knjiga {id: $bid})")
                    .Match("(u)-[:UCLANJEN]->(l)-[p:POSEDUJE]->(b)")
                    .Where("p.br_iz < p.br_primeraka")
                    .Create("(u)-[i:IZNAJMIO_U {bookid: $bid, date: $date, returned: false}]->(l)")
                    .Set("p.br_iz = coalesce(p.br_iz, 0) + 1")
                    .WithParams(new
                    {
                        username = iz.Username,
                        lid = iz.LibID,
                        bid = iz.BookID,
                        date = iz.Date
                    })
                    .Return(i => i.As<IznajmljivanjeDTO>())
                    .ResultsAsync;

                bool created = result.Any();

                return new DBResponse
                {
                    Success = created,
                    Message = created? "Uspesno kreirano" : "Nema dostupnih primeraka ili korisnik nije učlanjen"
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

        public async Task<DBResponse> EditIznajmljivanje(string username, string libid, string bookid)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(u:Korisnik {username: $username})")
                    .Match("(l:Biblioteka {id: $lid})")
                    .Match("(b:Knjiga {id: $bid})")
                    .Match("(u)-[i:IZNAJMIO_U {bookid: $bid, returned: false}]->(l)-[p:POSEDUJE]->(b)")
                    .With("i, p")
                    .OrderBy("i.date ASC")
                    .Limit(1)
                    .Set("i.returned = true")
                    .Set("p.br_iz = coalesce(p.br_iz, 0) - 1")
                    .WithParams(new
                    {
                        username = username,
                        lid = libid,
                        bid = bookid   
                    })
                    .Return(i => i.As<IznajmljivanjeDTO>())
                    .ResultsAsync;

                bool created = result.Any();

                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Uspesno ste vratili knjigu" : "Knjiga nije iznajmljena ili korisnik nije učlanjen"
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
