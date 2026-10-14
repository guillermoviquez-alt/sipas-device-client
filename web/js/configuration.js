const default_client_title = "SIPAS";
const default_client_version=4;
const defaul_client_language="en";
const api_public_url="https://sipas-backend.panam.ed.cr/v4/api_public/";
const api_private_v4_url="https://sipas-backend.panam.ed.cr/v4/api_private/";
const frontend_url="https://sipas.panam.ed.cr";
const backend_url="https://sipas-backend.panam.ed.cr";
const device_uid=getLocalVariable("device_uid");
let client_version=getLocalVariable("client_version");
let session_uid="35879dd4964fe6a6eb0b9c714e2cda2d";
let contained_sipas=false;
let pendientes=false;
let ubicacion_actual=window.location.pathname;
let session_info=null;
let me=null;
let access_right_system_module_list=null;
let full_access_right_system_module_list=null;
let open_module_code=null;
let open_action_code=null;
let url_parts=window.location.href.replace(frontend_url+"/","").split("/");
let intervals={
    car_queue:null,
    date:null,
    scan_timer:null
};
let keep_loader=false;
let editorFunctionOnClose=null;

let timer=10;
let device_info=null;
let space_info=null;

let mostrando_persona=false;
let no_persona=null;
let persona=null;
var cantidad_hijos=0;
var cantidad_hijos_presionados=0;