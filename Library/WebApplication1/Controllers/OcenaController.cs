using Library.DBManager.Providers;
using Library.Entities;
using Library.Entities.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Library.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OcenaController : ControllerBase
    {
        OcenaProvider ocenaProvider { get; set; }
        public OcenaController(OcenaProvider ocenaProvider)
        {
            this.ocenaProvider = ocenaProvider;
        }

        [HttpGet("ListaOcena/{knjigaId}")]
        public async Task<IActionResult> ListaOcena(string knjigaId)
        {
            try
            {
                var response = await ocenaProvider.GetAllOcenaByBook(knjigaId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("KorisnikovaOcenaKnjige/{username}/{knjigaId}")]
        public async Task<IActionResult> KorisnikovaOcenaKnjige(string username, string knjigaId)
        {
            try
            {
                var response = await ocenaProvider.GetUserOcenaOfBook(username, knjigaId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("KreirajOcenu")]
        public async Task<IActionResult> KreirajOcenu([FromBody] OcenaDTO ocena)
        {
            try
            {
                var response = await ocenaProvider.CreateOcena(ocena);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPut("IzmeniOcenu")]
        public async Task<IActionResult> IzmeniOcenu([FromBody] OcenaDTO ocena)
        {
            try
            {
                var response = await ocenaProvider.UpdateOcena(ocena);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpDelete("ObrisiOcenu/{username}/{knjigaId}")]
        public async Task<IActionResult> ObrisiOcenu(string username, string knjigaId)
        {
            try
            {
                var response = await ocenaProvider.DeleteOcena(username, knjigaId);
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