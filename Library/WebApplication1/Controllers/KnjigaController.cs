using Library.DBManager.Providers;
using Library.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Library.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KnjigaController : ControllerBase
    {
        KnjigaProvider knjigaProvider { get; set; }
        public KnjigaController(KnjigaProvider knjigaProvider)
        {
            this.knjigaProvider = knjigaProvider;
        }

        [HttpGet("ListaKnjiga")]
        public async Task<IActionResult> ListaKnjiga()
        {
            try
            {
                return Ok(knjigaProvider.GetAllBooks());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("ListaKnjiga/{naziv}")]
        public async Task<IActionResult> ListaKnjiga(string naziv)
        {
            try
            {
                return Ok(knjigaProvider.GetBooksByName(naziv));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPost("KreirajKnjigu")]
        public async Task<IActionResult> KreirajKnjigu([FromBody] Knjiga knjiga)
        {
            try
            {
                var response = await knjigaProvider.CreateKnjiga(knjiga);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPut("IzmeniKnjigu")]
        public async Task<IActionResult> IzmeniKnjigu([FromBody] Knjiga knjiga)
        {
            try
            {
                var response = await knjigaProvider.UpdateKnjiga(knjiga);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpDelete("ObrisiKnjigu/{id}")]
        public async Task<IActionResult> ObrisiKnjigu(string id)
        {
            try
            {
                var response = await knjigaProvider.DeleteKnjiga(id);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}