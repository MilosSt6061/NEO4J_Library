using Library.DBManager.Providers;
using Library.Entities;
using Library.Entities.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Library.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BibliotekaController : ControllerBase
    {
        BibliotekaProvider bibliotekaProvider { get; set; }

        public BibliotekaController(BibliotekaProvider b)
        {
            bibliotekaProvider = b;
        }

        [HttpGet("Lib_info/{id}")]
        public async Task<IActionResult> VratiPodatke(string id)
        {
            try
            {
                return Ok(bibliotekaProvider.GetLibrary(id));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPost("Lib_add")]
        public async Task<IActionResult> InsertLibrary([FromBody] Biblioteka lib)
        {
            try
            {
                var response = await bibliotekaProvider.InsertLibrary(lib);
                if (response.Success == false)
                {
                    return BadRequest(response.Message);
                }
                return Ok(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("Lib_all")]
        public IActionResult SviKorisnici()
        {
            try
            {
                return Ok(bibliotekaProvider.GetLibraryList());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPut("Lib_edit")]
        public async Task<IActionResult> EditAccount([FromBody] Biblioteka lib)
        {
            try
            {
                var response = await bibliotekaProvider.EditLibrary(lib);
                if (response.Success == false)
                {
                    return BadRequest(response.Message);
                }
                return Ok(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpDelete("Lib_del/{id}")]
        public async Task<IActionResult> DeleteAccount(string id)
        {
            try
            {
                var response = await bibliotekaProvider.DeleteLibrary(id);
                if (response.Success == false)
                {
                    return BadRequest(response.Message);
                }
                return Ok("Uspesno ste obrisali nalog");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
