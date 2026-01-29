using Library.DBManager.Providers;
using Library.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Library.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AutorController : ControllerBase
    {
        AutorProvider autorProvider { get; set; }
        public AutorController(AutorProvider autorProvider)
        {
            this.autorProvider = autorProvider;
        }

        [HttpGet("ListaAutora")]
        public async Task<IActionResult> ListaAutora()
        {
            try
            {
                return Ok(autorProvider.GetAllAutors());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("ListaAutora/{ime}")]
        public async Task<IActionResult> ListaAutora(string ime)
        {
            try
            {
                return Ok(autorProvider.GetAuthorsByName(ime));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPost("KreirajAutora")]
        public async Task<IActionResult> KreirajAutora([FromBody] Autor autor)
        {
            try
            {
                var response = await autorProvider.CreateAuthor(autor);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPut("IzmeniAutora")]
        public async Task<IActionResult> IzmeniAutora([FromBody] Autor autor)
        {
            try
            {
                var response = await autorProvider.UpdateAuthor(autor);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpDelete("ObrisiAutora/{id}")]
        public async Task<IActionResult> ObrisiAutora(string id)
        {
            try
            {
                var response = await autorProvider.DeleteAuthor(id);
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