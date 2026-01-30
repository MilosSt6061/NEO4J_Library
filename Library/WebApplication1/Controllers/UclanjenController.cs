using Library.DBManager.Providers;
using Library.Entities;
using Library.Entities.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Library.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UclanjenController : ControllerBase
    {
        UclanjenProvider uclanjenProvider { get; set; }
        public UclanjenController(UclanjenProvider uclanjenProvider)
        {
            this.uclanjenProvider = uclanjenProvider;
        }

        [HttpGet("VratiKorisnikeBiblioteke/{bibliotekaId}")]
        public async Task<IActionResult> VratiAutoreKnjige(string bibliotekaId)
        {
            try
            {
                var response = await uclanjenProvider.GetUsersOfLibrary(bibliotekaId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("KreirajUclanjen/{username}/{bibliotekaId}")]
        public async Task<IActionResult> KreirajUclanjen(string username, string bibliotekaId)
        {
            try
            {
                var response = await uclanjenProvider.CreateUclanjen(username, bibliotekaId);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpDelete("ObrisiUclanjen/{username}/{bibliotekaId}")]
        public async Task<IActionResult> ObrisiUclanjen(string username, string bibliotekaId)
        {
            try
            {
                var response = await uclanjenProvider.DeleteUclanjen(username, bibliotekaId);
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